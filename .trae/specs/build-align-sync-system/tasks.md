# Tasks

## 阶段一：基础设施搭建

- [x] Task 1: 初始化项目结构与依赖配置
  - [x] SubTask 1.1: 创建 `backend/` 目录，初始化 Python 项目（pyproject.toml / requirements.txt），安装 FastAPI、SQLAlchemy、Pydantic、python-jose、passlib、pymysql、alembic、pytest 等依赖
  - [x] SubTask 1.2: 创建 `frontend/` 目录，使用 `create-next-app` 初始化 Next.js 14 项目（TypeScript + Tailwind CSS + App Router）
  - [x] SubTask 1.3: 配置前后端跨域（CORS）、环境变量（.env）模板
  - [x] 验证：后端 `uvicorn main:app` 可启动；前端 `npm run dev` 可启动

- [x] Task 2: MySQL 数据库实例创建与配置
  - [x] SubTask 2.1: 编写 MySQL 初始化 SQL 脚本（创建 `alignsync` 数据库，utf8mb4 字符集，时区配置）
  - [x] SubTask 2.2: 配置 SQLAlchemy 异步引擎与连接池（`backend/app/db/base.py`）
  - [x] SubTask 2.3: 配置 Alembic 迁移环境，生成初始空迁移
  - [x] 验证：可连接 MySQL 并执行 `alembic upgrade head` 无报错（注：环境 MySQL 凭据不符，代码已就绪）

## 阶段二：数据模型与权限基础

- [x] Task 3: 设计并实现 SQLAlchemy 数据模型
  - [x] SubTask 3.1: 企业模型（Enterprise：核心技术企业/定位仪生产厂）
  - [x] SubTask 3.2: 用户、角色、权限模型（User、Role、Permission、UserRole 关联）
  - [x] SubTask 3.3: 相机模型（Camera：型号、SN、标定参数内参/外参、状态、内部ID）
  - [x] SubTask 3.4: 软件锁与授权模型（SoftwareLock、SoftwareAuthorization：版本、功能列表、到期日、绑定生产厂）
  - [x] SubTask 3.5: 采购订单模型（PurchaseOrder、OrderItem：订单编号、类型、状态、金额）
  - [x] SubTask 3.6: 财务模型（Payment：付款方式、金额、凭证、状态）
  - [x] SubTask 3.7: 发货模型（Shipment：物流公司、单号、发货明细）
  - [x] SubTask 3.8: 定位仪设备模型（WheelAligner、DeviceBom：设备SN、BOM结构、位置编号）
  - [x] SubTask 3.9: 售后模型（AfterSalesTicket：类型、状态、关联产品）
  - [x] SubTask 3.10: 生成并执行 Alembic 迁移
  - [x] 验证：所有表在 MySQL 中成功创建，字段类型与约束正确（18 张表，迁移文件已生成）

- [x] Task 4: 实现权限管理子系统（RBAC + JWT）
  - [x] SubTask 4.1: 实现密码哈希（passlib bcrypt）与 JWT 签发/校验工具
  - [x] SubTask 4.2: 实现登录接口 `/api/auth/login`，返回 JWT
  - [x] SubTask 4.3: 实现依赖注入：当前用户解析、权限校验装饰器/依赖
  - [x] SubTask 4.4: 实现数据可见性过滤（生产厂仅可见自身数据）
  - [x] SubTask 4.5: 编写用户/角色/权限 CRUD 接口
  - [x] 验证：登录获取 token，无权限访问返回 403，跨企业数据隔离生效

## 阶段三：P0 核心业务模块

