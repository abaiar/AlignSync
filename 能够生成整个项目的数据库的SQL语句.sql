-- ============================================================================
-- 项目名称：AlignSync 车轮定位仪生产协同管理系统
-- 文件用途：MySQL 8.0 数据库初始化脚本（建表 + 视图 + 存储过程 + 触发器 + 种子数据）
-- 生成日期：2026-07-06
-- 目标数据库：MySQL 8.0
-- 适用场景：大学《数据库系统概论》课程设计验收；可在 PowerDesigner 中导入生成完整 ER 图
-- 注意事项：
--   1. 本脚本可在 MySQL 8.0 命令行一次性执行无报错（已关闭外键检查并按拓扑顺序建表）
--   2. DELIMITER 是 MySQL 客户端指令；PowerDesigner 导入时如报错可分段执行存储过程/触发器部分
--   3. 初始账号密码均为 123456（演示用），password_hash 字段为占位字符串，真实环境由 passlib bcrypt 生成
--   4. 触发器仅以 enterprises 表为示范，其它带 updated_at 的表可按相同模式扩展
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS alignsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alignsync;
-- 设置会话时区为东八区（中国标准时间），保证 NOW() / CURDATE() 与业务一致
SET time_zone = '+08:00';

-- ============================================================================
-- 一、DROP IF EXISTS（反向依赖顺序，便于重复执行）
-- ============================================================================

-- 触发器
DROP TRIGGER IF EXISTS trg_enterprises_updated_at;

-- 存储过程
DROP PROCEDURE IF EXISTS sp_generate_order_no;
DROP PROCEDURE IF EXISTS sp_device_traceability;

-- 视图
DROP VIEW IF EXISTS v_device_traceability;
DROP VIEW IF EXISTS v_order_summary;
DROP VIEW IF EXISTS v_camera_inventory;

-- 表（反向依赖）
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS after_sales_tickets;
DROP TABLE IF EXISTS device_bom;
DROP TABLE IF EXISTS shipment_items;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS wheel_aligners;
DROP TABLE IF EXISTS software_locks;
DROP TABLE IF EXISTS cameras;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS enterprises;

