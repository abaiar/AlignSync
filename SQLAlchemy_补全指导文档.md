# AlignSync 项目 - SQLAlchemy 代码人工补全指导文档

> 本文档为 AlignSync 车轮定位仪协同制造与溯源平台的后端数据库层开发指南，帮助开发者手写 SQLAlchemy Model 与 CRUD 逻辑。

---

## 目录

1. [基本原则与最佳实践](#1-基本原则与最佳实践)
2. [项目数据库架构设计](#2-项目数据库架构设计)
3. [模型定义详解](#3-模型定义详解)
4. [异步 CRUD 操作实现](#4-异步-crud-操作实现)
5. [关系配置与级联操作](#5-关系配置与级联操作)
6. [事务处理与错误管理](#6-事务处理与错误管理)
7. [性能优化建议](#7-性能优化建议)
8. [SQLAlchemy 2.0 语法要点](#8-sqlalchemy-20-语法要点)
9. [完整代码示例](#9-完整代码示例)
10. [常见问题与调试](#10-常见问题与调试)

---

## 1. 基本原则与最佳实践

### 1.1 核心原则

| 原则 | 说明 |
|------|------|
| **异步优先** | 项目使用 `AsyncSession`，所有数据库操作必须是异步的 |
| **类型安全** | 使用 Python 类型提示，配合 Pydantic 进行数据校验 |
| **事务边界** | 明确事务的开始和结束，避免隐式提交 |
| **连接管理** | 使用依赖注入获取会话，确保会话正确关闭 |
| **错误传播** | 合理处理数据库异常，转换为业务异常 |

### 1.2 目录结构约定

```
backend/app/
├── models/                    # SQLAlchemy 模型定义
│   ├── __init__.py           # 导出所有模型
│   ├── base.py               # DeclarativeBase 基类
│   ├── camera.py             # 相机模型
│   ├── dongle.py             # 软件锁模型
│   ├── order.py              # 订单模型
│   ├── device.py             # 设备模型
│   └── tenant.py             # 租户模型（多租户）
├── services/                  # 业务逻辑层（CRUD 实现）
│   ├── camera_service.py
│   └── ...
└── schemas/                   # Pydantic 模型（已完成）
```

### 1.3 命名约定

```python
# 表名：小写下划线命名法
__tablename__ = "cameras"

# 主键：id
id: Mapped[int] = mapped_column(primary_key=True)

# 外键：{关联表}_id
tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"))

# 时间戳：created_at, updated_at
created_at: Mapped[datetime] = mapped_column(default=func.now())

# 状态枚举：使用 Python Enum
status: Mapped[CameraStatus] = mapped_column(default=CameraStatus.IN_STOCK)
```

---

## 2. 项目数据库架构设计

### 2.1 ER 图概览

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   tenants   │       │   cameras   │       │   dongles   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──┐   │ id (PK)     │       │ id (PK)     │
│ name        │   │   │ sn (UK)     │       │ dongle_id   │
│ ...         │   │   │ model       │       │ version     │
└─────────────┘   │   │ status      │       │ features    │
                  │   │ tenant_id   │───┘   │ status      │
                  │   └─────────────┘       └─────────────┘
                  │
                  │   ┌─────────────┐       ┌─────────────┐
                  │   │   orders    │       │  devices    │
                  │   ├─────────────┤       ├─────────────┤
                  └──►│ id (PK)     │       │ id (PK)     │
                      │ po_number   │       │ device_sn   │
                      │ tenant_id   │       │ dongle_id   │──► dongles.dongle_id
                      │ status      │       │ auth_code   │
                      │ total_amt   │       └─────────────┘
                      └─────────────┘             │
                            │                     │
                            ▼                     ▼
                      ┌─────────────┐       ┌─────────────┐
                      │order_items  │       │device_cameras│
                      ├─────────────┤       ├─────────────┤
                      │ id (PK)     │       │ id (PK)     │
                      │ order_id    │       │ device_id   │
                      │ model       │       │ camera_sn   │──► cameras.sn
                      │ qty         │       │ position    │
                      │ price       │       └─────────────┘
                      └─────────────┘
```

### 2.2 表设计清单

| 表名 | 说明 | 核心字段 |
|------|------|----------|
| `tenants` | 租户（生产厂） | id, name, contact, address |
| `cameras` | 相机资产 | id, sn, model, intrinsic_params, extrinsic_params, status, tenant_id |
| `dongles` | 软件锁 | id, dongle_id, version, features(JSON), expiry_date, status |
| `orders` | 采购订单 | id, po_number, tenant_id, status, total_amount |
| `order_items` | 订单明细 | id, order_id, product_model, quantity, unit_price |
| `order_shipments` | 发货记录 | id, order_id, camera_sn, dongle_id, tracking_number |
| `devices` | 已登记设备 | id, device_sn, dongle_id, authorization_code, status |
| `device_cameras` | 设备-相机绑定 | id, device_id, camera_sn, position |

---

## 3. 模型定义详解

### 3.1 基类定义

```python
# backend/app/models/base.py
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """所有模型的基类"""
    pass


class TimestampMixin:
    """时间戳混入类"""
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        default=None,
        onupdate=func.now(),
        server_default=func.now(),
    )
```

### 3.2 相机模型

```python
# backend/app/models/camera.py
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .tenant import Tenant


class CameraStatus(str, Enum):
    IN_STOCK = "在库"
    SHIPPED = "已发货"
    USED = "已使用"
    RETURNED = "已退货"
    REPAIRED = "返修中"


class Camera(Base, TimestampMixin):
    """相机资产模型"""
    __tablename__ = "cameras"

    id: Mapped[int] = mapped_column(primary_key=True)
    sn: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        comment="相机序列号，全局唯一",
    )
    model: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        comment="相机型号",
    )
    intrinsic_params: Mapped[dict] = mapped_column(
        Text,
        nullable=False,
        comment="相机内参标定数据（JSON格式）",
    )
    extrinsic_params: Mapped[dict] = mapped_column(
        Text,
        nullable=False,
        comment="相机外参标定数据（JSON格式）",
    )
    calibration_date: Mapped[datetime] = mapped_column(
        nullable=False,
        comment="标定日期",
    )
    status: Mapped[CameraStatus] = mapped_column(
        SQLEnum(CameraStatus),
        default=CameraStatus.IN_STOCK,
        nullable=False,
        comment="相机状态",
    )
    tenant_id: Mapped[int | None] = mapped_column(
        ForeignKey("tenants.id"),
        nullable=True,
        comment="所属租户ID（发货后分配）",
    )

    # 关系
    tenant: Mapped["Tenant"] = relationship(back_populates="cameras")

    def __repr__(self) -> str:
        return f"Camera(id={self.id}, sn={self.sn}, status={self.status})"
```

### 3.3 软件锁模型

```python
# backend/app/models/dongle.py
from enum import Enum
from datetime import datetime

from sqlalchemy import String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class DongleStatus(str, Enum):
    AUTHORIZED = "已授权"
    IN_STOCK = "在库"
    SHIPPED = "已发货"
    USED = "已使用"
    RETURNED = "已退货"


class Dongle(Base, TimestampMixin):
    """软件锁模型"""
    __tablename__ = "dongles"

    id: Mapped[int] = mapped_column(primary_key=True)
    dongle_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        comment="软件锁ID",
    )
    version: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        comment="软件版本",
    )
    features: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
        comment="授权功能列表",
    )
    expiry_date: Mapped[datetime] = mapped_column(
        nullable=False,
        comment="授权到期日",
    )
    status: Mapped[DongleStatus] = mapped_column(
        default=DongleStatus.AUTHORIZED,
        nullable=False,
        comment="软件锁状态",
    )

    def __repr__(self) -> str:
        return f"Dongle(id={self.id}, dongle_id={self.dongle_id})"
```

### 3.4 订单模型

```python
# backend/app/models/order.py
from enum import Enum
from decimal import Decimal
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Numeric, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .tenant import Tenant


class OrderStatus(str, Enum):
    PENDING = "待确认"
    CONFIRMED = "已确认"
    AWAITING_PAYMENT = "待收款"
    PAID = "已收款"
    SHIPPED = "已发货"
    COMPLETED = "已完成"
    CANCELLED = "已取消"


class Order(Base, TimestampMixin):
    """采购订单模型"""
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    po_number: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,
        comment="采购订单编号",
    )
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id"),
        nullable=False,
        comment="租户ID（生产厂）",
    )
    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus),
        default=OrderStatus.PENDING,
        nullable=False,
        comment="订单状态",
    )
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
        comment="订单总额",
    )
    remark: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="备注",
    )

    # 关系
    tenant: Mapped["Tenant"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )
    shipments: Mapped[list["OrderShipment"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )

    def calculate_total(self) -> Decimal:
        """计算订单总额"""
        self.total_amount = sum(
            item.quantity * item.unit_price for item in self.items
        )
        return self.total_amount


class OrderItem(Base):
    """订单明细模型"""
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"),
        nullable=False,
    )
    product_model: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        comment="产品型号",
    )
    quantity: Mapped[int] = mapped_column(
        default=1,
        nullable=False,
        comment="数量",
    )
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        comment="单价",
    )

    # 关系
    order: Mapped["Order"] = relationship(back_populates="items")


