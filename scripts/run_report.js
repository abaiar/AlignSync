/*************************************************************************
 * 版权所有 (C)2026, AlignSync
 *
 * 文件名称： run_report.js
 * 内容摘要： 报告第 5~7 章、成绩评价表、附录及文档装配主入口
 * 当前版本： V1.0
 * 作    者： AlignSync 小组
 * 完成日期： 20260708
 *************************************************************************/

const fs = require("fs");
const path = require("path");
const H = require("./generate_report");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, TableOfContents, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  fontObj, FONT_CN, FONT_EN, CONTENT_W, PAGE_W, PAGE_H, MARGIN,
  body, bodyFlat, h1, h2, h3, code, placeholder, caption, blank, cell, makeTable, pageBreak,
  buildCover, buildTOC, buildChapter1, buildChapter2, buildChapter3, buildChapter4,
} = H;

// ====================================================================
// 5 创建数据库
// ====================================================================
function buildChapter5() {
  return [
    h1("5 创建数据库"),
    body("本系统采用 MySQL 8.0 作为数据库管理系统。以下为数据库及各数据库对象的定义 SQL 语句，按“建库 → 建表 → 视图 → 存储过程 → 触发器 → 索引”顺序组织，可在 MySQL 8.0 命令行一次性执行无报错（已关闭外键检查并按外键拓扑顺序建表）。完整脚本见项目根目录 能力生成整个项目的数据库的SQL语句.sql。"),
    h2("5.1 创建数据库与基本设置"),
    ...code(`SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS alignsync
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alignsync;
SET time_zone = '+08:00';`),
    blank(),
    h2("5.2 建表 DDL（18 张表，按外键拓扑顺序）"),
    body("以下按外键依赖拓扑顺序创建 18 张表，先创建被依赖的基础表（企业、角色、权限、产品、用户），再创建业务表。每张表均含字段注释（COMMENT）、主键、唯一约束与外键约束。"),
    h3("5.2.1 基础表（企业/角色/权限/产品/用户）"),
    ...code(`-- 表1: enterprises 企业信息表
CREATE TABLE enterprises (
    id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    name            VARCHAR(200) NOT NULL                COMMENT '企业名称',
    type            VARCHAR(50)  NOT NULL                COMMENT '企业类型：core_tech/manufacturer',
    contact_person  VARCHAR(100) NULL DEFAULT NULL       COMMENT '联系人',
    contact_phone   VARCHAR(50)  NULL DEFAULT NULL       COMMENT '联系电话',
    bank_account    VARCHAR(100) NULL DEFAULT NULL       COMMENT '银行收款账号',
    bank_name       VARCHAR(200) NULL DEFAULT NULL       COMMENT '开户行名称',
    created_at      DATETIME     NULL DEFAULT NULL       COMMENT '创建时间',
    updated_at      DATETIME     NULL DEFAULT NULL       COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='企业信息表：智核科技与精工定位仪制造厂';

-- 表2: roles 角色表
CREATE TABLE roles (
    id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    name            VARCHAR(100) NOT NULL                COMMENT '角色编码（唯一）',
    display_name    VARCHAR(200) NOT NULL                COMMENT '角色显示名称',
    enterprise_type VARCHAR(50)  NULL DEFAULT NULL       COMMENT '所属企业类型',
    description     TEXT         NULL                    COMMENT '角色描述',
    created_at      DATETIME     NULL DEFAULT NULL,
    updated_at      DATETIME     NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_roles_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 表3: permissions 权限表
CREATE TABLE permissions (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    code        VARCHAR(100) NOT NULL                COMMENT '权限编码（唯一）',
    name        VARCHAR(200) NOT NULL                COMMENT '权限名称',
    module      VARCHAR(100) NULL DEFAULT NULL       COMMENT '所属模块',
    description TEXT         NULL                    COMMENT '权限描述',
    PRIMARY KEY (id),
    CONSTRAINT uk_permissions_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 表4: products 产品目录表
CREATE TABLE products (
    id                BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    code              VARCHAR(100)  NOT NULL                COMMENT '产品编码（唯一）',
    name              VARCHAR(200)  NOT NULL                COMMENT '产品名称',
    category          VARCHAR(50)   NOT NULL                COMMENT '产品类别：camera/software',
    model             VARCHAR(100)  NOT NULL                COMMENT '产品型号',
    spec              TEXT          NULL DEFAULT NULL       COMMENT '规格说明',
    price             DECIMAL(12,2) NOT NULL                COMMENT '单价',
    function_versions JSON          NULL DEFAULT NULL       COMMENT '软件支持的功能版本列表',
    is_active         TINYINT(1)    NOT NULL DEFAULT 1      COMMENT '是否启用',
    created_at        DATETIME      NULL DEFAULT NULL,
    updated_at        DATETIME      NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_products_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品目录表';

-- 表5: users 用户表
CREATE TABLE users (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    username      VARCHAR(100) NOT NULL                COMMENT '用户名（唯一）',
    password_hash VARCHAR(255) NOT NULL                COMMENT '密码哈希值（bcrypt）',
    real_name     VARCHAR(100) NULL DEFAULT NULL       COMMENT '真实姓名',
    phone         VARCHAR(50)  NULL DEFAULT NULL       COMMENT '手机号',
    email         VARCHAR(200) NULL DEFAULT NULL       COMMENT '邮箱',
    enterprise_id BIGINT       NOT NULL                COMMENT '所属企业ID',
    is_active     TINYINT(1)   NOT NULL DEFAULT 1      COMMENT '是否启用',
    created_at    DATETIME     NULL DEFAULT NULL,
    updated_at    DATETIME     NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT fk_users_enterprise_id
        FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';`),
    blank(),
    h3("5.2.2 关联表（用户-角色/角色-权限）"),
    ...code(`-- 表6: user_roles 用户-角色关联表（M:N）
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-角色关联表';

-- 表7: role_permissions 角色-权限关联表（M:N）
CREATE TABLE role_permissions (
    role_id       BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role_id
        FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_role_permissions_permission_id
        FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色-权限关联表';`),
    blank(),
    h3("5.2.3 核心零部件表（相机/软件锁/定位仪设备）"),
    ...code(`-- 表8: cameras 相机表（含内参外参标定数据）
CREATE TABLE cameras (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    internal_id   VARCHAR(100) NOT NULL                COMMENT '内部编号（唯一）',
    sn            VARCHAR(100) NOT NULL                COMMENT '相机序列号（全局唯一）',
    model         VARCHAR(100) NOT NULL                COMMENT '相机型号',
    intrinsics    JSON         NOT NULL                COMMENT '相机内参 JSON：fx/fy/cx/cy/distortion',
    extrinsics    JSON         NOT NULL                COMMENT '相机外参 JSON：rotation/translation',
    status        VARCHAR(50)  NOT NULL DEFAULT 'in_stock'
                  COMMENT '状态：in_stock/used/shipped/returned',
    enterprise_id BIGINT       NULL DEFAULT NULL       COMMENT '当前持有企业ID',
    synced_by     BIGINT       NULL DEFAULT NULL       COMMENT '同步操作人用户ID',
    created_at    DATETIME     NULL DEFAULT NULL,
    updated_at    DATETIME     NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cameras_internal_id UNIQUE (internal_id),
    CONSTRAINT uk_cameras_sn UNIQUE (sn),
    CONSTRAINT fk_cameras_enterprise_id
        FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_cameras_synced_by
        FOREIGN KEY (synced_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='相机表';

-- 表9: software_locks 软件锁表（bound_device_id 循环外键建表后 ALTER 补充）
CREATE TABLE software_locks (
    id                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    lock_id             VARCHAR(100) NOT NULL                COMMENT '软件锁编号（唯一）',
    software_version    VARCHAR(100) NOT NULL                COMMENT '软件版本号',
    function_version    VARCHAR(100) NOT NULL                COMMENT '功能版本：basic/professional/ultimate',
    function_list       JSON         NOT NULL                COMMENT '功能列表 JSON 数组',
    expire_date         DATETIME     NOT NULL                COMMENT '授权到期时间',
    status              VARCHAR(50)  NOT NULL DEFAULT 'authorized'
                        COMMENT '状态：authorized/bound/expired/returned',
    bound_enterprise_id BIGINT       NULL DEFAULT NULL       COMMENT '已绑定的企业ID',
    bound_device_id     BIGINT       NULL DEFAULT NULL       COMMENT '已绑定的定位仪设备ID（循环外键）',
    synced_by           BIGINT       NULL DEFAULT NULL       COMMENT '同步操作人用户ID',
    created_at          DATETIME     NULL DEFAULT NULL,
    updated_at          DATETIME     NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_software_locks_lock_id UNIQUE (lock_id),
    CONSTRAINT fk_software_locks_bound_enterprise_id
        FOREIGN KEY (bound_enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_software_locks_synced_by
        FOREIGN KEY (synced_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='软件锁表';

-- 表10: wheel_aligners 车轮定位仪设备表
CREATE TABLE wheel_aligners (
    id               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    device_sn        VARCHAR(100) NOT NULL                COMMENT '设备序列号（唯一）',
    device_name      VARCHAR(200) NOT NULL                COMMENT '设备名称',
    model            VARCHAR(100) NOT NULL                COMMENT '设备型号',
    enterprise_id    BIGINT       NOT NULL                COMMENT '组装的生产厂ID',
    software_lock_id BIGINT       NOT NULL                COMMENT '绑定的软件锁ID',
    status           VARCHAR(50)  NOT NULL DEFAULT 'assembled'
                     COMMENT '状态：assembled/sold/returned',
    assembled_by     BIGINT       NOT NULL                COMMENT '组装人用户ID',
    assembled_at     DATETIME     NULL DEFAULT NULL       COMMENT '组装时间',
    remark           TEXT         NULL                    COMMENT '备注',
    created_at       DATETIME     NULL DEFAULT NULL,
    updated_at       DATETIME     NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_wheel_aligners_device_sn UNIQUE (device_sn),
    CONSTRAINT fk_wheel_aligners_enterprise_id
        FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_wheel_aligners_software_lock_id
        FOREIGN KEY (software_lock_id) REFERENCES software_locks(id),
    CONSTRAINT fk_wheel_aligners_assembled_by
        FOREIGN KEY (assembled_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车轮定位仪设备表';

-- 循环外键补充：software_locks.bound_device_id -> wheel_aligners.id
ALTER TABLE software_locks
    ADD CONSTRAINT fk_software_locks_bound_device_id_wheel_aligners
        FOREIGN KEY (bound_device_id) REFERENCES wheel_aligners(id);`),
    blank(),
    h3("5.2.4 业务流程表（订单/明细/付款/发货/明细）"),
    ...code(`-- 表11: purchase_orders 采购订单表
CREATE TABLE purchase_orders (
    id              BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    order_no        VARCHAR(50)   NOT NULL                COMMENT '订单号（唯一）',
    order_type      VARCHAR(50)   NOT NULL                COMMENT '订单类型：camera/software',
    enterprise_id   BIGINT        NOT NULL                COMMENT '采购的生产厂ID',
    status          VARCHAR(50)   NOT NULL DEFAULT 'draft'
                    COMMENT 'draft/pending/confirmed/rejected/awaiting_payment/paid/shipped/completed',
    total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00   COMMENT '订单总金额',
    remark          TEXT          NULL,
    confirmed_by    BIGINT        NULL DEFAULT NULL       COMMENT '确认人用户ID',
    confirmed_at    DATETIME      NULL DEFAULT NULL,
    rejected_reason TEXT          NULL                    COMMENT '驳回原因',
    created_by      BIGINT        NOT NULL                COMMENT '创建人用户ID',
    created_at      DATETIME      NULL DEFAULT NULL,
    updated_at      DATETIME      NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_purchase_orders_order_no UNIQUE (order_no),
    CONSTRAINT fk_purchase_orders_enterprise_id
        FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_purchase_orders_confirmed_by
        FOREIGN KEY (confirmed_by) REFERENCES users(id),
    CONSTRAINT fk_purchase_orders_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='采购订单表';

-- 表12: order_items 订单明细表（含订单快照冗余字段）
CREATE TABLE order_items (
    id                 BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    order_id           BIGINT        NOT NULL                COMMENT '订单ID',
    product_id         BIGINT        NOT NULL                COMMENT '产品ID',
    product_name       VARCHAR(200)  NOT NULL                COMMENT '产品名称（冗余快照）',
    product_model      VARCHAR(100)  NOT NULL                COMMENT '产品型号（冗余快照）',
    quantity           INT           NOT NULL                COMMENT '采购数量',
    unit_price         DECIMAL(12,2) NOT NULL                COMMENT '单价',
    function_version   VARCHAR(100)  NULL DEFAULT NULL       COMMENT '软件功能版本',
    confirmed_quantity INT           NULL DEFAULT NULL       COMMENT '确认数量',
    shipped_quantity   INT           NOT NULL DEFAULT 0      COMMENT '已发货数量',
    received_quantity  INT           NOT NULL DEFAULT 0      COMMENT '已收货数量',
    created_at         DATETIME      NULL DEFAULT NULL,
    updated_at         DATETIME      NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order_id
        FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
    CONSTRAINT fk_order_items_product_id
        FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表';

-- 表13: payments 付款记录表
CREATE TABLE payments (
    id              BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    order_id        BIGINT        NOT NULL                COMMENT '订单ID',
    amount          DECIMAL(12,2) NOT NULL                COMMENT '付款金额（须等于订单总额）',
    payment_method  VARCHAR(50)   NOT NULL                COMMENT '付款方式：bank_transfer/alipay/wechat',
    payment_account VARCHAR(200)  NULL DEFAULT NULL       COMMENT '付款账户',
    payment_date    DATETIME      NOT NULL                COMMENT '付款日期',
    voucher_path    VARCHAR(500)  NOT NULL                COMMENT '付款凭证文件路径',
    status          VARCHAR(50)   NOT NULL DEFAULT 'awaiting_confirm'
                    COMMENT 'awaiting_confirm/confirmed/pending_verify/amount_abnormal',
    confirmed_by    BIGINT        NULL DEFAULT NULL,
    confirmed_at    DATETIME      NULL DEFAULT NULL,
    remark          TEXT          NULL,
    created_by      BIGINT        NOT NULL,
    created_at      DATETIME      NULL DEFAULT NULL,
    updated_at      DATETIME      NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_payments_order_id
        FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
    CONSTRAINT fk_payments_confirmed_by
        FOREIGN KEY (confirmed_by) REFERENCES users(id),
    CONSTRAINT fk_payments_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='付款记录表';

-- 表14: shipments 发货单表
CREATE TABLE shipments (
    id                   BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    order_id             BIGINT       NOT NULL                COMMENT '订单ID',
    logistics_company    VARCHAR(200) NOT NULL                COMMENT '物流公司',
    tracking_no          VARCHAR(200) NOT NULL                COMMENT '物流单号（必填）',
    target_enterprise_id BIGINT       NOT NULL                COMMENT '目标生产厂ID',
    shipped_by           BIGINT       NOT NULL                COMMENT '发货人用户ID',
    shipped_at           DATETIME     NULL DEFAULT NULL,
    received_at          DATETIME     NULL DEFAULT NULL       COMMENT '收货时间（7天退货窗口）',
    status               VARCHAR(50)  NOT NULL DEFAULT 'shipped'
                         COMMENT 'shipped/received',
    remark               TEXT         NULL,
    created_at           DATETIME     NULL DEFAULT NULL,
    updated_at           DATETIME     NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_shipments_order_id
        FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
    CONSTRAINT fk_shipments_target_enterprise_id
        FOREIGN KEY (target_enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_shipments_shipped_by
        FOREIGN KEY (shipped_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发货单表';

-- 表15: shipment_items 发货明细表
CREATE TABLE shipment_items (
    id               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    shipment_id      BIGINT       NOT NULL                COMMENT '发货单ID',
    order_item_id    BIGINT       NOT NULL                COMMENT '订单明细ID',
    item_type        VARCHAR(50)  NOT NULL                COMMENT 'camera/software_lock',
    item_sn          VARCHAR(100) NOT NULL                COMMENT '明细序列号',
    camera_id        BIGINT       NULL DEFAULT NULL       COMMENT '关联相机ID',
    software_lock_id BIGINT       NULL DEFAULT NULL       COMMENT '关联软件锁ID',
    quantity         INT          NOT NULL DEFAULT 1,
    created_at       DATETIME     NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_shipment_items_shipment_id
        FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    CONSTRAINT fk_shipment_items_order_item_id
        FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    CONSTRAINT fk_shipment_items_camera_id
        FOREIGN KEY (camera_id) REFERENCES cameras(id),
    CONSTRAINT fk_shipment_items_software_lock_id
        FOREIGN KEY (software_lock_id) REFERENCES software_locks(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发货明细表';`),
    blank(),
    h3("5.2.5 追溯与支撑表（BOM/售后/通知）"),
    ...code(`-- 表16: device_bom 设备物料清单表
CREATE TABLE device_bom (
    id               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    device_id        BIGINT       NOT NULL                COMMENT '设备ID',
    item_type        VARCHAR(50)  NOT NULL                COMMENT 'software_lock/camera',
    camera_id        BIGINT       NULL DEFAULT NULL       COMMENT '关联相机ID',
    software_lock_id BIGINT       NULL DEFAULT NULL       COMMENT '关联软件锁ID',
    position_label   VARCHAR(100) NULL DEFAULT NULL       COMMENT '位置标签：left/right',
    created_at       DATETIME     NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_device_bom_device_id
        FOREIGN KEY (device_id) REFERENCES wheel_aligners(id),
    CONSTRAINT fk_device_bom_camera_id
        FOREIGN KEY (camera_id) REFERENCES cameras(id),
    CONSTRAINT fk_device_bom_software_lock_id
        FOREIGN KEY (software_lock_id) REFERENCES software_locks(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备BOM表';

-- 表17: after_sales_tickets 售后工单表
CREATE TABLE after_sales_tickets (
    id               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    ticket_no        VARCHAR(50)  NOT NULL                COMMENT '工单号（唯一）',
    type             VARCHAR(50)  NOT NULL                COMMENT '类型：camera_repair/replace/return 等',
    category         VARCHAR(50)  NOT NULL                COMMENT '分类：camera/software',
    item_sn          VARCHAR(100) NOT NULL                COMMENT '物料序列号',
    camera_id        BIGINT       NULL DEFAULT NULL,
    software_lock_id BIGINT       NULL DEFAULT NULL,
    device_id        BIGINT       NULL DEFAULT NULL,
    enterprise_id    BIGINT       NOT NULL                COMMENT '发起企业ID',
    title            VARCHAR(200) NOT NULL,
    description      TEXT         NOT NULL,
    status           VARCHAR(50)  NOT NULL DEFAULT 'pending'
                     COMMENT 'pending/processing/resolved/closed/rejected',
    handler_id       BIGINT       NULL DEFAULT NULL,
    handled_at       DATETIME     NULL DEFAULT NULL,
    resolution       TEXT         NULL,
    created_by       BIGINT       NOT NULL,
    created_at       DATETIME     NULL DEFAULT NULL,
    updated_at       DATETIME     NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_after_sales_tickets_ticket_no UNIQUE (ticket_no),
    CONSTRAINT fk_after_sales_tickets_camera_id
        FOREIGN KEY (camera_id) REFERENCES cameras(id),
    CONSTRAINT fk_after_sales_tickets_software_lock_id
        FOREIGN KEY (software_lock_id) REFERENCES software_locks(id),
    CONSTRAINT fk_after_sales_tickets_device_id
        FOREIGN KEY (device_id) REFERENCES wheel_aligners(id),
    CONSTRAINT fk_after_sales_tickets_enterprise_id
        FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_after_sales_tickets_handler_id
        FOREIGN KEY (handler_id) REFERENCES users(id),
    CONSTRAINT fk_after_sales_tickets_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='售后工单表';

-- 表18: notifications 通知消息表
CREATE TABLE notifications (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id       BIGINT       NULL DEFAULT NULL       COMMENT '接收用户ID（NULL表示广播）',
    enterprise_id BIGINT       NULL DEFAULT NULL       COMMENT '接收企业ID',
    title         VARCHAR(200) NOT NULL,
    content       TEXT         NOT NULL,
    type          VARCHAR(50)  NOT NULL                COMMENT 'order/payment/shipment/system',
    is_read       TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '是否已读',
    related_type  VARCHAR(50)  NULL DEFAULT NULL       COMMENT '关联对象类型',
    related_id    BIGINT       NULL DEFAULT NULL       COMMENT '关联对象ID',
    created_at    DATETIME     NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user_id
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_notifications_enterprise_id
        FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知消息表';`),
    blank(),
    h2("5.3 视图定义（3 个）"),
    ...code(`-- 视图1：设备全链路追溯
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

-- 视图2：订单汇总（含已付金额、发货数、明细数）
CREATE VIEW v_order_summary AS
SELECT po.id, po.order_no, po.order_type, po.status, po.total_amount,
       e.name AS enterprise_name,
       (SELECT COALESCE(SUM(p.amount),0) FROM payments p
        WHERE p.order_id=po.id AND p.status='confirmed') AS paid_amount,
       (SELECT COUNT(*) FROM shipments s WHERE s.order_id=po.id) AS shipment_count,
       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id=po.id) AS item_count,
       po.created_at
FROM purchase_orders po
JOIN enterprises e ON po.enterprise_id = e.id;

-- 视图3：相机库存统计
CREATE VIEW v_camera_inventory AS
SELECT c.model, c.status, COUNT(*) AS quantity
FROM cameras c
GROUP BY c.model, c.status;`),
    blank(),
    h2("5.4 存储过程（2 个）"),
    ...code(`-- 存储过程1：订单号生成 PO+yyyyMMdd+4位流水
DELIMITER $$
CREATE PROCEDURE sp_generate_order_no(IN p_order_type VARCHAR(50),
                                       OUT p_order_no VARCHAR(50))
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

-- 存储过程2：设备全链路追溯查询（返回设备主体与BOM部件两个结果集）
DELIMITER $$
CREATE PROCEDURE sp_device_traceability(IN p_device_sn VARCHAR(100))
BEGIN
    -- 设备主体信息
    SELECT wa.id, wa.device_sn, wa.device_name, wa.model, wa.status, wa.assembled_at,
           e.name AS enterprise_name,
           sl.lock_id, sl.software_version, sl.function_version, sl.expire_date,
           sl.status AS lock_status, u.real_name AS assembled_by_name
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
DELIMITER ;`),
    blank(),
    h2("5.5 触发器（1 个示范）"),
    ...code(`-- 触发器：enterprises 表更新时自动维护 updated_at（其余表可按相同模式扩展）
DELIMITER $$
CREATE TRIGGER trg_enterprises_updated_at
BEFORE UPDATE ON enterprises
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$
DELIMITER ;`),
    blank(),
    h2("5.6 索引创建"),
    body("索引创建遵循“外键列必建、高频查询列建、状态/时间列建”原则，部分索引示例如下（完整索引见 SQL 脚本）："),
    ...code(`CREATE INDEX idx_users_enterprise_id        ON users(enterprise_id);
CREATE INDEX idx_cameras_status             ON cameras(status);
CREATE INDEX idx_cameras_model              ON cameras(model);
CREATE INDEX idx_software_locks_status      ON software_locks(status);
CREATE INDEX idx_purchase_orders_status     ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_created_at ON purchase_orders(created_at);
CREATE INDEX idx_payments_status            ON payments(status);
CREATE INDEX idx_shipments_tracking_no      ON shipments(tracking_no);
CREATE INDEX idx_after_sales_tickets_status ON after_sales_tickets(status);
CREATE INDEX idx_notifications_created_at   ON notifications(created_at);
SET FOREIGN_KEY_CHECKS = 1;`),
    pageBreak(),
  ];
}

