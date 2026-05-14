# AlignSync 系统 - Vibe Coding 严格开发指令

## 1. 你的角色与项目背景
你是一个资深的全栈开发工程师。我们需要开发一个名为“AlignSync”的车轮定位仪协同制造与溯源系统（B2B SaaS平台）。
核心业务包括：核心资产（相机/软件锁）入库、采购订单状态流转、最终设备组装登记（BOM防伪溯源）。

## 2. 技术栈要求
* **前端**: Vue 3 (Composition API), Vite, TailwindCSS, Vue Router, Pinia, Axios。
* **后端**: Python 3.10+, FastAPI, Pydantic v2。
* **数据库层（严格受限）**: PostgreSQL / MySQL, SQLAlchemy 2.0+ (AsyncSession)。

## 3. ⚠️ 核心开发边界原则（绝对不可违反） ⚠️
**这是一个数据库课程的结课作业，人类开发者必须亲自手写所有的数据库表结构设计与 SQL/ORM 查询逻辑。**
作为AI，你必须严格遵守以下开发边界：

1. **绝对禁止生成任何 SQLAlchemy Model**：
   * 不要生成任何继承自 `DeclarativeBase` 的类。
   * `app/models/` 目录下的所有文件由人类自己创建和编写。
2. **绝对禁止生成任何数据库 CRUD 逻辑代码**：
   * 在后端的 Service/CRUD 层（如 `app/services/` 或 `app/crud/`），你**只允许**生成函数的入参、出参类型提示（Type Hints）以及 Docstring。
   * 函数体内部**必须且只能**使用 `raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")`。
   * 绝对不要出现 `session.query(...)`、`session.execute(...)`、`session.add(...)`、`session.commit()` 等代码！
3. **你的核心任务**：
   * 搭建前后端基础工程结构。
   * 编写完备的 Pydantic Schemas 用于 API 请求/响应的数据校验。
   * 编写 FastAPI Router 层逻辑，处理 HTTP 状态码，并调用 Service 层（即使 Service 层目前抛出未实现异常）。
   * 编写所有的 Vue 3 前端页面、组件、路由和 Axios API 调用封装。

---

## 🚀 阶段 1：工程脚手架初始化 (输入给AI的第一轮指令)

> **任务指令：**
> 请基于上述原则，初始化整个项目结构。
> 1. **后端**：创建 FastAPI 项目骨架。包含 `app/api/endpoints` (路由), `app/schemas` (Pydantic), `app/services` (业务逻辑)。创建空的 `app/models` 目录。
> 2. **后端基建**：生成 `main.py` 和 `app/db/session.py` (配置异步 SQLAlchemy 引擎和 `get_db` 依赖，但不写具体模型)。
> 3. **前端**：初始化 Vue 3 + Vite 结构。配置 Axios 拦截器 (Base URL指向后端)。建立基本的页面布局 (左侧菜单，顶部导航)。

---

## 🚀 阶段 2：资产管理模块开发 (输入给AI的第二轮指令)

> **任务指令：**
> 开始开发“相机信息同步”和“软件锁同步”功能。
> 
> **后端要求**：
> 1. 在 `schemas/camera.py` 和 `schemas/dongle.py` 中编写完备的 Pydantic 模型（Create, Update, Response）。需要包含 SN、标定参数、到期日等字段。
> 2. 在 `api/endpoints/` 编写对应的 FastAPI 路由 (`POST /cameras/sync`, `GET /cameras`, `POST /dongles/sync` 等)。
> 3. 在 `services/camera_service.py` 和 `services/dongle_service.py` 编写函数签名，例如：
>    `async def sync_camera(db: AsyncSession, camera_in: CameraCreate) -> CameraResponse:`
>    **(注意：函数体内只允许写 `raise NotImplementedError`)**
> 
> **前端要求**：
> 1. 编写相机列表和软件锁列表的 Vue 视图。
> 2. 提供“模拟同步”按钮，点击后发送 POST 请求到后端接口。页面需要妥善处理 HTTP 501 (Not Implemented) 异常并给予用户友好的提示。

---

## 🚀 阶段 3：订单流转状态机开发 (输入给AI的第三轮指令)

> **任务指令：**
> 开发 B2B 采购订单模块。这是一个状态驱动的流程。
> 
> **后端要求**：
> 1. 编写 `schemas/order.py`，包含订单头和明细（产品型号、数量、价格）。定义订单状态的 Enum（待确认、已确认、待收款、已发货、已完成）。
> 2. 编写 `api/endpoints/orders.py`，提供创建订单、以及状态推进接口（如 `POST /orders/{id}/pay`, `POST /orders/{id}/ship`）。注意发货接口的 Pydantic 模型需要接收具体的相机 SN 和物流单号。
> 3. `services/order_service.py` 同理，严格只写函数签名和占位符。
> 
> **前端要求**：
> 1. 编写“采购订单管理”列表页。
> 2. 根据订单的当前状态，列表操作栏动态显示不同的按钮（如：状态为“待确认”时显示“确认订单”按钮）。点击按钮弹出对应表单收集信息并调用 API。

---

## 🚀 阶段 4：设备登记与 BOM 绑定模块开发 (输入给AI的第四轮指令)

> **任务指令：**
> 这是系统核心功能：登记定位仪设备（硬件组装绑定）。
> 
> **后端要求**：
> 1. 编写 `schemas/device.py`。定义 `DeviceAssembleRequest` 模型，必须包含：`device_sn`, `dongle_sn`, 以及一个列表 `cameras: List[CameraBinding]` (包含 `camera_sn` 和 安装位置 `position`)。
> 2. 编写路由 `POST /devices/assemble`。
> 3. 在 `services/device_service.py` 编写签名：`async def assemble_device(db: AsyncSession, data: DeviceAssembleRequest) -> DeviceResponse:`。保留 `NotImplementedError`，因为这涉及到复杂的表关联和事务回滚，人类将亲自编写这部分 SQL 操作。
> 
> **前端要求**：
> 1. 编写“设备登记” Vue 页面。
> 2. 表单需要支持动态添加多个相机，并且前端需验证：至少添加2个相机，且相机位置不能重复。
> 3. 表单提交时构造符合 Pydantic 模型要求的数据结构发给后端。