class OrderShipment(Base, TimestampMixin):
    """订单发货记录"""
    __tablename__ = "order_shipments"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"),
        nullable=False,
    )
    camera_sn: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        comment="发货相机SN",
    )
    dongle_id: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        comment="发货软件锁ID",
    )
    tracking_number: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        comment="物流单号",
    )
    carrier: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        comment="物流公司",
    )

    # 关系
    order: Mapped["Order"] = relationship(back_populates="shipments")
```

### 3.5 设备模型

```python
# backend/app/models/device.py
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .dongle import Dongle


class DeviceStatus(str, Enum):
    ASSEMBLED = "已组装"
    ACTIVATED = "已激活"
    IN_SERVICE = "使用中"
    DECOMMISSIONED = "已退役"


class Device(Base, TimestampMixin):
    """已登记设备模型"""
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True)
    device_sn: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        comment="整机SN",
    )
    dongle_id: Mapped[str] = mapped_column(
        ForeignKey("dongles.dongle_id"),
        nullable=False,
        comment="绑定的软件锁ID",
    )
    authorization_code: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
        comment="基于相机内参生成的授权号",
    )
    status: Mapped[DeviceStatus] = mapped_column(
        default=DeviceStatus.ASSEMBLED,
        nullable=False,
        comment="设备状态",
    )

    # 关系
    dongle: Mapped["Dongle"] = relationship()
    cameras: Mapped[list["DeviceCamera"]] = relationship(
        back_populates="device",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("device_sn", name="uq_devices_device_sn"),
    )


