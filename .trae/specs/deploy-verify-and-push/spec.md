# AlignSync 部署验证与推送 Spec

## Why

AlignSync 系统已开发完成（见 `build-align-sync-system` spec，全部任务已验收），但尚未在当前环境完成端到端部署验证，且本地代码尚未同步至远程 GitHub 仓库 `https://github.com/abaiar/AlignSync`。需通过本规范完成数据库初始化、种子数据导入、前后端服务启动、浏览器自动化功能测试、安全审查及代码推送，确保系统可运行、功能正常、代码入库。

## What Changes

### 部署阶段
- 使用 `.env` 中已配置的数据库凭据（root/123456@localhost:3306）执行 `database/init.sql`，创建 `alignsync` 数据库
- 执行 Alembic 迁移（`alembic upgrade head`）建立全部 18 张表结构与关系
- 运行 `scripts/seed_data.py` 导入初始测试数据（2 企业、8 角色、21 权限、8 演示账号、6 产品、10 相机、5 软件锁）

### 服务启动阶段
- 启动后端 FastAPI 服务（uvicorn，端口 8000），验证 `/health` 与 `/docs` 可访问
- 启动前端 Next.js 服务（npm run dev，端口 3000），验证页面资源加载且无控制台错误

### 功能测试阶段（chrome-devtools MCP）
- 使用浏览器自动化执行核心功能测试：用户认证、数据展示、表单提交
- 覆盖登录流程、仪表盘加载、相机/订单/设备等关键模块的页面渲染与交互

### 安全审查阶段
- 使用 TRAE-security-review 技能对代码进行安全扫描，识别漏洞与最佳实践偏离

### 代码推送阶段
- 初始化本地 git 仓库（当前目录非 git 仓库）
- 配置远程 `origin` 指向 `https://github.com/abaiar/AlignSync`
- 提交全部代码后**强制推送**至远程仓库 **BREAKING**

## Impact

- **Affected specs**: `build-align-sync-system`（依赖其产出物，不修改其代码）
- **Affected code**: 无代码变更，仅部署、测试与版本控制操作
- **Affected systems**:
  - 本地 MySQL 实例（创建/写入 `alignsync` 数据库）
  - 本地端口 8000（后端）、3000（前端）
  - 远程 GitHub 仓库 `https://github.com/abaiar/AlignSync`（**强制覆盖推送**）

## ADDED Requirements

### Requirement: 数据库初始化
系统 SHALL 使用 `.env` 配置的凭据连接 MySQL，执行建库脚本与迁移，建立全部表结构与关系。

#### Scenario: 建库与迁移成功
- **WHEN** 执行 `init.sql` 与 `alembic upgrade head`
- **THEN** `alignsync` 数据库存在，18 张表全部创建，外键关系正确

#### Scenario: 数据库已存在
- **WHEN** `alignsync` 数据库已存在
- **THEN** `init.sql` 使用 `IF NOT EXISTS` 跳过创建，迁移幂等执行

### Requirement: 种子数据导入
系统 SHALL 运行种子脚本导入演示数据，并验证数据完整性。

#### Scenario: 种子数据导入成功
- **WHEN** 执行 `python -m scripts.seed_data`
- **THEN** 2 企业、8 角色、21 权限、8 用户、6 产品、10 相机、5 软件锁写入数据库

#### Scenario: 数据完整性校验
- **WHEN** 查询各表记录数
- **THEN** 与预期数量一致，演示账号密码哈希正确（密码均为 123456）

### Requirement: 后端服务启动
系统 SHALL 启动 FastAPI 后端服务并响应 API 请求。

#### Scenario: 后端启动成功
- **WHEN** 执行 `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **THEN** 服务监听 8000 端口，`GET /health` 返回 `{"status":"ok"}`，`/docs` 返回 OpenAPI 文档

### Requirement: 前端服务启动
系统 SHALL 启动 Next.js 前端应用，资源正确加载且无控制台错误。

#### Scenario: 前端启动成功
- **WHEN** 执行 `npm run dev`
- **THEN** 服务监听 3000 端口，登录页可访问，浏览器控制台无错误日志

### Requirement: 浏览器自动化功能测试
系统 SHALL 使用 chrome-devtools MCP 执行核心功能测试，覆盖认证、数据展示、表单提交。

#### Scenario: 用户认证测试
- **WHEN** 使用演示账号（如 purchaser/123456）登录
- **THEN** 登录成功跳转至仪表盘，JWT token 正确存储

#### Scenario: 数据展示测试
- **WHEN** 访问相机列表、订单列表、设备列表等页面
- **THEN** 页面正确渲染数据，无 API 错误，无控制台异常

#### Scenario: 表单提交测试
- **WHEN** 执行新建采购订单等表单操作
- **THEN** 表单提交成功，数据持久化，列表更新

### Requirement: 安全审查
系统 SHALL 使用 TRAE-security-review 技能扫描代码，识别安全漏洞与最佳实践偏离。

#### Scenario: 安全扫描完成
- **WHEN** 执行安全审查
- **THEN** 生成安全审查报告，标注高危/中危/低危问题

### Requirement: 代码强制推送至 GitHub
系统 SHALL 初始化本地 git 仓库并强制推送至远程 `https://github.com/abaiar/AlignSync`，确保远程与本地完全一致。

#### Scenario: git 初始化与提交
- **WHEN** 执行 `git init`、`git add`、`git commit`
- **THEN** 本地仓库建立，全部代码（除 .env、node_modules、__pycache__ 等忽略项）提交

#### Scenario: 强制推送成功
- **WHEN** 执行 `git push -f origin <branch>`
- **THEN** 远程仓库内容与本地完全一致，远程历史被覆盖

## MODIFIED Requirements

无。

## REMOVED Requirements

无。

## 风险与注意事项

1. **强制推送（`git push -f`）是破坏性操作**：若远程仓库已有提交历史，将被本地历史完全覆盖，不可恢复。需用户明确确认。
2. **本地非 git 仓库**：当前目录无 `.git`，需先 `git init`。
3. **凭据安全**：`.env` 含数据库密码与 JWT 密钥，已被 `.gitignore` 排除，不会提交。
4. **数据库密码**：`.env` 中为 `root:123456`，需确认本地 MySQL 以该密码运行。
5. **远程仓库分支**：需确认推送目标分支（main 或 master），默认 main。