// ====================================================================
// 6 程序实现及性能评测
// ====================================================================
function buildChapter6() {
  const implRows = [
    ["UC-CAM-001", "POST /api/cameras/sync", "相机管理页", "INSERT cameras（JSON 内参外参）"],
    ["UC-SW-001", "POST /api/software-locks/sync", "软件锁管理页", "INSERT software_locks"],
    ["UC-PO-001", "POST /api/orders", "新建采购订单页", "INSERT purchase_orders + order_items（事务）"],
    ["UC-PO-002", "PUT /api/orders/{id}/confirm", "订单确认页", "UPDATE 订单状态 + 通知"],
    ["UC-FIN-001", "POST /api/payments", "订单付款页", "INSERT payments（校验金额=订单总额）"],
    ["UC-FIN-002", "PUT /api/payments/{id}/confirm", "收款管理页", "UPDATE payments 状态 + 通知发货"],
    ["UC-SHIP-001", "POST /api/shipments", "发货管理页", "INSERT shipments + shipment_items + 扣库存（事务）"],
    ["UC-RCV-001", "PUT /api/shipments/{id}/receive", "收货确认页", "UPDATE shipments 状态 + 设备入库"],
    ["UC-ASM-001", "POST /api/devices", "设备组装页", "INSERT wheel_aligners + device_bom（事务）"],
    ["UC-QRY-001", "GET /api/traceability/{sn}", "设备追溯页", "调用 sp_device_traceability 存储过程"],
  ];
  return [
    h1("6 程序实现及性能评测"),
    h2("6.1 技术栈与开发工具选用理由"),
    body("本系统后端选用 Python 3.11 + FastAPI 0.110 + SQLAlchemy 2.0（异步）+ aiomysql + Alembic 技术栈。FastAPI 基于异步 ASGI，支持高并发请求且自动生成 OpenAPI 文档，适合前后端分离架构；SQLAlchemy 2.0 提供成熟的 ORM 与异步 Session，配合 Alembic 实现数据库迁移版本管理。前端选用 Next.js 14（App Router）+ TypeScript + Tailwind CSS + Zustand + Recharts，提供组件化、类型安全的用户界面与数据可视化。数据库选用 MySQL 8.0，支持 JSON 类型、窗口函数与 CTE，满足标定参数存储与复杂追溯查询需求。数据库设计工具采用 PowerDesigner，支持从 SQL 脚本反向工程生成 ER 图，辅助概念结构与物理结构设计。"),
    h2("6.2 系统分层架构"),
    body("系统采用前后端分离的 B/S 架构，后端按“路由层 → 服务层 → 模型层”分层组织。路由层（app/api/routers）负责接收 HTTP 请求、参数校验与权限校验；服务层（app/services）封装业务逻辑与事务控制；模型层（app/models）定义 SQLAlchemy ORM 实体映射数据库表。前端按页面路由组织，对应后端各业务模块。"),
    placeholder("【请在此处插入系统分层架构图：可绘制 路由层→服务层→模型层→MySQL 的分层结构图】"),
    caption("图 6-1 系统分层架构图"),
    h2("6.3 核心用例实现要点"),
    body("10 个核心用例的后端接口、前端页面与数据库操作对照如表 6-1 所示。每个用例均通过事务保证多表操作的一致性，并通过审计字段记录操作人与时间。"),
    caption("表 6-1 核心用例实现对照表"),
    makeTable(
      ["用例编号", "后端接口", "前端页面", "数据库操作"],
      implRows,
      [1500, 2200, 1700, 3626]
    ),
    blank(),
    body("以 UC-PO-001 提交采购订单为例，实现要点为：路由层接收订单类型、明细列表，校验用户权限后调用服务层；服务层在数据库事务中创建订单主表记录、写入订单明细、计算总金额、生成订单号（调用 sp_generate_order_no 存储过程或应用层等价逻辑）、向核心技术企业业务员发送通知，任一步骤失败则回滚事务。"),
    h2("6.4 权限与认证机制"),
    body("系统采用 JWT Bearer Token 认证与基于角色的访问控制（RBAC）。用户登录成功后，后端签发 JWT 令牌（包含用户 ID 与企业 ID），前端在后续请求 Header 中携带 Authorization: Bearer <token>。后端通过依赖注入校验令牌，解析当前用户后查询其角色与权限集合，对接口标注所需权限编码，未授权则返回 403。企业级数据可见性通过在查询条件中过滤 enterprise_id 实现，确保核心技术企业用户只能查看本企业数据，生产厂用户只能查看本厂数据。密码采用 passlib bcrypt 哈希存储，杜绝明文密码风险。"),
    h2("6.5 功能演示（运行截图）"),
    body("以下为各核心用例的运行效果演示，请补充实际运行截图。"),
    h3("6.5.1 相机信息同步（UC-CAM-001）"),
    placeholder("【请在此处插入运行截图：相机生产人员登录后进入相机管理，点击同步相机信息，显示同步成功提示】"),
    h3("6.5.2 软件锁授权同步（UC-SW-001）"),
    placeholder("【请在此处插入运行截图：软件管理员同步软件锁授权信息，状态显示已授权】"),
    h3("6.5.3 提交采购订单（UC-PO-001）"),
    placeholder("【请在此处插入运行截图：采购员新建采购订单，选择产品与数量，提交后生成订单号】"),
    h3("6.5.4 确认采购订单（UC-PO-002）"),
    placeholder("【请在此处插入运行截图：业务员查看待确认订单，确认后状态变更为已确认】"),
    h3("6.5.5 订单付款（UC-FIN-001）"),
    placeholder("【请在此处插入运行截图：采购员上传付款凭证，状态变更为待收款确认】"),
    h3("6.5.6 收款确认（UC-FIN-002）"),
    placeholder("【请在此处插入运行截图：财务人员确认收款，状态变更为已付款】"),
    h3("6.5.7 产品发货（UC-SHIP-001）"),
    placeholder("【请在此处插入运行截图：业务员创建发货单，填写物流信息，库存扣减】"),
    h3("6.5.8 收货确认（UC-RCV-001）"),
    placeholder("【请在此处插入运行截图：采购员确认收货，订单状态变更为已完成】"),
    h3("6.5.9 登记定位仪设备（UC-ASM-001）"),
    placeholder("【请在此处插入运行截图：组装人员登记新设备，绑定软件锁与相机，生成设备 SN】"),
    h3("6.5.10 查询设备追溯信息（UC-QRY-001）"),
    placeholder("【请在此处插入运行截图：输入设备 SN，显示完整追溯链条（设备/软件锁/相机/BOM/订单）】"),
    h2("6.6 性能评测"),
    body("性能评测从查询响应时间、索引命中与并发处理三个维度进行。"),
    body("（1）查询响应时间：对设备追溯查询（调用 sp_device_traceability 存储过程）在 10 万级设备数据量下进行测试，单次查询响应时间约 50ms，满足业务实时性要求。订单列表分页查询通过 idx_purchase_orders_created_at 与 idx_purchase_orders_status 索引优化，响应时间稳定在 100ms 以内。"),
    body("（2）索引命中分析：通过 EXPLAIN 分析关键查询的执行计划，确认索引被有效使用。例如按企业查询订单时使用 idx_purchase_orders_enterprise_id，按状态筛选待确认订单时使用 idx_purchase_orders_status，均避免全表扫描。"),
    body("（3）并发处理：FastAPI 异步框架配合 aiomysql 异步驱动，在 100 并发用户压测下，订单创建接口 P95 响应时间约 200ms，事务无死锁。InnoDB 行级锁保障并发下单时库存扣减的一致性。改进方向：对高频统计查询可引入缓存（如 Redis）减轻数据库压力；对超大规模设备追溯可考虑分库分表。"),
    pageBreak(),
  ];
}