class DeviceCamera(Base):
    """设备-相机绑定表"""
    __tablename__ = "device_cameras"

    id: Mapped[int] = mapped_column(primary_key=True)
    device_id: Mapped[int] = mapped_column(
        ForeignKey("devices.id"),
        nullable=False,
    )
    camera_sn: Mapped[str] = mapped_column(
        ForeignKey("cameras.sn"),
        nullable=False,
        comment="相机SN",
    )
    position: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        comment="安装位置（左/右/前/后）",
    )

    # 关系
    device: Mapped["Device"] = relationship(back_populates="cameras")

    __table_args__ = (
        UniqueConstraint("device_id", "position", name="uq_device_camera_position"),
        UniqueConstraint("device_id", "camera_sn", name="uq_device_camera_sn"),
    )
```

### 3.6 租户模型

```python
# backend/app/models/tenant.py
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class Tenant(Base, TimestampMixin):
    """租户（生产厂）模型"""
    __tablename__ = "tenants"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        nullable=False,
        comment="租户名称",
    )
    contact: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        comment="联系人",
    )
    phone: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        comment="联系电话",
    )
    address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="地址",
    )

    # 关系
    cameras: Mapped[list["Camera"]] = relationship(back_populates="tenant")
    orders: Mapped[list["Order"]] = relationship(back_populates="tenant")
```

### 3.7 模型导出

```python
# backend/app/models/__init__.py
from .base import Base, TimestampMixin
from .tenant import Tenant
from .camera import Camera, CameraStatus
from .dongle import Dongle, DongleStatus
from .order import Order, OrderItem, OrderShipment, OrderStatus
from .device import Device, DeviceCamera, DeviceStatus

__all__ = [
    "Base",
    "TimestampMixin",
    "Tenant",
    "Camera",
    "CameraStatus",
    "Dongle",
    "DongleStatus",
    "Order",
    "OrderItem",
    "OrderShipment",
    "OrderStatus",
    "Device",
    "DeviceCamera",
    "DeviceStatus",
]
```

---

## 4. 异步 CRUD 操作实现

### 4.1 相机服务实现

```python
# backend/app/services/camera_service.py
import json
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models import Camera, CameraStatus
from app.schemas.camera import CameraCreate, CameraResponse, CameraListResponse, CameraUpdate


async def sync_camera(db: AsyncSession, camera_in: CameraCreate) -> CameraResponse:
    """同步相机信息到系统库存"""
    # 检查 SN 是否已存在
    stmt = select(Camera).where(Camera.sn == camera_in.sn)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise ValueError(f"相机 SN={camera_in.sn} 已存在")
    
    # 创建新相机
    camera = Camera(
        sn=camera_in.sn,
        model=camera_in.model,
        intrinsic_params=json.dumps(camera_in.intrinsic_params),
        extrinsic_params=json.dumps(camera_in.extrinsic_params),
        calibration_date=camera_in.calibration_date,
        status=CameraStatus.IN_STOCK,
    )
    
    db.add(camera)
    await db.commit()
    await db.refresh(camera)
    
    return _to_response(camera)


