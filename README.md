# AlignSync - 车轮定位仪协同制造与溯源平台

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3.5+-brightgreen.svg)

**专为核心技术企业与定位仪生产厂打造的协同制造与供应链管理系统**


</div>

---

## 📖 项目简介

AlignSync 是一个基于多租户架构的车轮定位仪生产制造与供应链管理系统，旨在实现核心技术企业与定位仪生产厂之间的高效协同、防伪管控及全链路追溯。

系统通过建立严密的数字资产管理、B2B 订单流转和基于硬件特征的防伪授权机制，确保从核心部件生产到整机组装的全流程可追溯性。

### 核心价值

- 🔐 **防伪授权机制**：基于相机内参生成专属授权号，确保设备唯一性与合法性
- 📦 **资产数字化管控**：相机与软件锁的全生命周期管理
- 🔄 **供应链协同流转**：标准的 B2B 订单全生命周期管理
- 📊 **全链路追溯**：从核心部件到整机的完整溯源链

---

## ✨ 功能特性

### 核心资产入池模块
- **相机信息同步**：支持从外部标定系统同步相机数据，包括型号、SN、标定参数等
- **软件锁授权同步**：管理软件锁的功能版本与使用授权

### B2B 采购订单协同模块
- **订单全流程管理**：下单 → 确认 → 付款 → 收款确认 → 发货 → 签收
- **付款凭证上传**：支持上传付款截图/回单
- **扫码发货**：精确绑定相机 SN 和软件锁 SN 至订单

### 生产制造与数据溯源模块
- **设备登记**：绑定软件锁与相机，自动生成基于相机内参的授权号
- **追溯查询**：一键查询整机包含的所有核心部件信息

### 数据大盘与统计
- 采购、生产、发货、退货数据的可视化展示
- 按型号、时间维度的统计分析

---

## 🛠 技术栈

### 后端
- **框架**: FastAPI (Python 3.10+)
- **数据库**: SQLite (支持异步操作)
- **ORM**: SQLAlchemy 2.0
- **数据验证**: Pydantic v2

### 前端
- **框架**: Vue 3.5
- **构建工具**: Vite 8
- **状态管理**: Pinia
- **路由**: Vue Router 5
- **样式**: Tailwind CSS 4

---

## 🚀 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- npm 或 yarn

### 后端启动

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

后端服务将在 `http://localhost:8000` 启动，API 文档访问地址：`http://localhost:8000/docs`

### 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 开发模式启动
npm run dev

# 生产构建
npm run build
```

前端开发服务器将在 `http://localhost:5173` 启动。

---

## 📁 项目结构

```
AlignSync/
├── backend/                 # 后端代码
│   ├── app/                 # 应用核心模块
│   │   ├── api/            # API 路由
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # Pydantic 模式
│   │   ├── services/       # 业务逻辑
│   │   └── core/           # 核心配置
│   ├── static/             # 静态文件
│   ├── main.py             # 应用入口
│   ├── requirements.txt    # Python 依赖
│   └── alignsync.db        # SQLite 数据库
│
├── frontend/               # 前端代码
│   ├── src/                # 源代码
│   │   ├── components/     # Vue 组件
│   │   ├── views/          # 页面视图
│   │   ├── stores/         # Pinia 状态
│   │   ├── router/         # 路由配置
│   │   └── api/            # API 请求
│   ├── public/             # 公共资源
│   ├── dist/               # 构建产物
│   └── package.json        # npm 配置
│
└── README.md               # 项目说明文档
```

---

## 📋 系统角色

### 核心技术企业（平台方）
| 角色 | 职责 |
|------|------|
| 相机生产人员 | 组装、标定相机，同步参数至系统 |
| 软件管理员 | 软件锁的功能授权与使用授权录入 |
| 业务人员 | 处理采购订单、核对库存、扫码发货 |
| 财务人员 | 核对订单打款记录并确认收款 |
| 质量人员 | 追溯设备生产及售后信息 |

### 定位仪生产厂（租户方）
| 角色 | 职责 |
|------|------|
| 采购员 | 发起采购、上传付款凭证、确认收货 |
| 组装人员 | 硬件组装、BOM 绑定、设备档案登记 |

---

## 📖 核心业务流程

### 1. 相机信息同步 (UC-CAM-001)
相机生产人员将已标定的相机信息同步至系统，包括型号、SN、标定参数等。

### 2. 软件锁授权同步 (UC-SW-001)
软件管理员扫描软件锁 ID，同步授权详情至系统。

### 3. 采购订单流程
```
生产厂下单 → 核心企业确认 → 生产厂付款 → 核心企业确认收款 → 发货 → 生产厂签收
```

### 4. 设备登记与授权
组装人员绑定软件锁与相机，系统自动生成基于相机内参的授权号，实现防伪管控。

---

## 🔒 安全特性

- **多租户架构**：严格的企业及人员授权与访问控制
- **硬件特征绑定**：基于相机内参生成唯一授权号
- **全链路追溯**：从核心部件到整机的完整溯源链
- **数据完整性校验**：相机 SN 全局唯一，标定数据完整性验证

---

## 📝 开发计划

| 优先级 | 功能模块 | 状态 |
|--------|----------|------|
| P0 | 相机信息同步 | ✅ 已完成 |
| P0 | 软件锁授权同步 | ✅ 已完成 |
| P0 | 采购订单提交 | ✅ 已完成 |
| P0 | 设备登记 | ✅ 已完成 |
| P1 | 订单确认流程 | 🚧 进行中 |
| P1 | 付款与收款确认 | 🚧 进行中 |
| P1 | 产品发货 | 🚧 进行中 |
| P2 | 收货确认 | 📅 计划中 |
| P2 | 设备追溯查询 | 📅 计划中 |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 参与项目开发。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

<div align="center">

**AlignSync** © 2024 - Present

</div>