-- ============================================================================
-- 二、建表 DDL（18 张表，按外键拓扑顺序）
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 表 1: enterprises 企业表
-- ---------------------------------------------------------------------------
CREATE TABLE enterprises (
    id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    name            VARCHAR(200) NOT NULL                COMMENT '企业名称',
    type            VARCHAR(50)  NOT NULL                COMMENT '企业类型：core_tech 核心技术企业 / manufacturer 生产厂',
    contact_person  VARCHAR(100) NULL     DEFAULT NULL   COMMENT '联系人',
    contact_phone   VARCHAR(50)  NULL     DEFAULT NULL   COMMENT '联系电话',
    bank_account    VARCHAR(100) NULL     DEFAULT NULL   COMMENT '银行收款账号',
    bank_name       VARCHAR(200) NULL     DEFAULT NULL   COMMENT '开户行名称',
    created_at      DATETIME     NULL     DEFAULT NULL   COMMENT '创建时间',
    updated_at      DATETIME     NULL     DEFAULT NULL   COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业信息表：智核科技与精工定位仪制造厂';

-- ---------------------------------------------------------------------------
-- 表 2: roles 角色表
-- ---------------------------------------------------------------------------
CREATE TABLE roles (
    id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    name            VARCHAR(100) NOT NULL                COMMENT '角色编码（唯一）',
    display_name    VARCHAR(200) NOT NULL                COMMENT '角色显示名称',
    enterprise_type VARCHAR(50)  NULL     DEFAULT NULL   COMMENT '所属企业类型：core_tech / manufacturer',
    description     TEXT         NULL                    COMMENT '角色描述',
    created_at      DATETIME     NULL     DEFAULT NULL   COMMENT '创建时间',
    updated_at      DATETIME     NULL     DEFAULT NULL   COMMENT '更新时间',
    PRIMARY KEY (id),
    CONSTRAINT uk_roles_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ---------------------------------------------------------------------------
-- 表 3: permissions 权限表
-- ---------------------------------------------------------------------------
CREATE TABLE permissions (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    code        VARCHAR(100) NOT NULL                COMMENT '权限编码（唯一）',
    name        VARCHAR(200) NOT NULL                COMMENT '权限名称',
    module      VARCHAR(100) NULL     DEFAULT NULL   COMMENT '所属模块：camera/software/purchase/finance/shipment/device/statistics/after_sales/system',
    description TEXT         NULL                    COMMENT '权限描述',
    PRIMARY KEY (id),
    CONSTRAINT uk_permissions_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- ---------------------------------------------------------------------------
-- 表 4: products 产品目录表
-- ---------------------------------------------------------------------------
CREATE TABLE products (
    id                BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    code              VARCHAR(100) NOT NULL                COMMENT '产品编码（唯一）',
    name              VARCHAR(200) NOT NULL                COMMENT '产品名称',
    category          VARCHAR(50)  NOT NULL                COMMENT '产品类别：camera 相机 / software 软件',
    model             VARCHAR(100) NOT NULL                COMMENT '产品型号',
    spec              TEXT         NULL     DEFAULT NULL   COMMENT '规格说明',
    price             DECIMAL(12,2) NOT NULL                COMMENT '单价',
    function_versions JSON          NULL     DEFAULT NULL   COMMENT '软件支持的功能版本列表（仅软件类产品）',
    is_active         TINYINT(1)   NOT NULL DEFAULT 1      COMMENT '是否启用：1 是 / 0 否',
    created_at        DATETIME      NULL     DEFAULT NULL   COMMENT '创建时间',
    updated_at        DATETIME      NULL     DEFAULT NULL   COMMENT '更新时间',
    PRIMARY KEY (id),
    CONSTRAINT uk_products_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品目录表：相机与软件锁产品';

-- ---------------------------------------------------------------------------
-- 表 5: users 用户表
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    username      VARCHAR(100) NOT NULL                COMMENT '用户名（唯一）',
    password_hash VARCHAR(255) NOT NULL                COMMENT '密码哈希值（bcrypt）',
    real_name     VARCHAR(100) NULL     DEFAULT NULL   COMMENT '真实姓名',
    phone         VARCHAR(50)  NULL     DEFAULT NULL   COMMENT '手机号',
    email         VARCHAR(200) NULL     DEFAULT NULL   COMMENT '邮箱',
    enterprise_id BIGINT       NOT NULL                COMMENT '所属企业ID',
    is_active     TINYINT(1)   NOT NULL DEFAULT 1      COMMENT '是否启用：1 是 / 0 否',
    created_at    DATETIME     NULL     DEFAULT NULL   COMMENT '创建时间',
    updated_at    DATETIME     NULL     DEFAULT NULL   COMMENT '更新时间',
    PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT fk_users_enterprise_id FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ---------------------------------------------------------------------------
-- 表 6: user_roles 用户-角色关联表（M:N）
-- ---------------------------------------------------------------------------
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL                         COMMENT '用户ID',
    role_id BIGINT NOT NULL                         COMMENT '角色ID',
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-角色关联表';

-- ---------------------------------------------------------------------------
-- 表 7: role_permissions 角色-权限关联表（M:N）
-- ---------------------------------------------------------------------------
CREATE TABLE role_permissions (
    role_id       BIGINT NOT NULL                    COMMENT '角色ID',
    permission_id BIGINT NOT NULL                    COMMENT '权限ID',
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色-权限关联表';

-- ---------------------------------------------------------------------------
-- 表 8: cameras 相机表
-- ---------------------------------------------------------------------------
CREATE TABLE cameras (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    internal_id   VARCHAR(100) NOT NULL                COMMENT '内部编号（唯一），如 CAM-000001',
    sn            VARCHAR(100) NOT NULL                COMMENT '相机序列号（全局唯一）',
    model         VARCHAR(100) NOT NULL                COMMENT '相机型号',
    intrinsics    JSON         NOT NULL                COMMENT '相机内参 JSON：fx/fy/cx/cy/distortion',
    extrinsics    JSON         NOT NULL                COMMENT '相机外参 JSON：rotation/translation',
    status        VARCHAR(50)  NOT NULL DEFAULT 'in_stock' COMMENT '状态：in_stock 在库 / used 已用 / shipped 已发 / returned 退回',
    enterprise_id BIGINT       NULL     DEFAULT NULL   COMMENT '当前持有企业ID',
    synced_by     BIGINT       NULL     DEFAULT NULL   COMMENT '同步操作人用户ID',
    created_at    DATETIME     NULL     DEFAULT NULL   COMMENT '创建时间',
    updated_at    DATETIME     NULL     DEFAULT NULL   COMMENT '更新时间',
    PRIMARY KEY (id),
    CONSTRAINT uk_cameras_internal_id UNIQUE (internal_id),
    CONSTRAINT uk_cameras_sn UNIQUE (sn),
    CONSTRAINT fk_cameras_enterprise_id FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_cameras_synced_by FOREIGN KEY (synced_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='相机表：含内参外参标定数据';

-- ---------------------------------------------------------------------------
-- 表 9: software_locks 软件锁表（循环外键 bound_device_id 在建表后用 ALTER 补充）
-- ---------------------------------------------------------------------------
CREATE TABLE software_locks (
    id                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    lock_id             VARCHAR(100) NOT NULL                COMMENT '软件锁编号（唯一），如 SWLOCK-0001',
    software_version    VARCHAR(100) NOT NULL                COMMENT '软件版本号',
    function_version    VARCHAR(100) NOT NULL                COMMENT '功能版本：basic/professional/ultimate',
    function_list       JSON         NOT NULL                COMMENT '功能列表 JSON 数组',
    expire_date         DATETIME     NOT NULL                COMMENT '授权到期时间',
    status              VARCHAR(50)  NOT NULL DEFAULT 'authorized' COMMENT '状态：authorized 已授权 / bound 已绑定 / expired 已过期 / returned 已退回',
    bound_enterprise_id BIGINT       NULL     DEFAULT NULL   COMMENT '已绑定的企业ID',
    bound_device_id     BIGINT       NULL     DEFAULT NULL   COMMENT '已绑定的定位仪设备ID（循环外键，建表后 ALTER 补充）',
    synced_by           BIGINT       NULL     DEFAULT NULL   COMMENT '同步操作人用户ID',
    created_at          DATETIME     NULL     DEFAULT NULL   COMMENT '创建时间',
    updated_at          DATETIME     NULL     DEFAULT NULL   COMMENT '更新时间',
    PRIMARY KEY (id),
    CONSTRAINT uk_software_locks_lock_id UNIQUE (lock_id),
    CONSTRAINT fk_software_locks_bound_enterprise_id FOREIGN KEY (bound_enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_software_locks_synced_by FOREIGN KEY (synced_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='软件锁表：授权与绑定信息';

-- ---------------------------------------------------------------------------
-- 表 10: wheel_aligners 车轮定位仪设备表
-- ---------------------------------------------------------------------------
CREATE TABLE wheel_aligners (
    id               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    device_sn        VARCHAR(100) NOT NULL                COMMENT '设备序列号（唯一）',
    device_name      VARCHAR(200) NOT NULL                COMMENT '设备名称',
    model            VARCHAR(100) NOT NULL                COMMENT '设备型号',
    enterprise_id    BIGINT       NOT NULL                COMMENT '组装的生产厂ID',
    software_lock_id BIGINT       NOT NULL                COMMENT '绑定的软件锁ID',
    status           VARCHAR(50)  NOT NULL DEFAULT 'assembled' COMMENT '状态：assembled 已组装 / sold 已售 / returned 退回',
    assembled_by     BIGINT       NOT NULL                COMMENT '组装人用户ID',
    assembled_at     DATETIME     NULL     DEFAULT NULL   COMMENT '组装时间',
    remark           TEXT         NULL                    COMMENT '备注',
    created_at       DATETIME     NULL     DEFAULT NULL   COMMENT '创建时间',
    updated_at       DATETIME     NULL     DEFAULT NULL   COMMENT '更新时间',
    PRIMARY KEY (id),
    CONSTRAINT uk_wheel_aligners_device_sn UNIQUE (device_sn),
    CONSTRAINT fk_wheel_aligners_enterprise_id FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_wheel_aligners_software_lock_id FOREIGN KEY (software_lock_id) REFERENCES software_locks(id),
    CONSTRAINT fk_wheel_aligners_assembled_by FOREIGN KEY (assembled_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车轮定位仪设备表';

-- ---------------------------------------------------------------------------
-- 循环外键补充：software_locks.bound_device_id -> wheel_aligners.id
-- ---------------------------------------------------------------------------
ALTER TABLE software_locks
    ADD CONSTRAINT fk_software_locks_bound_device_id_wheel_aligners
        FOREIGN KEY (bound_device_id) REFERENCES wheel_aligners(id);

-- ---------------------------------------------------------------------------
-- 表 11: purchase_orders 采购订单表
-- ---------------------------------------------------------------------------
CREATE TABLE purchase_orders (
    id              BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    order_no        VARCHAR(50)   NOT NULL                COMMENT '订单号（唯一）：PO+yyyyMMdd+4位流水',
    order_type      VARCHAR(50)   NOT NULL                COMMENT '订单类型：camera 相机 / software 软件',
    enterprise_id   BIGINT        NOT NULL                COMMENT '采购的生产厂ID',
    status          VARCHAR(50)   NOT NULL DEFAULT 'draft' COMMENT '状态：draft/pending/confirmed/rejected/awaiting_payment/paid/shipped/completed',
    total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00   COMMENT '订单总金额',
    remark          TEXT          NULL                    COMMENT '备注',
    confirmed_by    BIGINT        NULL     DEFAULT NULL   COMMENT '确认人用户ID',
    confirmed_at    DATETIME      NULL     DEFAULT NULL   COMMENT '确认时间',
    rejected_reason TEXT          NULL                    COMMENT '驳回原因',
    created_by      BIGINT        NOT NULL                COMMENT '创建人用户ID',
    created_at      DATETIME      NULL     DEFAULT NULL   COMMENT '创建时间',
    updated_at      DATETIME      NULL     DEFAULT NULL   COMMENT '更新时间',
    PRIMARY KEY (id),
    CONSTRAINT uk_purchase_orders_order_no UNIQUE (order_no),
    CONSTRAINT fk_purchase_orders_enterprise_id FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_purchase_orders_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(id),
    CONSTRAINT fk_purchase_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='采购订单表';

-- ---------------------------------------------------------------------------
-- 表 12: order_items 订单明细表
-- ---------------------------------------------------------------------------
CREATE TABLE order_items (
    id                 BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    order_id           BIGINT        NOT NULL                COMMENT '订单ID',
    product_id         BIGINT        NOT NULL                COMMENT '产品ID',
    product_name       VARCHAR(200)  NOT NULL                COMMENT '产品名称（冗余）',
    product_model      VARCHAR(100)  NOT NULL                COMMENT '产品型号（冗余）',
    quantity           INT           NOT NULL                COMMENT '采购数量',
    unit_price         DECIMAL(12,2) NOT NULL                COMMENT '单价',
    function_version   VARCHAR(100)  NULL     DEFAULT NULL   COMMENT '软件功能版本（软件采购必填）',
    confirmed_quantity INT           NULL     DEFAULT NULL   COMMENT '确认数量',
    shipped_quantity   INT           NOT NULL DEFAULT 0      COMMENT '已发货数量',
    received_quantity  INT           NOT NULL DEFAULT 0      COMMENT '已收货数量',
    created_at         DATETIME      NULL     DEFAULT NULL   COMMENT '创建时间',
    updated_at         DATETIME      NULL     DEFAULT NULL   COMMENT '更新时间',
    PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
    CONSTRAINT fk_order_items_product_id FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表';

-- ---------------------------------------------------------------------------
-- 表 13: payments 付款记录表
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
    id             BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    order_id       BIGINT        NOT NULL                COMMENT '订单ID',
    amount         DECIMAL(12,2) NOT NULL                COMMENT '付款金额（须等于订单总额）',
    payment_method VARCHAR(50)   NOT NULL                COMMENT '付款方式：bank_transfer/alipay/wechat',
    payment_account VARCHAR(200) NULL     DEFAULT NULL   COMMENT '付款账户',
    payment_date   DATETIME      NOT NULL                COMMENT '付款日期',
    voucher_path   VARCHAR(500)  NOT NULL                COMMENT '付款凭证文件路径',
    status         VARCHAR(50)   NOT NULL DEFAULT 'awaiting_confirm' COMMENT '状态：awaiting_confirm/confirmed/pending_verify/amount_abnormal',
    confirmed_by   BIGINT        NULL     DEFAULT NULL   COMMENT '确认人用户ID',
    confirmed_at   DATETIME      NULL     DEFAULT NULL   COMMENT '确认时间',
    remark         TEXT          NULL                    COMMENT '备注',
    created_by     BIGINT        NOT NULL                COMMENT '创建人用户ID',
    created_at     DATETIME      NULL     DEFAULT NULL   COMMENT '创建时间',
    updated_at     DATETIME      NULL     DEFAULT NULL   COMMENT '更新时间',
    PRIMARY KEY (id),
    CONSTRAINT fk_payments_order_id FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
    CONSTRAINT fk_payments_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(id),
    CONSTRAINT fk_payments_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='付款记录表';

-- ---------------------------------------------------------------------------
-- 表 14: shipments 发货单表
-- ---------------------------------------------------------------------------
CREATE TABLE shipments (
    id                   BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    order_id             BIGINT       NOT NULL                COMMENT '订单ID',
    logistics_company    VARCHAR(200) NOT NULL                COMMENT '物流公司',
    tracking_no          VARCHAR(200) NOT NULL                COMMENT '物流单号（必填）',
    target_enterprise_id BIGINT       NOT NULL                COMMENT '目标生产厂ID',
    shipped_by           BIGINT       NOT NULL                COMMENT '发货人用户ID',
    shipped_at           DATETIME     NULL     DEFAULT NULL   COMMENT '发货时间',
    received_at          DATETIME     NULL     DEFAULT NULL   COMMENT '收货时间（用于7天退货窗口）',
    status               VARCHAR(50)  NOT NULL DEFAULT 'shipped' COMMENT '状态：shipped 已发货 / received 已收货',
    remark               TEXT         NULL                    COMMENT '备注',
    created_at           DATETIME     NULL     DEFAULT NULL   COMMENT '创建时间',
    updated_at           DATETIME     NULL     DEFAULT NULL   COMMENT '更新时间',
    PRIMARY KEY (id),
    CONSTRAINT fk_shipments_order_id FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
    CONSTRAINT fk_shipments_target_enterprise_id FOREIGN KEY (target_enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_shipments_shipped_by FOREIGN KEY (shipped_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发货单表';

-- ---------------------------------------------------------------------------
-- 表 15: shipment_items 发货明细表
-- ---------------------------------------------------------------------------
CREATE TABLE shipment_items (
    id               BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    shipment_id      BIGINT      NOT NULL                COMMENT '发货单ID',
    order_item_id    BIGINT      NOT NULL                COMMENT '订单明细ID',
    item_type        VARCHAR(50) NOT NULL                COMMENT '明细类型：camera 相机 / software_lock 软件锁',
    item_sn          VARCHAR(100) NOT NULL                COMMENT '明细序列号',
    camera_id        BIGINT      NULL     DEFAULT NULL   COMMENT '关联相机ID（可空）',
    software_lock_id BIGINT      NULL     DEFAULT NULL   COMMENT '关联软件锁ID（可空）',
    quantity         INT         NOT NULL DEFAULT 1      COMMENT '数量',
    created_at       DATETIME    NULL     DEFAULT NULL   COMMENT '创建时间',
    PRIMARY KEY (id),
    CONSTRAINT fk_shipment_items_shipment_id FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    CONSTRAINT fk_shipment_items_order_item_id FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    CONSTRAINT fk_shipment_items_camera_id FOREIGN KEY (camera_id) REFERENCES cameras(id),
    CONSTRAINT fk_shipment_items_software_lock_id FOREIGN KEY (software_lock_id) REFERENCES software_locks(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发货明细表';

-- ---------------------------------------------------------------------------
-- 表 16: device_bom 设备物料清单表
-- ---------------------------------------------------------------------------
CREATE TABLE device_bom (
    id               BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    device_id        BIGINT      NOT NULL                COMMENT '设备ID',
    item_type        VARCHAR(50) NOT NULL                COMMENT '物料类型：software_lock 软件锁 / camera 相机',
    camera_id        BIGINT      NULL     DEFAULT NULL   COMMENT '关联相机ID',
    software_lock_id BIGINT      NULL     DEFAULT NULL   COMMENT '关联软件锁ID',
    position_label   VARCHAR(100) NULL    DEFAULT NULL   COMMENT '位置标签：如 left/right',
    created_at       DATETIME    NULL     DEFAULT NULL   COMMENT '创建时间',
    PRIMARY KEY (id),
    CONSTRAINT fk_device_bom_device_id FOREIGN KEY (device_id) REFERENCES wheel_aligners(id),
    CONSTRAINT fk_device_bom_camera_id FOREIGN KEY (camera_id) REFERENCES cameras(id),
    CONSTRAINT fk_device_bom_software_lock_id FOREIGN KEY (software_lock_id) REFERENCES software_locks(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备BOM表：设备物料清单';

-- ---------------------------------------------------------------------------
-- 表 17: after_sales_tickets 售后工单表
-- ---------------------------------------------------------------------------
CREATE TABLE after_sales_tickets (
    id               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    ticket_no        VARCHAR(50)  NOT NULL                COMMENT '工单号（唯一）：AS+yyyyMMdd+4位流水',
    type             VARCHAR(50)  NOT NULL                COMMENT '类型：camera_repair/camera_replace/camera_return/software_upgrade/software_reactivate/software_replace/software_return',
    category         VARCHAR(50)  NOT NULL                COMMENT '分类：camera 相机 / software 软件',
    item_sn          VARCHAR(100) NOT NULL                COMMENT '物料序列号',
    camera_id        BIGINT       NULL     DEFAULT NULL   COMMENT '关联相机ID',
    software_lock_id BIGINT       NULL     DEFAULT NULL   COMMENT '关联软件锁ID',
    device_id        BIGINT       NULL     DEFAULT NULL   COMMENT '关联设备ID',
    enterprise_id    BIGINT       NOT NULL                COMMENT '发起企业ID',
    title            VARCHAR(200) NOT NULL                COMMENT '工单标题',
    description      TEXT         NOT NULL                COMMENT '问题描述',
    status           VARCHAR(50)  NOT NULL DEFAULT 'pending' COMMENT '状态：pending/processing/resolved/closed/rejected',
    handler_id       BIGINT       NULL     DEFAULT NULL   COMMENT '处理人用户ID',
    handled_at       DATETIME     NULL     DEFAULT NULL   COMMENT '处理时间',
    resolution       TEXT         NULL                    COMMENT '处理结果说明',
    created_by       BIGINT       NOT NULL                COMMENT '创建人用户ID',
    created_at       DATETIME     NULL     DEFAULT NULL   COMMENT '创建时间',
    updated_at       DATETIME     NULL     DEFAULT NULL   COMMENT '更新时间',
    PRIMARY KEY (id),
    CONSTRAINT uk_after_sales_tickets_ticket_no UNIQUE (ticket_no),
    CONSTRAINT fk_after_sales_tickets_camera_id FOREIGN KEY (camera_id) REFERENCES cameras(id),
    CONSTRAINT fk_after_sales_tickets_software_lock_id FOREIGN KEY (software_lock_id) REFERENCES software_locks(id),
    CONSTRAINT fk_after_sales_tickets_device_id FOREIGN KEY (device_id) REFERENCES wheel_aligners(id),
    CONSTRAINT fk_after_sales_tickets_enterprise_id FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_after_sales_tickets_handler_id FOREIGN KEY (handler_id) REFERENCES users(id),
    CONSTRAINT fk_after_sales_tickets_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='售后工单表';

-- ---------------------------------------------------------------------------
-- 表 18: notifications 通知表
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id       BIGINT       NULL     DEFAULT NULL   COMMENT '接收用户ID（NULL 表示广播）',
    enterprise_id BIGINT       NULL     DEFAULT NULL   COMMENT '接收企业ID',
    title         VARCHAR(200) NOT NULL                COMMENT '标题',
    content       TEXT         NOT NULL                COMMENT '内容',
    type          VARCHAR(50)  NOT NULL                COMMENT '类型：order/payment/shipment/system',
    is_read       TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '是否已读：1 是 / 0 否',
    related_type  VARCHAR(50)  NULL     DEFAULT NULL   COMMENT '关联对象类型',
    related_id    BIGINT       NULL     DEFAULT NULL   COMMENT '关联对象ID',
    created_at    DATETIME     NULL     DEFAULT NULL   COMMENT '创建时间',
    PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_notifications_enterprise_id FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知消息表';

-- ============================================================================
-- 三、索引设计（外键列 + 业务高频查询列）
-- ============================================================================

-- users
CREATE INDEX idx_users_enterprise_id        ON users(enterprise_id);

-- cameras
CREATE INDEX idx_cameras_enterprise_id      ON cameras(enterprise_id);
CREATE INDEX idx_cameras_synced_by         ON cameras(synced_by);
CREATE INDEX idx_cameras_status            ON cameras(status);
CREATE INDEX idx_cameras_model             ON cameras(model);

-- software_locks
CREATE INDEX idx_software_locks_bound_enterprise_id ON software_locks(bound_enterprise_id);
CREATE INDEX idx_software_locks_bound_device_id     ON software_locks(bound_device_id);
CREATE INDEX idx_software_locks_synced_by            ON software_locks(synced_by);
CREATE INDEX idx_software_locks_status               ON software_locks(status);

-- wheel_aligners
CREATE INDEX idx_wheel_aligners_enterprise_id    ON wheel_aligners(enterprise_id);
CREATE INDEX idx_wheel_aligners_software_lock_id ON wheel_aligners(software_lock_id);
CREATE INDEX idx_wheel_aligners_assembled_by     ON wheel_aligners(assembled_by);

-- purchase_orders
CREATE INDEX idx_purchase_orders_enterprise_id ON purchase_orders(enterprise_id);
CREATE INDEX idx_purchase_orders_confirmed_by  ON purchase_orders(confirmed_by);
CREATE INDEX idx_purchase_orders_created_by    ON purchase_orders(created_by);
CREATE INDEX idx_purchase_orders_status       ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_created_at    ON purchase_orders(created_at);

-- order_items
CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- payments
CREATE INDEX idx_payments_order_id     ON payments(order_id);
CREATE INDEX idx_payments_confirmed_by ON payments(confirmed_by);
CREATE INDEX idx_payments_created_by   ON payments(created_by);
CREATE INDEX idx_payments_status       ON payments(status);

-- shipments
CREATE INDEX idx_shipments_order_id             ON shipments(order_id);
CREATE INDEX idx_shipments_target_enterprise_id ON shipments(target_enterprise_id);
CREATE INDEX idx_shipments_shipped_by           ON shipments(shipped_by);
CREATE INDEX idx_shipments_status               ON shipments(status);
CREATE INDEX idx_shipments_tracking_no         ON shipments(tracking_no);

-- shipment_items
CREATE INDEX idx_shipment_items_shipment_id   ON shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_order_item_id ON shipment_items(order_item_id);
CREATE INDEX idx_shipment_items_camera_id     ON shipment_items(camera_id);
CREATE INDEX idx_shipment_items_software_lock_id ON shipment_items(software_lock_id);

-- device_bom
CREATE INDEX idx_device_bom_device_id         ON device_bom(device_id);
CREATE INDEX idx_device_bom_camera_id         ON device_bom(camera_id);
CREATE INDEX idx_device_bom_software_lock_id   ON device_bom(software_lock_id);

-- after_sales_tickets
CREATE INDEX idx_after_sales_tickets_camera_id        ON after_sales_tickets(camera_id);
CREATE INDEX idx_after_sales_tickets_software_lock_id ON after_sales_tickets(software_lock_id);
CREATE INDEX idx_after_sales_tickets_device_id        ON after_sales_tickets(device_id);
CREATE INDEX idx_after_sales_tickets_enterprise_id    ON after_sales_tickets(enterprise_id);
CREATE INDEX idx_after_sales_tickets_handler_id        ON after_sales_tickets(handler_id);
CREATE INDEX idx_after_sales_tickets_created_by        ON after_sales_tickets(created_by);
CREATE INDEX idx_after_sales_tickets_status            ON after_sales_tickets(status);

-- notifications
CREATE INDEX idx_notifications_user_id       ON notifications(user_id);
CREATE INDEX idx_notifications_enterprise_id ON notifications(enterprise_id);
CREATE INDEX idx_notifications_created_at    ON notifications(created_at);

-- ============================================================================
-- 四、视图（3 个）
-- ============================================================================

-- 视图1：设备全链路追溯
CREATE VIEW v_device_traceability AS
SELECT wa.device_sn, wa.device_name, wa.model, wa.status,
       e.name AS enterprise_name,
       sl.lock_id, sl.software_version, sl.function_version, sl.expire_date,
       u.username AS assembled_by_username, u.real_name AS assembled_by_name,
       wa.assembled_at
FROM wheel_aligners wa
JOIN enterprises e ON wa.enterprise_id = e.id
JOIN software_locks sl ON wa.software_lock_id = sl.id
JOIN users u ON wa.assembled_by = u.id;

-- 视图2：订单汇总
CREATE VIEW v_order_summary AS
SELECT po.id, po.order_no, po.order_type, po.status, po.total_amount,
       e.name AS enterprise_name,
       (SELECT COALESCE(SUM(p.amount),0) FROM payments p WHERE p.order_id=po.id AND p.status='confirmed') AS paid_amount,
       (SELECT COUNT(*) FROM shipments s WHERE s.order_id=po.id) AS shipment_count,
       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id=po.id) AS item_count,
       po.created_at
FROM purchase_orders po
JOIN enterprises e ON po.enterprise_id = e.id;

-- 视图3：相机库存统计
CREATE VIEW v_camera_inventory AS
SELECT c.model, c.status, COUNT(*) AS quantity
FROM cameras c
GROUP BY c.model, c.status;

-- ============================================================================
-- 五、存储过程（2 个）
-- 说明：DELIMITER 是 MySQL 客户端指令；PowerDesigner 导入时若报错可分段执行
-- ============================================================================

-- 存储过程1：订单号生成 PO+yyyyMMdd+4位流水
DELIMITER $$
CREATE PROCEDURE sp_generate_order_no(IN p_order_type VARCHAR(50), OUT p_order_no VARCHAR(50))
BEGIN
    DECLARE v_date_str VARCHAR(8);
    DECLARE v_seq INT;
    DECLARE v_prefix VARCHAR(10);
    SET v_prefix = 'PO';
    SET v_date_str = DATE_FORMAT(CURDATE(), '%Y%m%d');
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_no, 11, 4) AS UNSIGNED)), 0) + 1
      INTO v_seq
      FROM purchase_orders
      WHERE order_no LIKE CONCAT(v_prefix, v_date_str, '%');
    SET p_order_no = CONCAT(v_prefix, v_date_str, LPAD(v_seq, 4, '0'));
END$$
DELIMITER ;

-- 存储过程2：设备全链路追溯查询
DELIMITER $$
CREATE PROCEDURE sp_device_traceability(IN p_device_sn VARCHAR(100))
BEGIN
    -- 设备主体信息
    SELECT wa.id, wa.device_sn, wa.device_name, wa.model, wa.status, wa.assembled_at,
           e.name AS enterprise_name,
           sl.lock_id, sl.software_version, sl.function_version, sl.expire_date, sl.status AS lock_status,
           u.real_name AS assembled_by_name
    FROM wheel_aligners wa
    JOIN enterprises e ON wa.enterprise_id = e.id
    JOIN software_locks sl ON wa.software_lock_id = sl.id
    JOIN users u ON wa.assembled_by = u.id
    WHERE wa.device_sn = p_device_sn;
    -- BOM 部件信息
    SELECT db.id, db.item_type, db.position_label,
           c.sn AS camera_sn, c.model AS camera_model,
           sl.lock_id AS bom_lock_id
    FROM device_bom db
    JOIN wheel_aligners wa ON db.device_id = wa.id
    LEFT JOIN cameras c ON db.camera_id = c.id
    LEFT JOIN software_locks sl ON db.software_lock_id = sl.id
    WHERE wa.device_sn = p_device_sn;
END$$
DELIMITER ;

-- ============================================================================
-- 六、触发器（1 个示范：updated_at 自动维护）
-- 说明：仅以 enterprises 表为示范，其它带 updated_at 的表可按相同模式扩展
--       （如 users/products/cameras/software_locks/wheel_aligners/purchase_orders/
--         order_items/payments/shipments/after_sales_tickets/roles 等）
-- ============================================================================

DELIMITER $$
CREATE TRIGGER trg_enterprises_updated_at
BEFORE UPDATE ON enterprises
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$
DELIMITER ;

-- ============================================================================
-- 七、初始测试数据 INSERT（按外键依赖顺序）
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. enterprises 企业（2 条）
-- ---------------------------------------------------------------------------
INSERT INTO enterprises (id, name, type, contact_person, contact_phone, bank_account, bank_name, created_at, updated_at) VALUES
(1, '智核科技有限公司', 'core_tech', '王技术', '13800001111', '6228480402564890018', '中国工商银行高新区支行', NOW(), NOW()),
(2, '精工定位仪制造厂', 'manufacturer', '李厂长', '13900002222', '6228480402564890026', '中国建设银行工业园区支行', NOW(), NOW());

-- ---------------------------------------------------------------------------
-- 2. permissions 权限（21 条）
-- ---------------------------------------------------------------------------
INSERT INTO permissions (code, name, module, description) VALUES
('camera:sync',           '相机信息同步',  'camera',      '同步相机标定数据到系统'),
('camera:view',           '相机信息查看',  'camera',      '查看相机列表与详情'),
('software_lock:sync',    '软件锁授权同步', 'software',   '同步软件锁授权信息'),
('software_lock:view',    '软件锁信息查看', 'software',   '查看软件锁列表与详情'),
('purchase_order:create', '创建采购订单',  'purchase',    '提交采购订单'),
('purchase_order:view',   '查看采购订单',  'purchase',    '查看订单列表与详情'),
('purchase_order:confirm', '确认采购订单', 'purchase',    '确认或驳回订单'),
('payment:create',        '订单付款',      'finance',     '提交付款信息与凭证'),
('payment:view',          '查看付款记录',  'finance',     '查看付款记录与凭证'),
('payment:confirm',       '收款确认',      'finance',     '确认收款或标记异常'),
('shipment:create',       '产品发货',      'shipment',    '创建发货单'),
('shipment:view',         '查看发货记录',  'shipment',    '查看发货单列表与详情'),
('receive:confirm',       '收货确认',      'shipment',    '确认收货与差异申报'),
('device:register',       '登记定位仪设备', 'device',     '登记新设备与BOM'),
('device:view',           '查看设备信息',  'device',      '查看设备列表与详情'),
('traceability:query',    '查询追溯信息',  'device',      '查询设备追溯链条'),
('statistics:view',       '查看统计汇总',  'statistics',  '查看统计分析数据'),
('after_sales:create',    '创建售后工单', 'after_sales', '发起售后申请'),
('after_sales:handle',    '处理售后工单', 'after_sales', '处理售后工单'),
('after_sales:view',      '查看售后工单', 'after_sales', '查看售后工单列表'),
('user:manage',           '用户管理',      'system',      '管理用户、角色、权限');

-- ---------------------------------------------------------------------------
-- 3. roles 角色（8 条）
-- ---------------------------------------------------------------------------
INSERT INTO roles (name, display_name, enterprise_type, description, created_at, updated_at) VALUES
('camera_producer',    '相机生产人员',  'core_tech',    '负责相机组装与标定数据同步', NOW(), NOW()),
('software_admin',     '软件管理员',    'core_tech',    '负责软件锁授权管理',         NOW(), NOW()),
('business_staff',     '业务员',        'core_tech',    '负责订单确认与发货',         NOW(), NOW()),
('finance_staff',      '财务人员',      'core_tech',    '负责收款确认',               NOW(), NOW()),
('quality_staff',      '质量人员',      'core_tech',    '负责质量追溯',               NOW(), NOW()),
('purchaser',          '采购员',        'manufacturer', '负责采购订单与付款',         NOW(), NOW()),
('assembler',          '组装人员',      'manufacturer', '负责设备组装登记',           NOW(), NOW()),
('manufacturer_admin', '生产厂管理员',  'manufacturer', '生产厂系统管理',             NOW(), NOW());

-- ---------------------------------------------------------------------------
-- 4. role_permissions 角色-权限映射（按 seed_data.py ROLE_PERMISSIONS_MAP）
--    使用 INSERT...SELECT 按 role.name 与 permission.code 关联
-- ---------------------------------------------------------------------------
-- camera_producer (5)
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='camera_producer'    AND p.code='camera:sync';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='camera_producer'    AND p.code='camera:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='camera_producer'    AND p.code='software_lock:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='camera_producer'    AND p.code='device:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='camera_producer'    AND p.code='traceability:query';
-- software_admin (5)
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='software_admin'     AND p.code='software_lock:sync';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='software_admin'     AND p.code='software_lock:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='software_admin'     AND p.code='camera:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='software_admin'     AND p.code='device:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='software_admin'     AND p.code='traceability:query';
-- business_staff (10)
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='business_staff'     AND p.code='purchase_order:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='business_staff'     AND p.code='purchase_order:confirm';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='business_staff'     AND p.code='shipment:create';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='business_staff'     AND p.code='shipment:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='business_staff'     AND p.code='payment:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='business_staff'     AND p.code='device:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='business_staff'     AND p.code='traceability:query';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='business_staff'     AND p.code='statistics:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='business_staff'     AND p.code='after_sales:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='business_staff'     AND p.code='after_sales:handle';
-- finance_staff (4)
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='finance_staff'      AND p.code='payment:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='finance_staff'      AND p.code='payment:confirm';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='finance_staff'      AND p.code='purchase_order:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='finance_staff'      AND p.code='statistics:view';
-- quality_staff (6)
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='quality_staff'      AND p.code='camera:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='quality_staff'      AND p.code='software_lock:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='quality_staff'      AND p.code='device:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='quality_staff'      AND p.code='traceability:query';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='quality_staff'      AND p.code='statistics:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='quality_staff'      AND p.code='after_sales:view';
-- purchaser (8)
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='purchaser'          AND p.code='purchase_order:create';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='purchaser'          AND p.code='purchase_order:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='purchaser'          AND p.code='payment:create';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='purchaser'          AND p.code='payment:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='purchaser'          AND p.code='shipment:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='purchaser'          AND p.code='receive:confirm';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='purchaser'          AND p.code='after_sales:create';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='purchaser'          AND p.code='after_sales:view';
-- assembler (7)
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='assembler'          AND p.code='device:register';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='assembler'          AND p.code='device:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='assembler'          AND p.code='camera:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='assembler'          AND p.code='software_lock:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='assembler'          AND p.code='traceability:query';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='assembler'          AND p.code='after_sales:create';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='assembler'          AND p.code='after_sales:view';
-- manufacturer_admin (12)
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='manufacturer_admin' AND p.code='purchase_order:create';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='manufacturer_admin' AND p.code='purchase_order:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='manufacturer_admin' AND p.code='payment:create';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='manufacturer_admin' AND p.code='payment:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='manufacturer_admin' AND p.code='shipment:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='manufacturer_admin' AND p.code='receive:confirm';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='manufacturer_admin' AND p.code='device:register';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='manufacturer_admin' AND p.code='device:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='manufacturer_admin' AND p.code='traceability:query';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='manufacturer_admin' AND p.code='after_sales:create';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='manufacturer_admin' AND p.code='after_sales:view';
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='manufacturer_admin' AND p.code='statistics:view';

-- ---------------------------------------------------------------------------
-- 5. users 用户（8 条）
--    密码均为 123456；password_hash 为占位字符串，真实环境由 passlib bcrypt 生成
-- ---------------------------------------------------------------------------
INSERT INTO users (id, username, password_hash, real_name, enterprise_id, is_active, created_at, updated_at) VALUES
(1, 'cam_user',   '$2b$12$placeholder_hash_for_123456_demo_only', '相机操作员',   1, 1, NOW(), NOW()),
(2, 'sw_admin',   '$2b$12$placeholder_hash_for_123456_demo_only', '软件管理员',   1, 1, NOW(), NOW()),
(3, 'biz_staff',  '$2b$12$placeholder_hash_for_123456_demo_only', '业务员张三',   1, 1, NOW(), NOW()),
(4, 'fin_staff',  '$2b$12$placeholder_hash_for_123456_demo_only', '财务李四',     1, 1, NOW(), NOW()),
(5, 'qa_staff',   '$2b$12$placeholder_hash_for_123456_demo_only', '质量员王五',   1, 1, NOW(), NOW()),
(6, 'purchaser',  '$2b$12$placeholder_hash_for_123456_demo_only', '采购员赵六',   2, 1, NOW(), NOW()),
(7, 'assembler',  '$2b$12$placeholder_hash_for_123456_demo_only', '组装员钱七',   2, 1, NOW(), NOW()),
(8, 'mfr_admin',  '$2b$12$placeholder_hash_for_123456_demo_only', '厂管理员孙八', 2, 1, NOW(), NOW());

-- ---------------------------------------------------------------------------
-- 6. user_roles 用户-角色映射（按 username 与 role.name 子查询关联）
-- ---------------------------------------------------------------------------
INSERT INTO user_roles(user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.username='cam_user'   AND r.name='camera_producer';
INSERT INTO user_roles(user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.username='sw_admin'   AND r.name='software_admin';
INSERT INTO user_roles(user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.username='biz_staff'  AND r.name='business_staff';
INSERT INTO user_roles(user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.username='fin_staff'  AND r.name='finance_staff';
INSERT INTO user_roles(user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.username='qa_staff'   AND r.name='quality_staff';
INSERT INTO user_roles(user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.username='purchaser'  AND r.name='purchaser';
INSERT INTO user_roles(user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.username='assembler'  AND r.name='assembler';
INSERT INTO user_roles(user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.username='mfr_admin'  AND r.name='manufacturer_admin';

-- ---------------------------------------------------------------------------
-- 7. products 产品目录（6 条）
-- ---------------------------------------------------------------------------
INSERT INTO products (code, name, category, model, spec, price, function_versions, is_active, created_at, updated_at) VALUES
('CAM-A100',    '高精度工业相机 A100', 'camera',   'A100', '500万像素，全局快门', 3500.00,  NULL,                                                                1, NOW(), NOW()),
('CAM-A200',    '高精度工业相机 A200', 'camera',   'A200', '800万像素，全局快门', 5800.00,  NULL,                                                                1, NOW(), NOW()),
('CAM-B100',    '标定相机 B100',       'camera',   'B100', '300万像素，卷帘快门', 2200.00,  NULL,                                                                1, NOW(), NOW()),
('SW-LOCK-STD', '软件锁-标准版',       'software', 'STD',  '标准功能版本',        8000.00,  JSON_ARRAY('basic_alignment'),                                       1, NOW(), NOW()),
('SW-LOCK-PRO', '软件锁-专业版',       'software', 'PRO',  '专业功能版本',        15000.00, JSON_ARRAY('basic_alignment','3d_alignment','wheel_measurement'),     1, NOW(), NOW()),
('SW-LOCK-ULT', '软件锁-旗舰版',       'software', 'ULT',  '旗舰功能版本',        25000.00, JSON_ARRAY('basic_alignment','3d_alignment','wheel_measurement','report_export','remote_diagnosis'), 1, NOW(), NOW());

-- ---------------------------------------------------------------------------
-- 8. cameras 相机（10 条，i=1..10）
--    internal_id = CAM-{i:06d}，sn = CAM2026{i:04d}
--    model = A100 if i<=5 else A200
--    intrinsics.fx/fy = 800+i, cx=320, cy=240, distortion=[0.1,-0.05,0,0,0]
--    extrinsics.rotation = 3x3 单位矩阵, translation = [0,0,0]
-- ---------------------------------------------------------------------------
INSERT INTO cameras (internal_id, sn, model, intrinsics, extrinsics, status, enterprise_id, synced_by, created_at, updated_at) VALUES
('CAM-000001', 'CAM20260001', 'A100', JSON_OBJECT('fx', 801.0, 'fy', 801.0, 'cx', 320.0, 'cy', 240.0, 'distortion', JSON_ARRAY(0.1, -0.05, 0, 0, 0)), JSON_OBJECT('rotation', JSON_ARRAY(1.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0), 'translation', JSON_ARRAY(0.0,0.0,0.0)), 'in_stock', 1, NULL, NOW(), NOW()),
('CAM-000002', 'CAM20260002', 'A100', JSON_OBJECT('fx', 802.0, 'fy', 802.0, 'cx', 320.0, 'cy', 240.0, 'distortion', JSON_ARRAY(0.1, -0.05, 0, 0, 0)), JSON_OBJECT('rotation', JSON_ARRAY(1.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0), 'translation', JSON_ARRAY(0.0,0.0,0.0)), 'in_stock', 1, NULL, NOW(), NOW()),
('CAM-000003', 'CAM20260003', 'A100', JSON_OBJECT('fx', 803.0, 'fy', 803.0, 'cx', 320.0, 'cy', 240.0, 'distortion', JSON_ARRAY(0.1, -0.05, 0, 0, 0)), JSON_OBJECT('rotation', JSON_ARRAY(1.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0), 'translation', JSON_ARRAY(0.0,0.0,0.0)), 'in_stock', 1, NULL, NOW(), NOW()),
('CAM-000004', 'CAM20260004', 'A100', JSON_OBJECT('fx', 804.0, 'fy', 804.0, 'cx', 320.0, 'cy', 240.0, 'distortion', JSON_ARRAY(0.1, -0.05, 0, 0, 0)), JSON_OBJECT('rotation', JSON_ARRAY(1.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0), 'translation', JSON_ARRAY(0.0,0.0,0.0)), 'in_stock', 1, NULL, NOW(), NOW()),
('CAM-000005', 'CAM20260005', 'A100', JSON_OBJECT('fx', 805.0, 'fy', 805.0, 'cx', 320.0, 'cy', 240.0, 'distortion', JSON_ARRAY(0.1, -0.05, 0, 0, 0)), JSON_OBJECT('rotation', JSON_ARRAY(1.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0), 'translation', JSON_ARRAY(0.0,0.0,0.0)), 'in_stock', 1, NULL, NOW(), NOW()),
('CAM-000006', 'CAM20260006', 'A200', JSON_OBJECT('fx', 806.0, 'fy', 806.0, 'cx', 320.0, 'cy', 240.0, 'distortion', JSON_ARRAY(0.1, -0.05, 0, 0, 0)), JSON_OBJECT('rotation', JSON_ARRAY(1.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0), 'translation', JSON_ARRAY(0.0,0.0,0.0)), 'in_stock', 1, NULL, NOW(), NOW()),
('CAM-000007', 'CAM20260007', 'A200', JSON_OBJECT('fx', 807.0, 'fy', 807.0, 'cx', 320.0, 'cy', 240.0, 'distortion', JSON_ARRAY(0.1, -0.05, 0, 0, 0)), JSON_OBJECT('rotation', JSON_ARRAY(1.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0), 'translation', JSON_ARRAY(0.0,0.0,0.0)), 'in_stock', 1, NULL, NOW(), NOW()),
('CAM-000008', 'CAM20260008', 'A200', JSON_OBJECT('fx', 808.0, 'fy', 808.0, 'cx', 320.0, 'cy', 240.0, 'distortion', JSON_ARRAY(0.1, -0.05, 0, 0, 0)), JSON_OBJECT('rotation', JSON_ARRAY(1.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0), 'translation', JSON_ARRAY(0.0,0.0,0.0)), 'in_stock', 1, NULL, NOW(), NOW()),
('CAM-000009', 'CAM20260009', 'A200', JSON_OBJECT('fx', 809.0, 'fy', 809.0, 'cx', 320.0, 'cy', 240.0, 'distortion', JSON_ARRAY(0.1, -0.05, 0, 0, 0)), JSON_OBJECT('rotation', JSON_ARRAY(1.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0), 'translation', JSON_ARRAY(0.0,0.0,0.0)), 'in_stock', 1, NULL, NOW(), NOW()),
('CAM-000010', 'CAM20260010', 'A200', JSON_OBJECT('fx', 810.0, 'fy', 810.0, 'cx', 320.0, 'cy', 240.0, 'distortion', JSON_ARRAY(0.1, -0.05, 0, 0, 0)), JSON_OBJECT('rotation', JSON_ARRAY(1.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0), 'translation', JSON_ARRAY(0.0,0.0,0.0)), 'in_stock', 1, NULL, NOW(), NOW());

-- ---------------------------------------------------------------------------
-- 9. software_locks 软件锁（5 条，i=1..5）
--    lock_id = SWLOCK-{i:04d}, software_version = v2.3.1
--    function_version = ['basic','professional','ultimate'][i%3]
--      i=1 -> professional, i=2 -> ultimate, i=3 -> basic, i=4 -> professional, i=5 -> ultimate
--    function_list = ['3d_alignment','wheel_measurement'] if i%2==0 else ['basic_alignment']
--    bound_enterprise_id = 2 if i<=3 else NULL
--    bound_device_id = NULL
-- ---------------------------------------------------------------------------
INSERT INTO software_locks (lock_id, software_version, function_version, function_list, expire_date, status, bound_enterprise_id, bound_device_id, synced_by, created_at, updated_at) VALUES
('SWLOCK-0001', 'v2.3.1', 'professional', JSON_ARRAY('basic_alignment'),                         DATE_ADD(NOW(), INTERVAL 365 DAY), 'authorized', 2,    NULL, NULL, NOW(), NOW()),
('SWLOCK-0002', 'v2.3.1', 'ultimate',     JSON_ARRAY('3d_alignment','wheel_measurement'),       DATE_ADD(NOW(), INTERVAL 365 DAY), 'authorized', 2,    NULL, NULL, NOW(), NOW()),
('SWLOCK-0003', 'v2.3.1', 'basic',        JSON_ARRAY('basic_alignment'),                         DATE_ADD(NOW(), INTERVAL 365 DAY), 'authorized', 2,    NULL, NULL, NOW(), NOW()),
('SWLOCK-0004', 'v2.3.1', 'professional', JSON_ARRAY('3d_alignment','wheel_measurement'),       DATE_ADD(NOW(), INTERVAL 365 DAY), 'authorized', NULL, NULL, NULL, NOW(), NOW()),
('SWLOCK-0005', 'v2.3.1', 'ultimate',     JSON_ARRAY('basic_alignment'),                         DATE_ADD(NOW(), INTERVAL 365 DAY), 'authorized', NULL, NULL, NULL, NOW(), NOW());

-- ============================================================================
-- 八、脚本结束
-- 重新启用外键检查
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 脚本说明：
--   * 本脚本可在 MySQL 8.0 命令行一次性执行无报错
--   * 可在 PowerDesigner 中通过 Database -> Reverse Engineer 或 Import SQL File 导入并生成完整 ER 图
--   * 初始账号密码均为 123456（演示用，password_hash 为占位字符串）
--   * 触发器仅以 enterprises 表为示范，其它带 updated_at 的表可按相同模式扩展
-- ============================================================================
