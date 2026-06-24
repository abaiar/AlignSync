# AlignSync 部署验证与推送 - 检查清单

## 数据库部署
- [ ] `alignsync` 数据库已创建（utf8mb4 字符集）
- [ ] Alembic 迁移执行成功，18 张表全部建立
- [ ] 表结构与外键关系正确（SHOW TABLES 验证）

## 种子数据
- [ ] 种子脚本执行无错误
- [ ] 2 企业记录（智核科技、精工定位仪制造厂）
- [ ] 8 角色记录
- [ ] 21 权限记录
- [ ] 8 演示用户记录（密码哈希可校验，密码 123456）
- [ ] 6 产品目录记录
- [ ] 10 示例相机记录
- [ ] 5 示例软件锁记录

## 后端服务
- [ ] uvicorn 服务在 8000 端口启动成功
- [ ] `GET /health` 返回 `{"status":"ok"}`
- [ ] `GET /docs` 返回 OpenAPI Swagger 文档
- [ ] 服务持续运行无崩溃

## 前端服务
- [ ] Next.js 服务在 3000 端口启动成功
- [ ] `http://localhost:3000` 登录页可访问
- [ ] 页面资源（CSS/JS/字体）加载完整
- [ ] 浏览器控制台无错误日志

## 功能测试 - 用户认证
- [ ] 登录页表单可交互
- [ ] 使用 purchaser/123456 登录成功
- [ ] 登录后跳转至 `/dashboard`
- [ ] JWT token 正确存储（localStorage/cookie）

## 功能测试 - 数据展示
- [ ] 相机列表页 `/dashboard/cameras` 数据渲染正常
- [ ] 采购订单列表页 `/dashboard/purchase-orders` 数据渲染正常
- [ ] 设备列表页 `/dashboard/devices` 数据渲染正常
- [ ] 统计汇总页 `/dashboard/statistics` 图表渲染正常
- [ ] 各页面无 API 错误（4xx/5xx）
- [ ] 各页面无控制台异常

## 功能测试 - 表单提交
- [ ] 新建采购订单表单可填写并提交
- [ ] 订单创建成功，列表中出现新记录
- [ ] 相机同步表单可交互
- [ ] 表单提交后 UI 正确反馈

## 安全审查
- [ ] TRAE-security-review 技能已执行扫描
- [ ] 安全审查报告已生成
- [ ] 高危/中危问题已记录

## 代码推送
- [ ] 本地 git 仓库已初始化（`git init`）
- [ ] `.gitignore` 正确排除 `.env`、`node_modules`、`__pycache__`、`uploads/`
- [ ] 代码已提交（`git commit`）
- [ ] 远程 origin 已配置（`https://github.com/abaiar/AlignSync.git`）
- [ ] 强制推送成功（`git push -f origin main`）
- [ ] 远程仓库内容与本地一致（用户已明确确认强制推送）

## 风险确认
- [ ] 用户已明确确认强制推送（`-f`）会覆盖远程历史
- [ ] 用户已确认本地 MySQL 以 root/123456 运行
- [ ] 用户已确认推送目标分支为 main