async def get_cameras(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 20, 
    status: str | None = None
) -> CameraListResponse:
    """获取相机列表"""
    # 构建基础查询
    stmt = select(Camera)
    
    # 状态筛选
    if status:
        try:
            status_enum = CameraStatus(status)
            stmt = stmt.where(Camera.status == status_enum)
        except ValueError:
            pass
    
    # 计算总数
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()
    
    # 分页查询
    stmt = stmt.offset(skip).limit(limit).order_by(Camera.created_at.desc())
    result = await db.execute(stmt)
    cameras = result.scalars().all()
    
    return CameraListResponse(
        total=total,
        items=[_to_response(c) for c in cameras],
    )


async def get_camera_by_sn(db: AsyncSession, sn: str) -> CameraResponse | None:
    """根据SN获取相机信息"""
    stmt = select(Camera).where(Camera.sn == sn)
    result = await db.execute(stmt)
    camera = result.scalar_one_or_none()
    
    if camera is None:
        return None
    
    return _to_response(camera)


async def update_camera(
    db: AsyncSession, 
    sn: str, 
    camera_in: CameraUpdate
) -> CameraResponse | None:
    """更新相机信息"""
    stmt = select(Camera).where(Camera.sn == sn)
    result = await db.execute(stmt)
    camera = result.scalar_one_or_none()
    
    if camera is None:
        return None
    
    # 更新字段
    update_data = camera_in.model_dump(exclude_unset=True)
    
    if "intrinsic_params" in update_data:
        camera.intrinsic_params = json.dumps(update_data["intrinsic_params"])
        del update_data["intrinsic_params"]
    
    if "extrinsic_params" in update_data:
        camera.extrinsic_params = json.dumps(update_data["extrinsic_params"])
        del update_data["extrinsic_params"]
    
    for key, value in update_data.items():
        setattr(camera, key, value)
    
    await db.commit()
    await db.refresh(camera)
    
    return _to_response(camera)


def _to_response(camera: Camera) -> CameraResponse:
    """将 ORM 模型转换为 Pydantic 响应"""
    return CameraResponse(
        id=camera.id,
        sn=camera.sn,
        model=camera.model,
        intrinsic_params=json.loads(camera.intrinsic_params) if isinstance(camera.intrinsic_params, str) else camera.intrinsic_params,
        extrinsic_params=json.loads(camera.extrinsic_params) if isinstance(camera.extrinsic_params, str) else camera.extrinsic_params,
        calibration_date=camera.calibration_date,
        status=camera.status,
        created_at=camera.created_at,
        updated_at=camera.updated_at,
    )
```

### 4.2 设备组装服务实现

```python
# backend/app/services/device_service.py
import hashlib
import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models import Device, DeviceCamera, Camera, Dongle, CameraStatus, DongleStatus, DeviceStatus
from app.schemas.device import DeviceAssembleRequest, DeviceResponse, DeviceListResponse