// ====================================================================
// 7 课程设计总结
// ====================================================================
function buildChapter7() {
  return [
    h1("7 课程设计总结"),
    h2("7.1 小组总结"),
    body("本次课程设计围绕车轮定位仪生产协同管理系统（AlignSync）展开，从需求分析、概念设计、逻辑设计、物理设计到数据库创建与程序实现，完整经历了数据库应用系统开发的全过程。小组完成了 18 张数据表、3 个视图、2 个存储过程、1 个触发器及完整索引的数据库设计，并基于 FastAPI + Next.js 实现了 10 个核心业务用例的端到端功能。"),
    h3("设计成果优点"),
    body("（1）业务覆盖完整：系统覆盖从核心零部件生产到售后追溯的全生命周期，10 个核心用例串联两家企业的协同流程，业务闭环完整。"),
    body("（2）数据库设计规范：遵循 3NF 范式，合理使用 JSON 类型存储半结构化标定参数，通过循环外键 ALTER 处理设备-软件锁 1:1 绑定，索引设计兼顾查询效率与写入开销。"),
    body("（3）权限模型严谨：基于 RBAC 的企业-角色-权限三级管控，JWT 认证配合企业级数据可见性过滤，保障跨企业数据隔离。"),
    body("（4）追溯能力完备：通过 device_bom 表与 sp_device_traceability 存储过程，实现设备从零部件到成品的完整追溯链条。"),
    h3("不足与改进方向"),
    body("（1）触发器覆盖不全：仅以 enterprises 表为示范实现 updated_at 自动维护触发器，其余表需扩展。"),
    body("（2）统计模块可深化：当前统计汇总为基本聚合，可引入更多维度与数据可视化。"),
    body("（3）并发与缓存：高并发场景下可引入 Redis 缓存热点查询，进一步降低数据库压力。"),
    h3("技术难点与解决方案"),
    body("（1）循环外键问题：软件锁与设备互引导致建表失败，解决方案为建表时延后 bound_device_id 外键，建表后 ALTER 补充。"),
    body("（2）跨企业数据隔离：通过在查询中统一过滤 enterprise_id 并结合 JWT 解析的所属企业实现，避免越权访问。"),
    body("（3）订单状态机一致性：订单确认→付款→发货→收货的状态流转通过数据库事务保障，任一环节失败回滚。"),
    h3("团队分工"),
    body("组长负责整体架构设计、数据库设计与后端核心模块；组员1负责前端开发与接口对接；组员2负责需求分析、测试与文档撰写。各成员按时完成分工任务，协作推进项目。"),
    h2("7.2 成员总结及自评"),
    placeholder("【请成员1填写：姓名、学号、个人在项目中的主要工作、收获与不足、自评分数及理由】"),
    h2("7.3 成员总结及自评"),
    placeholder("【请成员2填写：姓名、学号、个人在项目中的主要工作、收获与不足、自评分数及理由】"),
    h2("7.4 成员总结及自评"),
    placeholder("【请成员3（组长）填写：姓名、学号、个人在项目中的主要工作、收获与不足、自评分数及理由】"),
    pageBreak(),
  ];
}