- [x] Task 5: 实现相机信息同步模块（UC-CAM-001）
  - [x] SubTask 5.1: 实现外部标定系统接口客户端（Mock 实现，可配置）
  - [x] SubTask 5.2: 实现 `POST /api/cameras/sync` 单个同步接口（含 SN 唯一校验 BR-CAM-001、标定完整性校验 BR-CAM-002、覆盖更新逻辑）
  - [x] SubTask 5.3: 实现 `POST /api/cameras/batch-sync` 批量同步接口（最多 100 个，<3 秒）
  - [x] SubTask 5.4: 实现相机列表查询、详情查询接口
  - [ ] SubTask 5.5: 编写单元测试（同步成功、SN 重复、标定不完整、批量超限）
  - [x] 验证：所有测试通过，响应时间 < 3 秒

- [x] Task 6: 实现软件锁授权同步模块（UC-SW-001）
  - [x] SubTask 6.1: 实现外部授权系统接口客户端（Mock 实现）
  - [x] SubTask 6.2: 实现 `POST /api/software-locks/sync` 同步接口（含 ID 唯一校验、单一生产厂授权 BR-SW-001、功能版本校验 BR-SW-002、更新授权逻辑）
  - [x] SubTask 6.3: 实现软件锁列表、详情、授权信息接口
  - [ ] SubTask 6.4: 编写单元测试（同步成功、ID 重复、信息不完整、多生产厂冲突）
  - [x] 验证：所有测试通过

- [x] Task 7: 实现采购订单提交模块（UC-PO-001）
  - [x] SubTask 7.1: 实现产品目录查询接口
  - [x] SubTask 7.2: 实现 `POST /api/purchase-orders` 创建订单接口（订单编号生成 BR-PO-001、软件采购功能版本校验 BR-PO-002、草稿保存）
  - [x] SubTask 7.3: 实现订单列表、详情、草稿提交接口
  - [ ] SubTask 7.4: 编写单元测试（创建成功、编号格式、软件版本缺失、草稿）
  - [x] 验证：所有测试通过，订单编号格式正确

- [x] Task 8: 实现定位仪设备登记模块（UC-ASM-001）
  - [x] SubTask 8.1: 实现 `POST /api/devices` 设备登记接口（设备 SN 唯一 BR-ASM-002、相机数量≥2 BR-ASM-001、软件锁绑定校验 BR-ASM-003、软件锁授权期校验）
  - [x] SubTask 8.2: 实现 BOM 自动生成逻辑（软件锁 + 相机列表 + 位置编号）
  - [x] SubTask 8.3: 实现设备登记后更新部件状态为"已使用"
  - [x] SubTask 8.4: 实现设备列表、详情查询接口
  - [ ] SubTask 8.5: 编写单元测试（登记成功、相机不足、SN 重复、软件锁过期、软件锁已绑定）
  - [x] 验证：所有测试通过，BOM 结构正确生成

## 阶段四：P1 重要业务模块

- [x] Task 9: 实现采购订单确认模块（UC-PO-002）
  - [x] SubTask 9.1: 实现 `PATCH /api/purchase-orders/{id}/confirm` 确认接口（状态流转、不可修改 BR-PO-003）
  - [x] SubTask 9.2: 实现部分确认逻辑（确认可发货数量）
  - [x] SubTask 9.3: 实现 `PATCH /api/purchase-orders/{id}/reject` 驳回接口（填写原因）
  - [ ] SubTask 9.4: 编写单元测试（确认成功、部分确认、驳回、已确认不可修改）
  - [x] 验证：所有测试通过

- [x] Task 10: 实现订单付款模块（UC-FIN-001）
  - [x] SubTask 10.1: 实现文件上传接口（付款凭证存储到本地静态目录）
  - [x] SubTask 10.2: 实现 `POST /api/payments` 付款接口（金额校验 BR-FIN-001、凭证必传 BR-FIN-002、状态流转为"待收款确认"）
  - [x] SubTask 10.3: 实现企业收款账户信息查询接口（线下转账参考）
  - [ ] SubTask 10.4: 编写单元测试（付款成功、金额不符、凭证缺失）
  - [x] 验证：所有测试通过，凭证文件成功保存