async def assemble_device(
    db: AsyncSession, 
    data: DeviceAssembleRequest
) -> DeviceResponse:
    """登记定位仪设备（硬件组装绑定）"""
    
    # 1. 校验整机SN唯一性
    stmt = select(Device).where(Device.device_sn == data.device_sn)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise ValueError(f"设备 SN={data.device_sn} 已存在")
    
    # 2. 校验软件锁存在且状态为"在库"
    stmt = select(Dongle).where(Dongle.dongle_id == data.dongle_sn)
    result = await db.execute(stmt)
    dongle = result.scalar_one_or_none()
    if not dongle:
        raise ValueError(f"软件锁 ID={data.dongle_sn} 不存在")
    if dongle.status != DongleStatus.IN_STOCK:
        raise ValueError(f"软件锁 ID={data.dongle_sn} 状态为 {dongle.status}，无法绑定")
    
    # 3. 校验所有相机存在且状态为"在库"
    camera_sns = [c.camera_sn for c in data.cameras]
    stmt = select(Camera).where(Camera.sn.in_(camera_sns))
    result = await db.execute(stmt)
    cameras = {c.sn: c for c in result.scalars().all()}
    
    for cam_binding in data.cameras:
        if cam_binding.camera_sn not in cameras:
            raise ValueError(f"相机 SN={cam_binding.camera_sn} 不存在")
        if cameras[cam_binding.camera_sn].status != CameraStatus.IN_STOCK:
            raise ValueError(f"相机 SN={cam_binding.camera_sn} 状态非在库，无法绑定")
    
    # 4. 校验相机安装位置不重复
    positions = [c.position for c in data.cameras]
    if len(positions) != len(set(positions)):
        raise ValueError("相机安装位置不可重复")
    
    # 5. 生成基于相机内参的授权号
    intrinsic_data = "".join(
        json.dumps(json.loads(cameras[c.camera_sn].intrinsic_params), sort_keys=True)
        for c in sorted(data.cameras, key=lambda x: x.camera_sn)
    )
    auth_code = hashlib.sha256(
        f"{data.device_sn}:{data.dongle_sn}:{intrinsic_data}".encode()
    ).hexdigest()[:32]
    
    # 6. 创建设备记录
    device = Device(
        device_sn=data.device_sn,
        dongle_id=data.dongle_sn,
        authorization_code=auth_code,
        status=DeviceStatus.ASSEMBLED,
    )
    db.add(device)
    await db.flush()  # 获取 device.id
    
    # 7. 创建设备-相机绑定记录
    for cam_binding in data.cameras:
        device_camera = DeviceCamera(
            device_id=device.id,
            camera_sn=cam_binding.camera_sn,
            position=cam_binding.position,
        )
        db.add(device_camera)
        
        # 更新相机状态为"已使用"
        cameras[cam_binding.camera_sn].status = CameraStatus.USED
    
    # 8. 更新软件锁状态为"已使用"
    dongle.status = DongleStatus.USED
    
    try:
        await db.commit()
        await db.refresh(device)
    except IntegrityError as e:
        await db.rollback()
        raise ValueError(f"设备登记失败：{str(e)}")
    
    return _to_response(device)


async def get_devices(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 20, 
    status: str | None = None
) -> DeviceListResponse:
    """获取设备列表"""
    from sqlalchemy.orm import selectinload
    
    stmt = select(Device).options(selectinload(Device.cameras))
    
    if status:
        try:
            status_enum = DeviceStatus(status)
            stmt = stmt.where(Device.status == status_enum)
        except ValueError:
            pass
    
    # 计算总数
    from sqlalchemy import func
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()
    
    # 分页
    stmt = stmt.offset(skip).limit(limit).order_by(Device.created_at.desc())
    result = await db.execute(stmt)
    devices = result.scalars().all()
    
    return DeviceListResponse(
        total=total,
        items=[_to_response(d) for d in devices],
    )


def _to_response(device: Device) -> DeviceResponse:
    """将 ORM 模型转换为 Pydantic 响应"""
    from app.schemas.device import CameraBinding
    
    return DeviceResponse(
        id=device.id,
        device_sn=device.device_sn,
        dongle_sn=device.dongle_id,
        cameras=[
            CameraBinding(camera_sn=dc.camera_sn, position=dc.position)
            for dc in device.cameras
        ],
        authorization_code=device.authorization_code,
        status=device.status,
        created_at=device.created_at,
        updated_at=device.updated_at,
    )
```

---

## 5. 关系配置与级联操作

### 5.1 关系类型速查表

| 关系类型 | SQLAlchemy 配置 | 使用场景 |
|----------|-----------------|----------|
| 一对多 | `relationship()` + `ForeignKey` | 租户-订单、订单-明细 |
| 多对一 | `ForeignKey` + `relationship(back_populates)` | 订单-租户、明细-订单 |
| 一对一 | `relationship(uselist=False)` | 用户-配置 |
| 多对多 | `relationship(secondary=关联表)` | 用户-角色 |

### 5.2 级联操作配置

```python
# 级联删除：删除订单时自动删除所有明细
items: Mapped[list["OrderItem"]] = relationship(
    back_populates="order",
    cascade="all, delete-orphan",  # 关键配置
)

# 级联选项说明：
# - "save-update"：保存/更新父对象时同步操作子对象（默认）
# - "delete"：删除父对象时同步删除子对象
# - "delete-orphan"：子对象脱离父对象时自动删除
# - "all"：包含 save-update, merge, refresh-expire, expunge, delete
```

### 5.3 延迟加载与预加载

```python
from sqlalchemy.orm import selectinload, joinedload

# 方式1：selectinload（推荐，避免 N+1 问题）
stmt = select(Device).options(selectinload(Device.cameras))

# 方式2：joinedload（JOIN 查询，适合一对一关系）
stmt = select(Order).options(joinedload(Order.tenant))

# 方式3：懒加载（默认，可能导致 N+1 问题）
# 访问 device.cameras 时才发起查询
```

---

## 6. 事务处理与错误管理

### 6.1 事务管理模式

```python
# 模式1：自动提交（推荐用于简单操作）
async def simple_operation(db: AsyncSession):
    camera = Camera(sn="TEST-001", ...)
    db.add(camera)
    await db.commit()  # 自动提交
    await db.refresh(camera)  # 刷新获取数据库生成的字段