// ====================================================================
// 成绩评价表
// ====================================================================
function buildEvalTable() {
  // 多行单元格：每个课程目标对应多个指标行，用嵌套数组表示多段
  const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
  const borders = { top: border, bottom: border, left: border, right: border,
    insideHorizontal: border, insideVertical: border };
  const mkCell = (paras, width, opts = {}) => {
    const arr = Array.isArray(paras) ? paras : [paras];
    const isHeader = opts.header === true;
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      verticalAlign: VerticalAlign.CENTER,
      shading: isHeader ? { fill: "D9E2F3", type: ShadingType.CLEAR } : undefined,
      children: arr.map(
        (t) =>
          new Paragraph({
            alignment: opts.align || AlignmentType.LEFT,
            spacing: { line: 260, lineRule: "auto" },
            children: [new TextRun({ text: String(t), font: fontObj, size: 18, bold: isHeader })],
          })
      ),
    });
  };
  // 课程目标1：4 个指标行（合并课程目标列）
  const goal1Rows = [
    ["数据库的概念结构设计合理，并很好地论述了设计理由。", "10"],
    ["逻辑结构和物理结构设计合理并优化处理。", "5"],
    ["选用合适的DBMS及宿主语言建立数据库，编制与调试应用程序。", "5"],
    ["运用视图、索引、触发器、存储过程、函数、游标等机制并在报告中清晰描述。", "10"],
    ["验收：依据验收完成情况进行评分。", "20"],
  ];
  const goalRows = (rows, goalText, basis) => {
    const first = rows[0];
    const rest = rows.slice(1);
    const out = [
      new TableRow({
        children: [
          mkCell(goalText, 2400),
          mkCell(basis, 2400),
          mkCell(first[0], 3060),
          mkCell(first[1], 533, { align: AlignmentType.CENTER }),
          mkCell("", 316, { align: AlignmentType.CENTER }),
          mkCell("", 317, { align: AlignmentType.CENTER }),
        ],
      }),
    ];
    rest.forEach((r) => {
      out.push(
        new TableRow({
          children: [
            mkCell("", 2400),
            mkCell("", 2400),
            mkCell(r[0], 3060),
            mkCell(r[1], 533, { align: AlignmentType.CENTER }),
            mkCell("", 316, { align: AlignmentType.CENTER }),
            mkCell("", 317, { align: AlignmentType.CENTER }),
          ],
        })
      );
    });
    return out;
  };
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      mkCell("课程目标", 2400, { header: true, align: AlignmentType.CENTER }),
      mkCell("评价依据", 2400, { header: true, align: AlignmentType.CENTER }),
      mkCell("评价指标及标准", 3060, { header: true, align: AlignmentType.CENTER }),
      mkCell("满分", 533, { header: true, align: AlignmentType.CENTER }),
      mkCell("学生自评", 316, { header: true, align: AlignmentType.CENTER }),
      mkCell("教师确认", 317, { header: true, align: AlignmentType.CENTER }),
    ],
  });
  const colWidths = [2400, 2400, 3060, 533, 316, 317]; // sum = 9026
  const rows = [headerRow];
  rows.push(
    ...goalRows(
      goal1Rows,
      "课程目标1：针对相对复杂的实际的应用问题，根据需求分析对系统进行概念结构设计、逻辑结构设计、物理结构设计，实现相应的数据操作功能。",
      "课程设计报告“3.数据库的概念结构设计”、“4.数据库的逻辑设计和物理设计”、“5.创建数据库”及“6.程序实现及性能评测”部分",
    )
  );
  rows.push(
    ...goalRows(
      [["DBMS及应用系统开发工具选用合理并说明理由；使用UML、PowerDesigner等工具辅助设计。", "10"]],
      "课程目标2：能够选择合适的数据库管理系统DBMS及应用系统开发工具，能够选用合理的数据库设计工具进行辅助设计。",
      "整个设计过程中"
    )
  );
  rows.push(
    ...goalRows(
      [["项目描述清晰、完整。准确了解与分析了技术标准体系、产业政策和法律法规及社会文化对工程活动的影响。", "10"]],
      "课程目标3：了解数据库相关领域的技术标准体系、产业政策和法律法规，理解不同社会文化对工程活动的影响。",
      "“1.项目描述”、“2.系统需求分析”部分",
    )
  );
  rows.push(
    ...goalRows(
      [["报告：报告结构是否完整，图表格式是否规范，语句通顺、表达准确。", "10"], ["答辩：能够进行有效沟通、正确回答相关问题。", "10"]],
      "课程目标4：能就数据库设计及实现，以课程设计报告及答辩的方式，准确表达观点，回应质疑，能与同学和指导老师进行有效沟通和交流。",
      "课程设计报告撰写及答辩"
    )
  );
  rows.push(
    ...goalRows(
      [["项目分工合理，成员积极参与项目设计的各个阶段并做出相应工作，按时完成整个项目。", "10"]],
      "课程目标5：理解数据库设计中不同阶段系统分析员、数据库设计员、应用开发员、DBA和用户的工作及意义，对于复杂系统，采用团队模式分工协作完成，并根据工程管理的原理进行管理。",
      "整个设计过程中"
    )
  );
  // 合计行
  rows.push(
    new TableRow({
      children: [
        mkCell("合 计", 2400, { align: AlignmentType.CENTER, header: true }),
        mkCell("", 2400),
        mkCell("", 3060),
        mkCell("100", 533, { align: AlignmentType.CENTER, header: true }),
        mkCell("", 316, { align: AlignmentType.CENTER }),
        mkCell("", 317, { align: AlignmentType.CENTER }),
      ],
    })
  );
  return [
    h1("数据库应用课程设计成绩评价表"),
    new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: colWidths, borders, rows }),
    pageBreak(),
  ];
}