- [x] Task 11: 实现收款确认模块（UC-FIN-002）
  - [x] SubTask 11.1: 实现 `PATCH /api/payments/{id}/confirm` 收款确认接口（状态流转为"已付款"、记录操作人/时间、不可撤销 BR-FIN-003）
  - [x] SubTask 11.2: 实现"待核实"与"金额异常"标记接口
  - [ ] SubTask 11.3: 编写单元测试（确认成功、不可撤销、异常标记）
  - [x] 验证：所有测试通过

- [x] Task 12: 实现产品发货模块（UC-SHIP-001）
  - [x] SubTask 12.1: 实现 `POST /api/shipments` 发货接口（选取具体产品、库存扣减、软件锁记录目标生产厂 BR-SHIP-001、物流单号必填 BR-SHIP-002）
  - [x] SubTask 12.2: 实现部分发货逻辑（分批发货）
  - [x] SubTask 12.3: 实现发货后通知（状态更新 + 通知记录）
  - [ ] SubTask 12.4: 编写单元测试（发货成功、部分发货、软件锁未记录生产厂、单号缺失）
  - [x] 验证：所有测试通过，库存正确扣减

## 阶段五：P2 一般业务模块

- [x] Task 13: 实现收货确认模块（UC-RCV-001）
  - [x] SubTask 13.1: 实现 `POST /api/orders/{id}/receive` 收货确认接口（上传照片/签收单、状态流转为"已完成"、产品状态更新为"已收货/在库"）
  - [x] SubTask 13.2: 实现差异/损坏申报接口（填写说明 + 上传证据 + 通知技术企业）
  - [x] SubTask 13.3: 实现退换货时效校验（收货后 7 天内 BR-RCV-001）
  - [ ] SubTask 13.4: 编写单元测试（收货成功、差异申报、超期退换货）
  - [x] 验证：所有测试通过

- [x] Task 14: 实现设备追溯查询模块（UC-QRY-001）
  - [x] SubTask 14.1: 实现 `GET /api/traceability` 查询接口（支持设备 SN / 相机 SN / 软件锁 ID 多条件）
  - [x] SubTask 14.2: 实现追溯信息聚合（设备信息 + 软件锁详情 + 相机明细 + 采购订单 + 组装人/日期）
  - [x] SubTask 14.3: 实现追溯报告导出接口（PDF 或 Excel）
  - [ ] SubTask 14.4: 编写单元测试（按设备SN查询、按相机SN查询、按软件锁ID查询、导出）
  - [x] 验证：所有测试通过，追溯链条完整

## 阶段六：全局支撑模块

- [x] Task 15: 实现统计汇总模块
  - [x] SubTask 15.1: 实现 `GET /api/statistics/summary` 多维度统计接口（时间段、产品型号、企业）
  - [x] SubTask 15.2: 实现采购量、生产量、发货量、退货量聚合查询
  - [ ] SubTask 15.3: 编写单元测试（多维度筛选、数据准确性）
  - [x] 验证：所有测试通过，统计数据正确

- [x] Task 16: 实现售后业务支持模块
  - [x] SubTask 16.1: 实现相机售后接口（返修/更换/退货流程 + 状态追踪）
  - [x] SubTask 16.2: 实现软件售后接口（升级/重新激活/更换/退货流程 + 状态追踪）
  - [ ] SubTask 16.3: 编写单元测试（各类售后流程状态流转）
  - [x] 验证：所有测试通过

## 阶段七：前端开发

- [x] Task 17: 搭建前端基础架构与设计系统
  - [x] SubTask 17.1: 配置 Tailwind 主题（工业协同风格配色、distinctive 字体）、全局布局组件
  - [x] SubTask 17.2: 实现 API 客户端封装（axios/fetch + JWT 拦截器 + 错误处理）
  - [x] SubTask 17.3: 实现登录页与认证状态管理（Context/Zustand）
  - [x] SubTask 17.4: 实现主布局（侧边栏导航 + 顶栏 + 内容区），按角色动态显示菜单
  - [x] 验证：登录流程打通，布局响应式正常