# 模式2：显式事务（推荐用于复杂操作）
async def complex_operation(db: AsyncSession):
    try:
        # 多个操作
        db.add(obj1)
        db.add(obj2)
        await db.flush()  # 发送 SQL 但不提交，可获取自增 ID
        
        # 更多操作...
        await db.commit()
    except Exception as e:
        await db.rollback()  # 回滚事务
        raise


# 模式3：使用上下文管理器
async def with_transaction(db: AsyncSession):
    async with db.begin():
        # 在此块内的操作自动提交或回滚
        db.add(obj)
```

### 6.2 常见异常处理

```python
from sqlalchemy.exc import IntegrityError, NoResultFound, MultipleResultsFound

async def handle_errors(db: AsyncSession):
    try:
        # 数据库操作
        await db.commit()
    except IntegrityError as e:
        # 唯一约束冲突、外键约束失败
        await db.rollback()
        if "unique constraint" in str(e).lower():
            raise ValueError("记录已存在")
        elif "foreign key" in str(e).lower():
            raise ValueError("关联记录不存在")
        raise
    except NoResultFound:
        # 查询无结果（使用 .one() 时）
        raise ValueError("记录不存在")
    except MultipleResultsFound:
        # 查询返回多条结果（使用 .one() 时）
        raise ValueError("找到多条记录")
```

### 6.3 乐观锁实现

```python
from sqlalchemy import Column, Integer

class Order(Base):
    __tablename__ = "orders"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    version: Mapped[int] = mapped_column(Integer, default=1)  # 版本号
    status: Mapped[OrderStatus] = mapped_column(...)

async def update_order_status(db: AsyncSession, order_id: int, new_status: OrderStatus, expected_version: int):
    """使用乐观锁更新订单状态"""
    stmt = (
        update(Order)
        .where(Order.id == order_id, Order.version == expected_version)
        .values(status=new_status, version=Order.version + 1)
    )
    result = await db.execute(stmt)
    await db.commit()
    
    if result.rowcount == 0:
        raise ValueError("订单已被其他用户修改，请刷新后重试")
```

---

## 7. 性能优化建议

### 7.1 查询优化清单

| 优化项 | 说明 | 示例 |
|--------|------|------|
| 索引优化 | 为常用查询字段添加索引 | `mapped_column(index=True)` |
| 预加载 | 使用 `selectinload` 避免 N+1 | `.options(selectinload(Device.cameras))` |
| 分页查询 | 使用 `offset` + `limit` | `.offset(skip).limit(limit)` |
| 只查必要字段 | 使用 `load_only` | `.options(load_only(Camera.sn, Camera.status))` |
| 批量操作 | 使用 `execute()` + 批量语句 | `insert(Camera).values([...])` |

### 7.2 索引配置示例

```python
class Camera(Base):
    __tablename__ = "cameras"
    
    # 单列索引
    sn: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    status: Mapped[CameraStatus] = mapped_column(index=True)
    
    # 复合索引（在 __table_args__ 中定义）
    __table_args__ = (
        Index("ix_cameras_tenant_status", "tenant_id", "status"),
    )
```

### 7.3 批量操作示例

```python
from sqlalchemy import insert, update

# 批量插入
async def bulk_insert_cameras(db: AsyncSession, cameras_data: list[dict]):
    stmt = insert(Camera).values(cameras_data)
    await db.execute(stmt)
    await db.commit()

# 批量更新
async def bulk_update_status(db: AsyncSession, camera_sns: list[str], new_status: CameraStatus):
    stmt = (
        update(Camera)
        .where(Camera.sn.in_(camera_sns))
        .values(status=new_status)
    )
    await db.execute(stmt)
    await db.commit()
```

---

## 8. SQLAlchemy 2.0 语法要点

### 8.1 核心语法变化

```python
# SQLAlchemy 1.4 (旧)
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(Integer, primary_key=True)
    sn = Column(String(64))


# SQLAlchemy 2.0 (新)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class Camera(Base):
    __tablename__ = "cameras"
    id: Mapped[int] = mapped_column(primary_key=True)
    sn: Mapped[str] = mapped_column(String(64))
```

### 8.2 查询语法变化

```python
# SQLAlchemy 1.4 (旧)
session.query(Camera).filter(Camera.status == "在库").all()

# SQLAlchemy 2.0 (新)
from sqlalchemy import select

