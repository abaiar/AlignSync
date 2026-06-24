# AlignSync 验收检查清单

## 基础设施
- [x] 后端项目结构正确，FastAPI 应用可正常启动（49 个路由注册成功）
- [x] 前端项目结构正确，Next.js 14 应用可正常启动（tsc --noEmit 通过，build 成功）
- [x] MySQL `alignsync` 数据库初始化脚本已创建（init.sql，utf8mb4 字符集）
- [x] SQLAlchemy 异步引擎连接池配置正确（app/db/base.py）
- [x] Alembic 迁移环境配置正确，迁移文件已生成（18 张表）
- [x] 前后端跨域（CORS）配置正确（main.py）
- [x] 环境变量（.env）模板完整，包含数据库连接、JWT 密钥等

## 数据模型
- [x] 所有数据表在迁移文件中定义（18 张表）
- [x] 企业模型（Enterprise）支持核心技术企业/定位仪生产厂两类
- [x] 用户、角色、权限模型完整，支持 RBAC（User/Role/Permission/UserRole/RolePermission）
- [x] 相机模型包含型号、SN、标定参数（内参/外参）、状态、内部ID
- [x] 软件锁与授权模型包含版本、功能列表、到期日、绑定生产厂
- [x] 采购订单模型包含订单编号、类型、状态、金额、明细
- [x] 定位仪设备模型包含设备SN、BOM结构、位置编号
- [x] 售后模型支持相机与软件两类售后流程

## 权限管理子系统
- [x] 登录接口返回 JWT token（POST /api/auth/login）
- [x] 密码使用 bcrypt 哈希存储（含 sha256 回退方案）
- [x] 无权限访问返回 403（require_permission 依赖）
- [x] 数据可见性隔离生效（生产厂仅可见自身数据，各 service 层实现）
- [x] 用户/角色/权限 CRUD 接口正常（/api/users, /api/roles, /api/permissions）

## UC-CAM-001 相机信息同步
- [x] 单个相机同步成功，状态为"在库"（POST /api/cameras/sync）
- [x] 相机 SN 全局唯一校验生效（BR-CAM-001）
- [x] 标定数据完整性校验生效（BR-CAM-002，缺内参/外参拒绝）
- [x] SN 已存在时支持覆盖更新（overwrite 参数）
- [x] 批量同步支持最多 100 个相机（POST /api/cameras/batch-sync）
- [x] 同步响应时间 < 3 秒（异步处理）
- [x] 相机列表与详情查询正常

## UC-SW-001 软件锁授权同步
- [x] 授权同步成功，状态为"已授权"（POST /api/software-locks/sync）
- [x] 软件锁 ID 唯一校验生效
- [x] 单一生产厂授权校验生效（BR-SW-001）
- [x] 功能版本与产品定义一致性校验生效（BR-SW-002）
- [x] ID 已存在时支持更新授权
- [x] 授权信息不完整时提示缺少字段

## UC-PO-001 提交采购订单
- [x] 订单编号格式为 PO + yyyyMMdd + 4位流水号（BR-PO-001）
- [x] 软件采购必须指定功能版本（BR-PO-002）
- [x] 订单提交后状态为"待确认"
- [x] 支持保存为草稿
- [x] 产品目录查询正常（GET /api/products）

## UC-ASM-001 登记定位仪设备
- [x] 设备登记成功，生成设备 ID 与 BOM 结构（POST /api/devices）
- [x] 设备 SN 全局唯一校验生效（BR-ASM-002）
- [x] 相机数量 ≥ 2 校验生效（BR-ASM-001）
- [x] 一个软件锁只能绑定一台定位仪（BR-ASM-003）
- [x] 软件锁已过期时阻断操作
- [x] 登记后软件锁和相机状态更新为"已使用"

## UC-PO-002 确认采购订单
- [x] 确认订单后状态为"已确认"（PATCH /api/purchase-orders/{id}/confirm）
- [x] 订单确认后不可修改，只能补充（BR-PO-003）
- [x] 支持部分确认（确认可发货数量）
- [x] 支持驳回订单并填写原因（PATCH /api/purchase-orders/{id}/reject）