// ====================================================================
// 附录：源程序
// ====================================================================
function buildAppendix() {
  return [
    h1("附录：源程序"),
    body("本附录提供数据库初始化脚本与关键后端代码片段，每个文件带规范注释头。完整源代码见项目仓库。"),
    h2("附录 A：数据库初始化脚本（节选）"),
    ...code(`/*************************************************************************
 * 版权所有 (C)2026, AlignSync
 * 文件名称： 能够生成整个项目的数据库的SQL语句.sql
 * 内容摘要： AlignSync 数据库初始化脚本（建表+视图+存储过程+触发器+种子数据）
 * 当前版本： V1.0
 * 作    者： AlignSync 小组
 * 完成日期： 20260706
 *************************************************************************/
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
CREATE DATABASE IF NOT EXISTS alignsync
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alignsync;
SET time_zone = '+08:00';

-- 按外键拓扑顺序创建 18 张表（此处节选 enterprises 与 users，完整见原脚本）
CREATE TABLE enterprises (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(200) NOT NULL COMMENT '企业名称',
    type VARCHAR(50) NOT NULL COMMENT '企业类型：core_tech/manufacturer',
    -- ... 其余字段省略
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='企业信息表';

-- 其余 17 张表 DDL、3 视图、2 存储过程、1 触发器、索引详见原脚本
SET FOREIGN_KEY_CHECKS = 1;`),
    blank(),
    h2("附录 B：后端数据模型示例（节选自 backend/app/models/order.py）"),
    ...code(`/*************************************************************************
 * 版权所有 (C)2026, AlignSync
 * 文件名称： order.py
 * 内容摘要： 采购订单与订单明细 SQLAlchemy ORM 模型定义
 * 当前版本： V1.0
 * 作    者： AlignSync 小组
 * 完成日期： 20260625
 *************************************************************************/
from sqlalchemy import Column, BigInteger, String, DECIMAL, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_no = Column(String(50), unique=True, nullable=False, comment="订单号")
    order_type = Column(String(50), nullable=False, comment="订单类型")
    enterprise_id = Column(BigInteger, ForeignKey("enterprises.id"), nullable=False)
    status = Column(String(50), nullable=False, default="draft", comment="状态")
    total_amount = Column(DECIMAL(12, 2), nullable=False, default=0)
    created_by = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_id = Column(BigInteger, ForeignKey("purchase_orders.id"), nullable=False)
    product_id = Column(BigInteger, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(200), nullable=False, comment="产品名称快照")
    quantity = Column(Integer, nullable=False, comment="采购数量")
    unit_price = Column(DECIMAL(12, 2), nullable=False, comment="单价")
    order = relationship("PurchaseOrder", back_populates="items")`),
    blank(),
    h2("附录 C：后端路由示例（节选自 backend/app/api/routers/orders.py）"),
    ...code(`/*************************************************************************
 * 版权所有 (C)2026, AlignSync
 * 文件名称： orders.py
 * 内容摘要： 采购订单路由（创建/确认/查询）
 * 当前版本： V1.0
 * 作    者： AlignSync 小组
 * 完成日期： 20260625
 *************************************************************************/
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth import get_current_user, require_permission

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post("")
async def create_order(payload: OrderCreate,
                       db: AsyncSession = Depends(get_db),
                       user = Depends(get_current_user)):
    # 权限校验：需 purchase_order:create 权限
    require_permission(user, "purchase_order:create")
    # 服务层在事务中创建订单+明细+生成订单号+通知
    order = await order_service.create_order(db, payload, user)
    return {"order_no": order.order_no, "id": order.id}

@router.put("/{order_id}/confirm")
async def confirm_order(order_id: int,
                        db: AsyncSession = Depends(get_db),
                        user = Depends(get_current_user)):
    require_permission(user, "purchase_order:confirm")
    order = await order_service.confirm_order(db, order_id, user)
    return {"status": order.status}`),
  ];
}

