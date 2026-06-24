# AlignSync 部署验证与推送 - 检查清单

## 数据库部署
- [x] `alignsync` 数据库已创建（utf8mb4 字符集）
- [x] Alembic 迁移执行成功，18 张表全部建立
- [x] 表结构与外键关系正确（SHOW TABLES 验证，18 业务表 + alembic_version）

## 种子数据
- [x] 种子脚本执行无错误
- [x] 2 企业记录（智核科技、精工定位仪制造厂）
- [x] 8 角色记录
- [x] 21 权限记录
- [x] 8 演示用户记录（密码哈希可校验，密码 123456）
- [x] 6 产品目录记录
- [x] 10 示例相机记录
- [x] 5 示例软件锁记录

## 后端服务
- [x] uvicorn 服务在 8000 端口启动成功
- [x] `GET /health` 返回 `{"status":"ok"}`
- [x] `GET /docs` 返回 OpenAPI Swagger 文档（200）
- [x] 服务持续运行无崩溃

## 前端服务
- [x] Next.js 服务在 3000 端口启动成功
- [x] `http://localhost:3000` 登录页可访问（200）
- [x] 页面资源（CSS/JS/字体）加载完整
- [x] 浏览器控制台无错误日志

## 功能测试 - 用户认证
- [x] 登录页表单可交互
- [x] 使用 purchaser/123456 登录成功
- [x] 登录后跳转至 `/dashboard`
- [x] JWT token 正确存储（localStorage/cookie）

## 功能测试 - 数据展示
- [x] 相机列表页 `/dashboard/cameras` 数据渲染正常（10 条相机）
- [x] 采购订单列表页 `/dashboard/purchase-orders` 数据渲染正常（API 200）
- [x] 设备列表页 `/dashboard/devices` 数据渲染正常（API 200）
- [x] 软件锁列表页 `/dashboard/software-locks` 数据渲染正常（5 条软件锁）
- [x] 各页面无 API 错误（均 200）
- [x] 各页面无控制台异常

## 功能测试 - 表单提交
- [x] 新建采购订单表单可填写并提交
- [x] 订单创建成功（PO202606240001），列表中出现新记录
- [x] 修复 order_type 值不匹配 bug（camera_purchase → camera）
- [x] 表单提交后 UI 正确反馈（订单详情页 + 列表页）

## 安全审查
- [x] TRAE-security-review 技能已执行扫描
- [x] 安全审查报告已生成
- [x] 发现 6 个问题（1 HIGH: JWT 弱密钥；5 MEDIUM: IDOR × 3、静态文件暴露、SHA256 回退）
- [x] 无 SQL 注入、XSS、命令注入等高危问题

## 代码推送
- [x] 本地 git 仓库已初始化（`git init -b main`）
- [x] `.gitignore` 正确排除 `.env`、`node_modules`、`__pycache__`、`uploads/`
- [x] 代码已提交（138 文件，22527 行）
- [x] 远程 origin 已配置（`https://github.com/abaiar/AlignSync.git`）
- [x] 强制推送成功（`git push -f origin main`，a1212e9 → 4ef2989）
- [x] 远程仓库内容与本地一致

## 风险确认
- [x] 用户已明确确认强制推送（`-f`）会覆盖远程历史
- [x] 用户已确认本地 MySQL 以 root/123456 运行
- [x] 用户已确认推送目标分支为 main