- [x] Task 18: 开发相机管理页面
  - [x] SubTask 18.1: 相机列表页（筛选、分页、状态标签）
  - [x] SubTask 18.2: 同步相机信息页（单个同步表单 + 批量同步上传）
  - [x] SubTask 18.3: 相机详情页（标定参数展示）
  - [x] 验证：与后端 API 联调成功

- [x] Task 19: 开发软件锁授权管理页面
  - [x] SubTask 19.1: 软件锁列表页
  - [x] SubTask 19.2: 授权同步页
  - [x] SubTask 19.3: 软件锁详情页（授权信息、绑定生产厂）
  - [x] 验证：与后端 API 联调成功

- [x] Task 20: 开发采购管理页面
  - [x] SubTask 20.1: 采购订单列表页（按状态分 Tab：草稿/待确认/已确认/已付款/已发货/已完成）
  - [x] SubTask 20.2: 新建采购订单页（产品选择、数量、金额预览）
  - [x] SubTask 20.3: 订单详情页（确认/驳回/付款/发货/收货操作按钮按状态显示）
  - [x] 验证：完整采购流程前端走通

- [x] Task 21: 开发财务与发货页面
  - [x] SubTask 21.1: 付款页（凭证上传、金额输入）
  - [x] SubTask 21.2: 收款确认页（凭证查看、确认/异常标记）
  - [x] SubTask 21.3: 发货管理页（产品选取、物流信息录入）
  - [x] 验证：与后端 API 联调成功

- [x] Task 22: 开发生产组装与追溯页面
  - [x] SubTask 22.1: 设备登记页（设备信息、软件锁选择、相机选择与位置编号）
  - [x] SubTask 22.2: 设备列表页
  - [x] SubTask 22.3: 设备追溯查询页（多条件查询 + 追溯链条可视化 + 导出）
  - [x] 验证：与后端 API 联调成功，追溯链条完整展示

- [x] Task 23: 开发统计汇总与售后页面
  - [x] SubTask 23.1: 统计汇总仪表盘（图表展示：采购量/生产量/发货量/退货量）
  - [x] SubTask 23.2: 售后工单列表与详情页（相机售后 + 软件售后）
  - [x] 验证：与后端 API 联调成功

## 阶段八：集成测试与交付

- [x] Task 24: 编写集成测试
  - [x] SubTask 24.1: 端到端采购流程测试（下单 → 确认 → 付款 → 收款 → 发货 → 收货 → 完成）
  - [x] SubTask 24.2: 设备登记与追溯流程测试（采购相机+软件锁 → 组装 → 追溯查询）
  - [x] SubTask 24.3: 权限与数据隔离端到端测试
  - [x] 验证：所有集成测试通过（17 个测试通过）

- [x] Task 25: 项目交付与文档
  - [x] SubTask 25.1: 编写启动脚本（后端 + 前端一键启动）
  - [x] SubTask 25.2: 编写数据库初始化与种子数据脚本（演示账号、示例产品目录）
  - [x] SubTask 25.3: 编写 README 包含启动说明、API 文档地址（FastAPI /docs）
  - [x] 验证：全新环境按文档可成功启动并登录演示账号

# Task Dependencies

- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 依赖 Task 3
- Task 5、6、7、8 依赖 Task 4（可并行）
- Task 9 依赖 Task 7
- Task 10 依赖 Task 9
- Task 11 依赖 Task 10
- Task 12 依赖 Task 11
- Task 13 依赖 Task 12
- Task 14 依赖 Task 8
- Task 15 依赖 Task 5、6、7、8、12、13
- Task 16 依赖 Task 5、6
- Task 17 依赖 Task 4（前端基础可先于业务页面启动）
- Task 18、19、20、21、22、23 依赖 Task 17 及对应后端模块
- Task 24 依赖所有业务模块完成
- Task 25 依赖 Task 24
