"""AlignSync 种子数据脚本

用法: cd backend && python -m scripts.seed_data

创建演示账号、角色、权限、产品目录等基础数据。
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from sqlalchemy import select, delete
from app.db.base import async_session, engine, Base
from app.models.enterprise import Enterprise
from app.models.user import User, Role, Permission, UserRole, RolePermission
from app.models.product import Product
from app.models.camera import Camera
from app.models.software_lock import SoftwareLock
from app.core.security import hash_password


# ---- 权限定义 ----
PERMISSIONS = [
    ("camera:sync", "相机信息同步", "camera", "同步相机标定数据到系统"),
    ("camera:view", "相机信息查看", "camera", "查看相机列表与详情"),
    ("software_lock:sync", "软件锁授权同步", "software", "同步软件锁授权信息"),
    ("software_lock:view", "软件锁信息查看", "software", "查看软件锁列表与详情"),
    ("purchase_order:create", "创建采购订单", "purchase", "提交采购订单"),
    ("purchase_order:view", "查看采购订单", "purchase", "查看订单列表与详情"),
    ("purchase_order:confirm", "确认采购订单", "purchase", "确认或驳回订单"),
    ("payment:create", "订单付款", "finance", "提交付款信息与凭证"),
    ("payment:view", "查看付款记录", "finance", "查看付款记录与凭证"),
    ("payment:confirm", "收款确认", "finance", "确认收款或标记异常"),
    ("shipment:create", "产品发货", "shipment", "创建发货单"),
    ("shipment:view", "查看发货记录", "shipment", "查看发货单列表与详情"),
    ("receive:confirm", "收货确认", "shipment", "确认收货与差异申报"),
    ("device:register", "登记定位仪设备", "device", "登记新设备与BOM"),
    ("device:view", "查看设备信息", "device", "查看设备列表与详情"),
    ("traceability:query", "查询追溯信息", "device", "查询设备追溯链条"),
    ("statistics:view", "查看统计汇总", "statistics", "查看统计分析数据"),
    ("after_sales:create", "创建售后工单", "after_sales", "发起售后申请"),
    ("after_sales:handle", "处理售后工单", "after_sales", "处理售后工单"),
    ("after_sales:view", "查看售后工单", "after_sales", "查看售后工单列表"),
    ("user:manage", "用户管理", "system", "管理用户、角色、权限"),
]

# ---- 角色定义 ----
ROLES = [
    ("camera_producer", "相机生产人员", "core_tech", "负责相机组装与标定数据同步"),
    ("software_admin", "软件管理员", "core_tech", "负责软件锁授权管理"),
    ("business_staff", "业务员", "core_tech", "负责订单确认与发货"),
    ("finance_staff", "财务人员", "core_tech", "负责收款确认"),
    ("quality_staff", "质量人员", "core_tech", "负责质量追溯"),
    ("purchaser", "采购员", "manufacturer", "负责采购订单与付款"),
    ("assembler", "组装人员", "manufacturer", "负责设备组装登记"),
    ("manufacturer_admin", "生产厂管理员", "manufacturer", "生产厂系统管理"),
]

# 角色对应的权限
ROLE_PERMISSIONS_MAP = {
    "camera_producer": ["camera:sync", "camera:view", "software_lock:view", "device:view", "traceability:query"],
    "software_admin": ["software_lock:sync", "software_lock:view", "camera:view", "device:view", "traceability:query"],
    "business_staff": ["purchase_order:view", "purchase_order:confirm", "shipment:create", "shipment:view", "payment:view", "device:view", "traceability:query", "statistics:view", "after_sales:view", "after_sales:handle"],
    "finance_staff": ["payment:view", "payment:confirm", "purchase_order:view", "statistics:view"],
    "quality_staff": ["camera:view", "software_lock:view", "device:view", "traceability:query", "statistics:view", "after_sales:view"],
    "purchaser": ["purchase_order:create", "purchase_order:view", "payment:create", "payment:view", "shipment:view", "receive:confirm", "after_sales:create", "after_sales:view", "product:view"] if False else ["purchase_order:create", "purchase_order:view", "payment:create", "payment:view", "shipment:view", "receive:confirm", "after_sales:create", "after_sales:view"],
    "assembler": ["device:register", "device:view", "camera:view", "software_lock:view", "traceability:query", "after_sales:create", "after_sales:view"],
    "manufacturer_admin": ["purchase_order:create", "purchase_order:view", "payment:create", "payment:view", "shipment:view", "receive:confirm", "device:register", "device:view", "traceability:query", "after_sales:create", "after_sales:view", "statistics:view"],
}

# ---- 产品目录 ----
PRODUCTS = [
    ("CAM-A100", "高精度工业相机 A100", "camera", "A100", "500万像素，全局快门", 3500.00, None),
    ("CAM-A200", "高精度工业相机 A200", "camera", "A200", "800万像素，全局快门", 5800.00, None),
    ("CAM-B100", "标定相机 B100", "camera", "B100", "300万像素，卷帘快门", 2200.00, None),
    ("SW-LOCK-STD", "软件锁-标准版", "software", "STD", "标准功能版本", 8000.00, ["basic_alignment"]),
    ("SW-LOCK-PRO", "软件锁-专业版", "software", "PRO", "专业功能版本", 15000.00, ["basic_alignment", "3d_alignment", "wheel_measurement"]),
    ("SW-LOCK-ULT", "软件锁-旗舰版", "software", "ULT", "旗舰功能版本", 25000.00, ["basic_alignment", "3d_alignment", "wheel_measurement", "report_export", "remote_diagnosis"]),
]


async def seed():
    async with async_session() as db:
        # 1. 创建企业
        print("创建企业...")
        core_tech = Enterprise(
            name="智核科技有限公司",
            type="core_tech",
            contact_person="王技术",
            contact_phone="13800001111",
            bank_account="6228480402564890018",
            bank_name="中国工商银行高新区支行",
        )
        manufacturer = Enterprise(
            name="精工定位仪制造厂",
            type="manufacturer",
            contact_person="李厂长",
            contact_phone="13900002222",
            bank_account="6228480402564890026",
            bank_name="中国建设银行工业园区支行",
        )
        db.add_all([core_tech, manufacturer])
        await db.flush()
        print(f"  核心技术企业 ID: {core_tech.id}")
        print(f"  定位仪生产厂 ID: {manufacturer.id}")

        # 2. 创建权限
        print("创建权限...")
        perm_map = {}
        for code, name, module, desc in PERMISSIONS:
            p = Permission(code=code, name=name, module=module, description=desc)
            db.add(p)
            perm_map[code] = p
        await db.flush()

        # 3. 创建角色
        print("创建角色...")
        role_map = {}
        for name, display, ent_type, desc in ROLES:
            r = Role(name=name, display_name=display, enterprise_type=ent_type, description=desc)
            db.add(r)
            role_map[name] = r
        await db.flush()

        # 4. 角色权限关联
        print("关联角色权限...")
        for role_name, perm_codes in ROLE_PERMISSIONS_MAP.items():
            role = role_map[role_name]
            for code in perm_codes:
                if code in perm_map:
                    db.add(RolePermission(role_id=role.id, permission_id=perm_map[code].id))

        # 5. 创建用户
        print("创建演示用户...")
        users_data = [
            ("cam_user", "相机操作员", core_tech.id, ["camera_producer"]),
            ("sw_admin", "软件管理员", core_tech.id, ["software_admin"]),
            ("biz_staff", "业务员张三", core_tech.id, ["business_staff"]),
            ("fin_staff", "财务李四", core_tech.id, ["finance_staff"]),
            ("qa_staff", "质量员王五", core_tech.id, ["quality_staff"]),
            ("purchaser", "采购员赵六", manufacturer.id, ["purchaser"]),
            ("assembler", "组装员钱七", manufacturer.id, ["assembler"]),
            ("mfr_admin", "厂管理员孙八", manufacturer.id, ["manufacturer_admin"]),
        ]
        user_map = {}
        for username, real_name, ent_id, role_names in users_data:
            u = User(
                username=username,
                password_hash=hash_password("123456"),
                real_name=real_name,
                enterprise_id=ent_id,
                is_active=True,
            )
            db.add(u)
            user_map[username] = u
        await db.flush()

        for username, _, _, role_names in users_data:
            u = user_map[username]
            for rn in role_names:
                db.add(UserRole(user_id=u.id, role_id=role_map[rn].id))

        # 6. 创建产品目录
        print("创建产品目录...")
        for code, name, cat, model, spec, price, fvs in PRODUCTS:
            db.add(Product(
                code=code, name=name, category=cat, model=model,
                spec=spec, price=price, function_versions=fvs, is_active=True,
            ))

        # 7. 创建示例相机
        print("创建示例相机...")
        for i in range(1, 11):
            sn = f"CAM2026{ i:04d}"
            db.add(Camera(
                internal_id=f"CAM-{i:06d}",
                sn=sn,
                model="A100" if i <= 5 else "A200",
                intrinsics={"fx": 800.0 + i, "fy": 800.0 + i, "cx": 320.0, "cy": 240.0, "distortion": [0.1, -0.05, 0, 0, 0]},
                extrinsics={"rotation": [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0], "translation": [0.0, 0.0, 0.0]},
                status="in_stock",
                enterprise_id=core_tech.id,
            ))

        # 8. 创建示例软件锁
        print("创建示例软件锁...")
        for i in range(1, 6):
            db.add(SoftwareLock(
                lock_id=f"SWLOCK-{i:04d}",
                software_version="v2.3.1",
                function_version=["basic", "professional", "ultimate"][i % 3],
                function_list=["3d_alignment", "wheel_measurement"] if i % 2 == 0 else ["basic_alignment"],
                expire_date=datetime.utcnow() + timedelta(days=365),
                status="authorized",
                bound_enterprise_id=manufacturer.id if i <= 3 else None,
            ))

        await db.commit()
        print("\n========================================")
        print("种子数据创建完成！")
        print("========================================")
        print("\n演示账号（密码均为 123456）：")
        print("  核心技术企业：")
        print("    cam_user    - 相机操作员")
        print("    sw_admin    - 软件管理员")
        print("    biz_staff   - 业务员")
        print("    fin_staff   - 财务人员")
        print("    qa_staff    - 质量人员")
        print("  定位仪生产厂：")
        print("    purchaser   - 采购员")
        print("    assembler   - 组装员")
        print("    mfr_admin   - 厂管理员")
        print(f"\nAPI 文档地址: http://localhost:8000/docs")


if __name__ == "__main__":
    asyncio.run(seed())
