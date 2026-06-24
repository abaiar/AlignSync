# Tasks

## 阶段一：主题变量迁移

- [x] Task 1: 修改 globals.css CSS 变量值（深色→浅色）
  - [x] SubTask 1.1: 修改 `:root` 中 13 个 CSS 变量值（--bg-main、--bg-card、--bg-elevated、--fg-primary、--fg-secondary、--fg-muted、--accent、--accent-hover、--success、--warning、--danger、--info、--border）
  - [x] SubTask 1.2: 更新 `.grid-bg` 网格背景 rgba 颜色
  - [x] SubTask 1.3: 更新 `.status-badge-*`（success/warning/danger/info/muted）的 rgba 边框与背景色
  - [x] SubTask 1.4: 更新 `::selection` 选中色 rgba 值
  - [x] 验证：CSS 变量值全部为浅色系 hex，状态 badge 在浅色背景下可辨

## 阶段二：硬编码颜色修复

- [x] Task 2: 修复 statistics 页面图表颜色
  - [x] SubTask 2.1: 更新 `CHART_COLORS` 4 个 hex 常量（purchase/production/shipment/return）
  - [x] SubTask 2.2: 更新 `GRID_STROKE`、`AXIS_STROKE`、`TOOLTIP_STYLE`（backgroundColor/border/color）
  - [x] SubTask 2.3: 更新 recharts `cursor` rgba 值
  - [x] 验证：统计页图表在浅色背景下网格、坐标轴、tooltip、数据系列清晰可辨

- [x] Task 3: 修复登录页渐变遮罩
  - [x] SubTask 3.1: 将 `to-black/40` 修改为 `to-slate-900/10`
  - [x] 验证：登录页左侧品牌区在浅色主题下视觉层次正确

- [x] Task 4: 修复模态框遮罩与硬编码黑色
  - [x] SubTask 4.1: `payments/[id]/page.tsx` — 2 处 `bg-black/60` → `bg-slate-900/50`
  - [x] SubTask 4.2: `purchase-orders/[id]/page.tsx` — 2 处 `bg-black/60` → `bg-slate-900/50`
  - [x] SubTask 4.3: `Button.tsx` — primary 按钮 `text-black` → `text-white`
  - [x] SubTask 4.4: `purchase-orders/new/page.tsx` — `bg-black` → `bg-white`、`text-black` → `text-white`
  - [x] SubTask 4.5: `devices/new/page.tsx` — `text-black` → `text-white`
  - [x] 验证：模态遮罩在浅色背景下提供视觉聚焦，按钮/选中态文字在 accent 背景上可读

## 阶段三：启动与验证

- [x] Task 5: 启动前端项目并验证运行
  - [x] SubTask 5.1: 确认前端 dev server 在 3000 端口正常运行（热更新已生效）
  - [x] SubTask 5.2: 验证无编译错误、无运行时异常
  - [x] 验证：前端服务持续运行，页面可访问（200）

- [x] Task 6: 浏览器自动化视觉验证 — 登录页与仪表盘
  - [x] SubTask 6.1: 使用 chrome-devtools MCP 访问登录页，验证浅色主题（bodyBg #f8fafc, bodyColor #0f172a, accent #d97706）
  - [x] SubTask 6.2: 登录后访问仪表盘首页，验证浅色主题（sidebar #ffffff, border #e2e8f0）
  - [x] SubTask 6.3: 检查浏览器控制台无错误
  - [x] 验证：登录页与仪表盘全部 UI 元素为浅色系，视觉层次清晰

- [x] Task 7: 浏览器自动化功能验证 — UC-CAM-001 相机管理
  - [x] SubTask 7.1: 以 cam_user 登录，访问 `/dashboard/cameras`，验证浅色主题 + 10 条数据渲染（status badge rgba(22,163,74,0.3)）
  - [x] SubTask 7.2: 访问 `/dashboard/cameras/sync`，验证同步表单浅色主题
  - [x] 验证：相机列表 10 条数据正确展示，同步表单可交互，均为浅色主题

- [x] Task 8: 浏览器自动化功能验证 — UC-SW-001 软件锁管理
  - [x] SubTask 8.1: 访问 `/dashboard/software-locks`，验证浅色主题 + 5 条数据渲染
  - [x] SubTask 8.2: 访问 `/dashboard/software-locks/sync`，验证同步表单浅色主题
  - [x] 验证：软件锁列表数据正确展示，同步表单可交互，均为浅色主题

- [x] Task 9: 浏览器自动化功能验证 — UC-PO-001 采购订单
  - [x] SubTask 9.1: 以 purchaser 登录，访问 `/dashboard/purchase-orders`，验证浅色主题 + 订单列表
  - [x] SubTask 9.2: 访问 `/dashboard/purchase-orders/new`，验证新建表单浅色主题（含单选圆点、选中文字）
  - [x] SubTask 9.3: 提交订单，验证详情页浅色主题 + 模态遮罩
  - [x] 验证：采购订单全流程在浅色主题下功能正常（PO202606240002 创建成功）

- [x] Task 10: 浏览器自动化功能验证 — UC-PO-002 订单确认 + UC-FIN-001 付款
  - [x] SubTask 10.1: 以 biz_staff 登录，访问订单详情，执行确认操作，验证模态框浅色主题（遮罩 bg-slate-900/50）
  - [x] SubTask 10.2: 以 purchaser 登录，访问付款页面，验证付款表单 + 凭证上传模态浅色主题（遮罩 bg-slate-900/50 源码验证）
  - [x] 验证：订单确认与付款流程在浅色主题下功能正常（订单 PO202606240002 已确认，付款 #1 已创建）

- [x] Task 11: 浏览器自动化功能验证 — UC-QRY-001 追溯查询 + 统计页
  - [x] SubTask 11.1: 访问 `/dashboard/traceability`，执行追溯查询，验证结果浅色主题（inputBg #f1f5f9, border #e2e8f0）
  - [x] SubTask 11.2: 访问 `/dashboard/statistics`，验证 recharts 图表浅色主题（#d97706/#2563eb/#16a34a/#dc2626 数据系列，#475569 坐标轴）
  - [x] 验证：追溯查询与统计图表在浅色主题下功能正常，图表颜色清晰可辨

- [x] Task 12: 浏览器自动化视觉验证 — 设备管理与售后
  - [x] SubTask 12.1: 访问 `/dashboard/devices` 与 `/dashboard/devices/new`，验证浅色主题（inputBg #f1f5f9, border #e2e8f0，text-white 修复源码确认）
  - [x] SubTask 12.2: 访问 `/dashboard/after-sales`，验证浅色主题（bodyBg #f8fafc, sidebar #ffffff）
  - [x] 验证：设备管理与售后页面在浅色主题下视觉正确

# Task Dependencies

- Task 2、3、4 依赖 Task 1（CSS 变量先改，再修硬编码）
- Task 2、3、4 可并行（互不依赖）
- Task 5 依赖 Task 1-4（全部样式修改完成）
- Task 6-12 依赖 Task 5（服务启动后才能浏览器验证）
- Task 6-12 可部分并行（不同页面验证互不依赖，但共享浏览器会话需顺序执行）
