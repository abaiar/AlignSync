# 前端浅色主题迁移 - 检查清单

## 主题变量迁移
- [x] `globals.css` `:root` 中 13 个 CSS 变量全部改为浅色系 hex 值
- [x] `--bg-main` 为浅灰白背景（#f8fafc）
- [x] `--bg-card` 为白色或极浅灰（#ffffff）
- [x] `--bg-elevated` 为浅灰（输入框/hover，#f1f5f9）
- [x] `--fg-primary` 为深灰/近黑（主文字，#0f172a）
- [x] `--fg-secondary` 为中灰（次要文字，#475569）
- [x] `--fg-muted` 为浅灰（弱化文字，#94a3b8）
- [x] `--accent` / `--accent-hover` 在浅色背景下有足够对比度（#d97706/#b45309）
- [x] `--success` / `--warning` / `--danger` / `--info` 在浅色背景下清晰可辨（#16a34a/#ca8a04/#dc2626/#2563eb）
- [x] `--border` 为浅灰边框色（#e2e8f0）
- [x] `.grid-bg` 网格线 rgba 适配浅色（rgba(226, 232, 240, 0.6)）
- [x] `.status-badge-*` 5 种状态 badge 的 rgba 边框/背景适配浅色
- [x] `::selection` 选中色适配浅色（rgba(217, 119, 6, 0.2)）

## 硬编码颜色修复
- [x] `statistics/page.tsx` — CHART_COLORS 4 个 hex 更新（#d97706/#2563eb/#16a34a/#dc2626）
- [x] `statistics/page.tsx` — GRID_STROKE / AXIS_STROKE / TOOLTIP_STYLE 更新（#e2e8f0/#475569/white bg）
- [x] `statistics/page.tsx` — recharts cursor rgba 更新（rgba(217, 119, 6, 0.08)）
- [x] `login/page.tsx` — `to-black/40` 渐变遮罩更新（to-slate-900/10）
- [x] `payments/[id]/page.tsx` — 2 处 `bg-black/60` 模态遮罩评估/调整（bg-slate-900/50，源码 line 377/428）
- [x] `purchase-orders/[id]/page.tsx` — 2 处 `bg-black/60` 模态遮罩评估/调整（bg-slate-900/50，浏览器验证 rgba(15,23,42,0.5)）
- [x] `Button.tsx` — primary 按钮 `text-black` 对比度评估/调整（text-white）
- [x] `purchase-orders/new/page.tsx` — `bg-black` / `text-black` 调整（bg-white/text-white，dot #d97706）
- [x] `devices/new/page.tsx` — `text-black` 调整（text-white，源码 line 266）

## 服务启动
- [x] 前端 dev server 在 3000 端口正常运行
- [x] 无编译错误
- [x] 无运行时异常
- [x] 热更新生效（样式修改后页面自动刷新）

## 视觉验证 — 登录页与仪表盘
- [x] 登录页浅色主题渲染正确（背景、表单、按钮）
- [x] 登录页左侧品牌区视觉层次正确
- [x] 仪表盘首页浅色主题渲染正确（侧边栏、顶栏、统计卡片）
- [x] 侧边栏导航项激活/默认态视觉正确
- [x] 顶栏用户信息与退出按钮视觉正确
- [x] 浏览器控制台无错误

## 功能验证 — UC-CAM-001 相机管理
- [x] 相机列表页浅色主题 + 10 条数据正确展示
- [x] 相机同步页浅色主题 + 表单可交互
- [x] 筛选/搜索/分页控件浅色主题视觉正确

## 功能验证 — UC-SW-001 软件锁管理
- [x] 软件锁列表页浅色主题 + 5 条数据正确展示
- [x] 软件锁同步页浅色主题 + 表单可交互

## 功能验证 — UC-PO-001 采购订单
- [x] 采购订单列表页浅色主题 + 订单数据展示（PO202606240001）
- [x] 新建订单页浅色主题（订单类型按钮、产品列表、已选项目）
- [x] 单选圆点与选中文字在浅色主题下可读（dot #d97706，text #0f172a）
- [x] 订单提交成功，详情页浅色主题（PO202606240002）
- [x] 订单详情页模态遮罩在浅色主题下视觉正确（bg-slate-900/50）

## 功能验证 — UC-PO-002 订单确认 + UC-FIN-001 付款
- [x] 订单确认操作模态框浅色主题（遮罩 rgba(15,23,42,0.5)）
- [x] 付款页面浅色主题 + 表单可交互（inputBg #f1f5f9）
- [x] 付款凭证上传模态框浅色主题 + 遮罩正确（bg-slate-900/50 源码验证）

## 功能验证 — UC-QRY-001 追溯查询 + 统计页
- [x] 追溯查询页浅色主题 + 查询功能正常
- [x] 追溯结果数据展示完整（无组装设备时显示"未找到追溯信息"）
- [x] 统计页 recharts 图表浅色主题
- [x] 图表网格线在浅色背景下可见（GRID_STROKE #e2e8f0 源码验证）
- [x] 图表坐标轴文字在浅色背景下可读（AXIS_STROKE #475569 SVG 验证）
- [x] 图表 tooltip 浅色主题（TOOLTIP_STYLE 源码验证：white bg, #0f172a text）
- [x] 图表数据系列颜色在浅色背景下清晰可辨（#d97706/#2563eb/#16a34a/#dc2626 SVG 验证）

## 视觉验证 — 设备管理与售后
- [x] 设备列表页浅色主题
- [x] 设备新建页浅色主题（含选中文字色 text-white，源码 line 266）
- [x] 售后管理页浅色主题

## 整体一致性
- [x] 所有页面背景为浅色系（#f8fafc 全站验证）
- [x] 所有文字在浅色背景下可读（对比度达标）
- [x] 所有按钮/链接/状态标签视觉清晰
- [x] 所有边框/分割线为浅灰色（#e2e8f0）
- [x] 所有表单输入框为浅色主题（#f1f5f9）
- [x] 所有表格/卡片为浅色主题
- [x] 无残留深色主题元素