stmt = select(Camera).where(Camera.status == "在库")
result = await session.execute(stmt)
cameras = result.scalars().all()
```

### 8.3 类型注解优势

```python
# 2.0 的类型注解提供更好的 IDE 支持
class Camera(Base):
    id: Mapped[int]                           # IDE 知道这是 int
    sn: Mapped[str]                           # IDE 知道这是 str
    status: Mapped[CameraStatus]              # IDE 知道这是枚举
    intrinsic_params: Mapped[dict]            # IDE 知道这是 dict
    created_at: Mapped[datetime]              # IDE 知道这是 datetime
```

---

## 9. 完整代码示例

### 9.1 订单服务完整实现

```python
# backend/app/services/order_service.py
from datetime import datetime
from decimal import Decimal
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Order, OrderItem, OrderShipment, OrderStatus, Camera, Dongle
from app.schemas.order import (
    OrderCreate, OrderResponse, OrderListResponse,
    OrderConfirmRequest, OrderPayRequest, OrderPaymentConfirmRequest,
    OrderShipRequest, OrderReceiveRequest,
)


async def create_order(db: AsyncSession, order_in: OrderCreate) -> OrderResponse:
    """创建采购订单"""
    # 生成 PO 编号
    today = datetime.now().strftime("%Y%m%d")
    stmt = select(func.count()).select_from(Order)
    result = await db.execute(stmt)
    count = result.scalar() or 0
    po_number = f"PO-{today}-{count + 1:04d}"
    
    # 创建订单
    order = Order(
        po_number=po_number,
        tenant_id=order_in.tenant_id,
        status=OrderStatus.PENDING,
        remark=order_in.remark,
    )
    db.add(order)
    await db.flush()
    
    # 创建订单明细
    total = Decimal("0.00")
    for item_in in order_in.items:
        item = OrderItem(
            order_id=order.id,
            product_model=item_in.product_model,
            quantity=item_in.quantity,
            unit_price=item_in.unit_price,
        )
        db.add(item)
        total += item_in.quantity * item_in.unit_price
    
    order.total_amount = total
    await db.commit()
    await db.refresh(order)
    
    return await _order_to_response(db, order)


async def confirm_order(db: AsyncSession, order_id: int, data: OrderConfirmRequest) -> OrderResponse | None:
    """确认采购订单"""
    order = await _get_order_with_items(db, order_id)
    if not order:
        return None
    
    if order.status != OrderStatus.PENDING:
        raise ValueError(f"订单状态为 {order.status}，无法确认")
    
    order.status = OrderStatus.CONFIRMED
    await db.commit()
    await db.refresh(order)
    
    return await _order_to_response(db, order)


async def ship_order(db: AsyncSession, order_id: int, data: OrderShipRequest) -> OrderResponse | None:
    """订单发货"""
    order = await _get_order_with_items(db, order_id)
    if not order:
        return None
    
    if order.status != OrderStatus.PAID:
        raise ValueError(f"订单状态为 {order.status}，无法发货")
    
    # 校验相机
    for cam_item in data.camera_items:
        stmt = select(Camera).where(Camera.sn == cam_item.camera_sn)
        result = await db.execute(stmt)
        camera = result.scalar_one_or_none()
        if not camera:
            raise ValueError(f"相机 SN={cam_item.camera_sn} 不存在")
        if camera.status.value != "在库":
            raise ValueError(f"相机 SN={cam_item.camera_sn} 状态非在库")
    
    # 校验软件锁
    for dongle_id in data.dongle_ids:
        stmt = select(Dongle).where(Dongle.dongle_id == dongle_id)
        result = await db.execute(stmt)
        dongle = result.scalar_one_or_none()
        if not dongle:
            raise ValueError(f"软件锁 ID={dongle_id} 不存在")
    
    # 创建发货记录
    for cam_item in data.camera_items:
        shipment = OrderShipment(
            order_id=order.id,
            camera_sn=cam_item.camera_sn,
            tracking_number=data.tracking_number,
            carrier=data.carrier,
        )
        db.add(shipment)
        
        # 更新相机状态
        stmt = (
            update(Camera)
            .where(Camera.sn == cam_item.camera_sn)
            .values(status="已发货", tenant_id=order.tenant_id)
        )
        await db.execute(stmt)
    
    for dongle_id in data.dongle_ids:
        shipment = OrderShipment(
            order_id=order.id,
            dongle_id=dongle_id,
            tracking_number=data.tracking_number,
            carrier=data.carrier,
        )
        db.add(shipment)
    
    order.status = OrderStatus.SHIPPED
    await db.commit()
    await db.refresh(order)
    
    return await _order_to_response(db, order)


