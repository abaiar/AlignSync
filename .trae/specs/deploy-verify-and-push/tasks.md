# Tasks

## 阶段一：数据库部署

- [x] Task 1: 创建数据库并执行表结构迁移
  - [x] SubTask 1.1: 使用 `.env` 凭据（root/123456@localhost:3306）连接 MySQL，执行 `backend/database/init.sql` 创建 `alignsync` 数据库（utf8mb4）
  - [x] SubTask 1.2: 在 `backend/` 目录执行 `alembic upgrade head` 建立 18 张表与外键关系
  - [x] 验证：`SHOW TABLES;` 返回 18 张表（+alembic_version），无迁移错误

- [x] Task 2: 运行种子数据脚本并验证完整性
  - [x] SubTask 2.1: 在 `backend/` 目录执行 `python -m scripts.seed_data`
  - [x] SubTask 2.2: 查询各表记录数验证：2 企业、8 角色、21 权限、8 用户、6 产品、10 相机、5 软件锁
  - [x] 验证：记录数与预期一致（2/8/21/8/6/10/5），演示账号密码哈希正确

## 阶段二：服务启动

- [x] Task 3: 启动后端服务并验证 API 可达
  - [x] SubTask 3.1: 在 `backend/` 目录执行 `uvicorn app.main:app --host 0.0.0.0 --port 8000`（后台运行）
  - [x] SubTask 3.2: 验证 `GET http://localhost:8000/health` 返回 `{"status":"ok"}`
  - [x] SubTask 3.3: 验证 `GET http://localhost:8000/docs` 返回 OpenAPI Swagger 文档（200）
  - [x] 验证：后端服务持续运行，API 响应正常

- [x] Task 4: 启动前端服务并验证资源加载
  - [x] SubTask 4.1: 在 `frontend/` 目录执行 `npm install`（如未安装依赖）后 `npm run dev`（后台运行）
  - [x] SubTask 4.2: 验证 `http://localhost:3000` 可访问（200），登录页渲染正常
  - [x] SubTask 4.3: 验证浏览器控制台无错误日志
  - [x] 验证：前端服务持续运行，页面资源加载完整

## 阶段三：功能测试（chrome-devtools MCP）

- [x] Task 5: 浏览器自动化功能测试 - 用户认证
  - [x] SubTask 5.1: 使用 chrome-devtools MCP 打开 `http://localhost:3000/login`
  - [x] SubTask 5.2: 使用演示账号（purchaser/123456）执行登录表单提交
  - [x] SubTask 5.3: 验证登录成功跳转至仪表盘（/dashboard），显示用户"采购员赵六"
  - [x] 验证：登录后 URL 为 `/dashboard`，无认证错误，控制台无错误日志

- [x] Task 6: 浏览器自动化功能测试 - 数据展示
  - [x] SubTask 6.1: 访问相机列表页 `/dashboard/cameras`，验证 10 条相机数据渲染（CAM20260001-010，A100/A200 混合）
  - [x] SubTask 6.2: 访问采购订单列表页 `/dashboard/purchase-orders`，验证空列表渲染（API 200）
  - [x] SubTask 6.3: 访问设备列表页 `/dashboard/devices`，验证空列表渲染（API 200）
  - [x] SubTask 6.4: 访问软件锁列表页 `/dashboard/software-locks`，验证 5 条软件锁数据渲染（SWLOCK-0001-005）
  - [x] 验证：各页面数据正确展示，无 API 错误（均 200），无控制台异常

- [x] Task 7: 浏览器自动化功能测试 - 表单提交
  - [x] SubTask 7.1: 执行新建采购订单流程（`/dashboard/purchase-orders/new`），选择 A100 相机并提交
  - [x] SubTask 7.2: 验证订单创建成功（PO202606240001），列表中出现新订单（待确认状态）
  - [x] SubTask 7.3: 修复发现的 order_type 值不匹配 bug（前端 camera_purchase → camera），验证表单提交流程
  - [x] 验证：表单提交成功，数据持久化，UI 正确反馈，订单详情页与列表页均正确显示

## 阶段四：安全审查

- [x] Task 8: 使用 TRAE-security-review 技能执行代码安全扫描
  - [x] SubTask 8.1: 调用 TRAE-security-review 技能扫描 `backend/` 与 `frontend/` 代码
  - [x] SubTask 8.2: 汇总安全审查报告，发现 6 个问题（1 HIGH + 5 MEDIUM）
    - HIGH: JWT 密钥使用弱默认值 "change-me-in-production"（0.95）
    - MEDIUM: IDOR - 相机详情端点缺少企业归属校验（0.90）
    - MEDIUM: IDOR - 软件锁详情端点缺少企业归属校验（0.90）
    - MEDIUM: IDOR - 追溯查询端点缺少企业归属校验（0.85）
    - MEDIUM: /uploads 静态文件挂载绕过认证（0.85）
    - MEDIUM: bcrypt 不可用时回退到 SHA256 密码哈希（0.85）
  - [x] 验证：安全审查报告生成，关键问题记录（无 SQL 注入、XSS、命令注入等高危问题）

## 阶段五：代码推送

- [x] Task 9: 初始化 git 仓库并强制推送至 GitHub
  - [x] SubTask 9.1: 在项目根目录执行 `git init -b main`，配置默认分支为 main
  - [x] SubTask 9.2: 验证 `.gitignore` 已排除 `.env`、`node_modules`、`__pycache__`、`uploads/` 等敏感与临时文件
  - [x] SubTask 9.3: 执行 `git add .` 与 `git commit`（138 文件，22527 行）
  - [x] SubTask 9.4: 添加远程 `git remote add origin https://github.com/abaiar/AlignSync.git`
  - [x] SubTask 9.5: 执行 `git push -f origin main` 强制推送成功（a1212e9 → 4ef2989）
  - [x] 验证：远程仓库 `https://github.com/abaiar/AlignSync` 内容与本地一致

# Task Dependencies

- Task 2 依赖 Task 1
- Task 3 依赖 Task 2（后端需数据库就绪）
- Task 4 独立（可与 Task 3 并行，但需后端 API 才能完整联调）
- Task 5、6、7 依赖 Task 3 与 Task 4（需前后端均运行）
- Task 8 独立（可与 Task 5-7 并行）
- Task 9 依赖 Task 5-7 完成（测试通过后再推送）