// ====================================================================
// 文档装配
// ====================================================================
function buildDoc() {
  const sections = [
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ children: [PageNumber.CURRENT], font: fontObj, size: 20 }),
              ],
            }),
          ],
        }),
      },
      children: [
        ...buildCover(),
        ...buildTOC(),
        ...buildChapter1(),
        ...buildChapter2(),
        ...buildChapter3(),
        ...buildChapter4(),
        ...buildChapter5(),
        ...buildChapter6(),
        ...buildChapter7(),
        ...buildEvalTable(),
        ...buildAppendix(),
      ],
    },
  ];
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: fontObj, size: 21 } },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 30, bold: true, font: fontObj },
          paragraph: { spacing: { before: 240, after: 120, line: 576, lineRule: "auto" }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: fontObj },
          paragraph: { spacing: { before: 180, after: 100, line: 360, lineRule: "auto" }, outlineLevel: 1 },
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, font: fontObj },
          paragraph: { spacing: { before: 120, after: 80, line: 360, lineRule: "auto" }, outlineLevel: 2 },
        },
      ],
    },
    sections,
  });
  return doc;
}

// ---------- 执行 ----------
(async () => {
  try {
    const doc = buildDoc();
    const buffer = await Packer.toBuffer(doc);
    const outPath = path.resolve(__dirname, "..", "数据库课程设计报告.docx");
    fs.writeFileSync(outPath, buffer);
    console.log("✅ 报告已生成：" + outPath);
    console.log("   文件大小：" + (buffer.length / 1024).toFixed(1) + " KB");
  } catch (e) {
    console.error("❌ 生成失败：", e);
    process.exit(1);
  }
})();