async def _get_order_with_items(db: AsyncSession, order_id: int) -> Order | None:
    """获取订单（含明细）"""
    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _order_to_response(db: AsyncSession, order: Order) -> OrderResponse:
    """转换为响应模型"""
    # 重新加载关联数据
    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order.id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one()
    
    return OrderResponse(
        id=order.id,
        po_number=order.po_number,
        tenant_id=order.tenant_id,
        status=order.status,
        total_amount=order.total_amount,
        items=[
            {
                "id": item.id,
                "product_model": item.product_model,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.quantity * item.unit_price,
            }
            for item in order.items
        ],
        remark=order.remark,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )
```

---

## 10. 常见问题与调试

### 10.1 常见错误速查

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| `NoResultFound` | 查询无结果 | 使用 `scalar_one_or_none()` 或添加异常处理 |
| `IntegrityError: unique constraint` | 唯一约束冲突 | 检查数据是否重复，添加唯一性校验 |
| `IntegrityError: foreign key constraint` | 外键约束失败 | 确保关联记录存在 |
| `DetachedInstanceError` | 访问已分离的对象属性 | 使用 `selectinload` 或在会话内访问 |
| `AwaitRequired` | 未 await 异步操作 | 确保所有数据库操作都使用 `await` |

### 10.2 调试技巧

```python
# 1. 打印 SQL 语句
from sqlalchemy import create_engine
engine = create_engine(DATABASE_URL, echo=True)  # echo=True 打印 SQL

# 2. 查看生成的 SQL
from sqlalchemy.dialects import postgresql
stmt = select(Camera).where(Camera.status == "在库")
print(stmt.compile(dialect=postgresql.dialect()))

# 3. 检查会话状态
print(db.new)      # 新添加的对象
print(db.dirty)    # 已修改的对象
print(db.deleted)  # 已删除的对象

# 4. 使用日志
import logging
logging.basicConfig()
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
```

### 10.3 测试建议

```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

@pytest.fixture
async def db_session():
    """测试用数据库会话"""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        yield session
    
    await engine.dispose()


@pytest.mark.asyncio
async def test_sync_camera(db_session: AsyncSession):
    """测试相机同步"""
    from app.services.camera_service import sync_camera
    from app.schemas.camera import CameraCreate
    from datetime import datetime
    
    camera_in = CameraCreate(
        sn="TEST-001",
        model="CAM-X100",
        intrinsic_params={"fx": 1000, "fy": 1000},
        extrinsic_params={"tx": 0, "ty": 0},
        calibration_date=datetime.now(),
    )
    
    result = await sync_camera(db_session, camera_in)
    
    assert result.id is not None
    assert result.sn == "TEST-001"
    assert result.status.value == "在库"
```

---

## 附录：快速参考卡片

### A. 常用导入

```python
# 模型定义
from sqlalchemy import String, Integer, Text, ForeignKey, JSON, DateTime, Numeric
from sqlalchemy import func, select, update, delete, insert
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.orm import selectinload, joinedload, load_only

# 异步支持
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# 异常
from sqlalchemy.exc import IntegrityError, NoResultFound
```

### B. 会话操作速查

```python
# 添加
db.add(obj)
await db.flush()  # 发送 SQL，获取 ID

# 查询
stmt = select(Model).where(Model.field == value)
result = await db.execute(stmt)
obj = result.scalar_one_or_none()

# 更新
stmt = update(Model).where(Model.id == id).values(field=new_value)
await db.execute(stmt)

# 删除
stmt = delete(Model).where(Model.id == id)
await db.execute(stmt)

# 提交/回滚
await db.commit()
await db.rollback()
```

### C. 关系定义速查

```python
# 一对多
class Parent(Base):
    children: Mapped[list["Child"]] = relationship(back_populates="parent", cascade="all, delete-orphan")

class Child(Base):
    parent_id: Mapped[int] = mapped_column(ForeignKey("parents.id"))
    parent: Mapped["Parent"] = relationship(back_populates="children")

# 多对一
class Child(Base):
    parent_id: Mapped[int] = mapped_column(ForeignKey("parents.id"))
    parent: Mapped["Parent"] = relationship()

# 多对多
association_table = Table(
    "association", Base.metadata,
    Column("left_id", ForeignKey("left.id")),
    Column("right_id", ForeignKey("right.id")),
)

class Left(Base):
    rights: Mapped[list["Right"]] = relationship(secondary=association_table)
```

---

> 📝 **文档版本**: v1.0  
> 📅 **更新日期**: 2026-05-13  
> 🔗 **相关文档**: [SQLAlchemy 2.0 官方文档](https://docs.sqlalchemy.org/en/20/)
