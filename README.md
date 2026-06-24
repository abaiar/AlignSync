# AlignSync 车轮定位仪生产协同管理系统

## 项目简介

AlignSync 是一套面向"核心技术企业"与"定位仪生产厂"的生产协同管理平台，实现车轮定位仪从核心零部件（相机、软件锁）的生产、标定、采购、发货，到整机组装、授权验证及售后追溯的全生命周期闭环管理。

系统通过统一的协同平台打通两家企业的业务流程，覆盖相机信息同步、软件锁授权、采购订单、付款收款、发货收货、设备组装登记、追溯查询及售后处理等核心业务场景。

## 技术栈

### 后端
- **Python 3.11**（兼容 3.9+）
- **FastAPI** 0.110 - 高性能异步 Web 框架
- **SQLAlchemy** 2.0 - 异步 ORM
- **aiomysql** - MySQL 异步驱动
- **Alembic** - 数据库迁移
- **python-jose / passlib** - JWT 认证与密码加密

### 前端
- **Next.js** 14 - React 全栈框架（App Router）
- **TypeScript** 5 - 类型安全
- **Tailwind CSS** 3.4 - 原子化 CSS
- **Zustand** - 轻量状态管理
- **Axios** - HTTP 客户端
- **Recharts** - 数据可视化图表

### 数据库
- **MySQL** 8.0+

## 环境要求

| 依赖 | 最低版本 | 说明 |
| --- | --- | --- |
| Python | 3.9+ | 推荐 3.11 |
| Node.js | 18+ | 推荐 20 LTS |
| MySQL | 8.0+ | 字符集 utf8mb4 |
| pip | 23+ | Python 包管理 |
| npm | 9+ | 随 Node.js 安装 |

## 快速开始

### 1. 克隆仓库

```bash
git clone <repository-url>
cd AlignSync
```

### 2. 配置 MySQL 数据库

登录 MySQL 并创建数据库：

```sql
CREATE DATABASE alignsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

编辑 `backend/.env`（首次启动脚本会从 `.env.example` 自动复制），更新数据库连接：

```
DATABASE_URL=mysql+aiomysql://root:your_password@localhost:3306/alignsync
```

### 3. 一键启动（Windows PowerShell）

```powershell
.\start-all.ps1
```

该脚本会自动在新窗口中启动后端与前端服务。

### 手动启动步骤

如需分别启动或使用非 Windows 环境，请按以下步骤操作。

#### 后端

```bash
cd backend
# 复制环境变量配置
cp .env.example .env
# 编辑 .env 中的数据库密码

# 安装依赖
pip install -r requirements.txt

# 执行数据库迁移
alembic upgrade head

# 初始化种子数据
python -m scripts.seed_data

# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端

```bash
cd frontend
# 安装依赖
npm install
# 启动开发服务器
npm run dev
```

## 访问地址

| 服务 | 地址 |
| --- | --- |
| 前端应用 | http://localhost:3000 |
| 后端 API | http://localhost:8000 |
| API 文档（Swagger） | http://localhost:8000/docs |
| API 文档（ReDoc） | http://localhost:8000/redoc |

## 演示账号

种子数据脚本会创建以下演示账号，**所有账号密码均为 `123456`**。

### 核心技术企业（智核科技有限公司）

| 用户名 | 角色 | 说明 |
| --- | --- | --- |
| `cam_user` | 相机生产人员 | 相机信息同步 |
| `sw_admin` | 软件管理员 | 软件锁授权同步 |
| `biz_staff` | 业务员 | 订单确认、发货 |
| `fin_staff` | 财务人员 | 收款确认 |
| `qa_staff` | 质量人员 | 质量追溯 |

### 定位仪生产厂（精工定位仪制造厂）

| 用户名 | 角色 | 说明 |
| --- | --- | --- |
| `purchaser` | 采购员 | 采购订单、付款、收货 |
| `assembler` | 组装人员 | 设备组装登记 |
| `mfr_admin` | 厂管理员 | 生产厂系统管理 |

## 项目结构

```
AlignSync/
├── backend/           # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/routers/   # API 路由
│   │   ├── models/        # SQLAlchemy 数据模型
│   │   ├── schemas/       # Pydantic 数据模式
│   │   ├── services/      # 业务逻辑层
│   │   └── core/          # 配置、安全
│   ├── alembic/           # 数据库迁移
│   ├── scripts/           # 种子数据脚本
│   └── tests/             # 集成测试
├── frontend/          # Next.js 14
│   ├── app/
│   │   ├── login/         # 登录页
│   │   └── dashboard/     # 主应用页面
│   ├── components/ui/     # 可复用 UI 组件
│   └── lib/               # API 客户端、认证状态
└── 项目需求.md         # 产品需求文档（PRD）
```

## 业务模块

系统实现了以下 10 个核心业务用例，覆盖车轮定位仪生产协同的完整流程：

| 用例编号 | 模块名称 | 说明 |
| --- | --- | --- |
| UC-CAM-001 | 相机信息同步 | 核心技术企业同步相机标定数据到系统库存 |
| UC-SW-001 | 软件锁授权同步 | 同步软件锁授权信息并绑定到生产厂 |
| UC-PO-001 | 提交采购订单 | 生产厂采购员提交相机/软件锁采购订单 |
| UC-PO-002 | 确认采购订单 | 核心技术企业业务员确认或驳回订单 |
| UC-FIN-001 | 订单付款 | 生产厂采购员上传付款凭证完成付款 |
| UC-FIN-002 | 收款确认 | 核心技术企业财务确认收款 |
| UC-SHIP-001 | 产品发货 | 核心技术企业业务员创建发货单并扣减库存 |
| UC-RCV-001 | 收货确认 | 生产厂采购员确认收货并申报差异 |
| UC-ASM-001 | 登记定位仪设备 | 生产厂组装设备并建立 BOM 追溯关系 |
| UC-QRY-001 | 查询设备追溯信息 | 查询设备完整生产追溯链条 |

此外，系统还包含以下支撑模块：
- **权限管理**：企业、用户、角色、权限的分级管理
- **统计汇总**：按时间、型号、企业等维度汇总业务数据
- **售后管理**：相机返修/更换/退货、软件升级/重新激活等售后流程

## API 文档

启动后端服务后，访问以下地址查看交互式 API 文档：

- **Swagger UI**：http://localhost:8000/docs
- **ReDoc**：http://localhost:8000/redoc

API 采用 JWT Bearer Token 认证，登录接口 `POST /api/auth/login` 返回 access_token，后续请求在 Header 中携带 `Authorization: Bearer <token>`。

## 开发说明

### 数据库迁移

修改数据模型后，生成并执行迁移：

```bash
cd backend
alembic revision --autogenerate -m "描述变更内容"
alembic upgrade head
```

### 重置种子数据

```bash
cd backend
# 清空数据库后重新执行
alembic downgrade base
alembic upgrade head
python -m scripts.seed_data
```

### 启动脚本说明

| 脚本 | 作用 |
| --- | --- |
| `start-all.ps1` | 一键启动前后端（各自在新窗口运行） |
| `start-backend.ps1` | 启动后端：安装依赖、迁移、种子、运行服务 |
| `start-frontend.ps1` | 启动前端：安装依赖、运行开发服务器 |

## License

MIT