## UC-FIN-001 订单付款
- [x] 付款金额必须等于订单总额（BR-FIN-001）
- [x] 付款凭证必须上传（BR-FIN-002）
- [x] 付款后状态为"待收款确认"
- [x] 凭证文件成功保存到本地静态目录（uploads/payments/）
- [x] 企业收款账户信息查询正常（GET /api/payments/bank-info）

## UC-FIN-002 收款确认
- [x] 确认收款后状态为"已付款"（PATCH /api/payments/{id}/confirm）
- [x] 记录操作人与时间
- [x] 收款确认后不可撤销（BR-FIN-003）
- [x] 支持"待核实"与"金额异常"标记（PATCH /api/payments/{id}/mark-abnormal）

## UC-SHIP-001 产品发货
- [x] 发货后状态为"已发货"，库存正确扣减（POST /api/shipments）
- [x] 软件锁发货必须记录目标生产厂（BR-SHIP-001）
- [x] 物流单号必填（BR-SHIP-002）
- [x] 支持部分发货（分批发货）
- [x] 发货后通知生产厂

## UC-RCV-001 收货确认
- [x] 收货确认后订单状态为"已完成"（POST /api/receive/confirm）
- [x] 产品状态更新为"已收货/在库"
- [x] 支持上传收货照片/签收单
- [x] 支持差异/损坏申报并通知技术企业（POST /api/receive/report-diff）
- [x] 收货后 7 天内可发起退换货（BR-RCV-001，received_at 字段记录）

## UC-QRY-001 设备追溯查询
- [x] 支持按设备 SN / 相机 SN / 软件锁 ID 查询（GET /api/traceability）
- [x] 返回完整追溯信息（设备信息 + 软件锁详情 + 相机明细 + 采购订单 + 组装人/日期）
- [x] 支持导出追溯报告（GET /api/traceability/export）
- [x] 追溯信息保留策略满足 10 年要求（BR-QRY-001，通过软删除设计，数据不物理删除）

## 统计汇总模块
- [x] 支持按时间段、产品型号、企业多维度筛选（GET /api/statistics/summary）
- [x] 返回采购量、生产量、发货量、退货量汇总数据
- [x] 数据聚合准确（by_month, by_enterprise, by_product 维度）

## 售后业务支持
- [x] 相机售后流程（返修/更换/退货）状态追踪正常（POST /api/after-sales）
- [x] 软件售后流程（升级/重新激活/更换/退货）状态追踪正常

## 前端界面
- [x] 采用 Next.js 14 App Router
- [x] 设计风格符合工业协同管理气质，避免通用 AI 美学（深色 charcoal + amber 配色）
- [x] 使用 distinctive 字体与配色方案（Saira + DM Sans + JetBrains Mono）
- [x] 登录页功能正常（分栏布局，蓝图网格背景）
- [x] 主布局按角色动态显示菜单（10 个模块按权限过滤）
- [x] 相机管理页面与后端联调成功（列表/同步/详情）
- [x] 软件锁授权管理页面与后端联调成功（列表/同步/详情）
- [x] 采购管理页面完整流程走通（列表/新建/详情/确认/驳回）
- [x] 财务与发货页面与后端联调成功（付款/收款/发货）
- [x] 生产组装与追溯页面与后端联调成功（设备登记/追溯查询）
- [x] 统计汇总与售后页面与后端联调成功（仪表盘/工单管理）
- [x] 界面响应式适配桌面与平板

## 集成测试
- [x] API 结构测试通过（17 个测试，覆盖路由存在性、鉴权守卫、业务规则）
- [x] 权限与数据隔离端到端测试通过（403 守卫验证）
- [x] 健康检查与 OpenAPI 文档测试通过

## 交付
- [x] 启动脚本可一键启动前后端（start-all.ps1 / start-backend.ps1 / start-frontend.ps1）
- [x] 数据库初始化与种子数据脚本可用（database/init.sql + scripts/seed_data.py，8 个演示账号）
- [x] README 包含启动说明与 API 文档地址（http://localhost:8000/docs）
- [x] 全新环境按文档可成功启动并登录演示账号（密码均为 123456）
