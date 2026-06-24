# AlignSync 前端全方位升级 Spec

## Why
当前 AlignSync 前端虽然功能可用，但存在大量重复代码、缺少可复用组件体系、无数据可视化、无统一通知/校验机制、图标使用 `v-html` 渲染 HTML 实体（存在 XSS 风险且视觉效果差）、无暗色模式、无响应式适配、无 404 与加载骨架等基础体验。本次升级旨在将前端从"能用的原型"提升为"工程化、可维护、体验完善、安全可靠"的生产级管理后台，并在升级后通过浏览器对全部业务功能进行端到端验证。

## What Changes
- **新增设计系统与主题**：建立设计令牌（颜色/间距/圆角/阴影/字体），支持亮色/暗色双主题切换并持久化。
- **新增可复用组件库**：BaseButton、BaseInput、BaseSelect、BaseTextarea、BaseModal、BaseDialog、BaseTable、BasePagination、BaseBadge、BaseCard、BaseToast、BaseEmptyState、BaseSkeleton、BaseSearchInput、BaseFilterBar、BaseBreadcrumb、BaseIcon（纯 SVG 图标体系，替代 `v-html`）。
- **新增 Composables**：`useToast`、`useConfirm`、`usePagination`、`useAsync`，消除各视图重复逻辑。
- **新增全局 Toast 通知系统**：替代每个视图内重复的内联 notification div，统一成功/错误/警告/信息提示。
- **新增全局确认对话框**：替代原生 `confirm`，用于危险操作二次确认。
- **升级数据大盘**：引入 ECharts，新增 KPI 趋势卡、订单状态分布饼图、近 7 天趋势折线图、最近订单列表。
- **升级数据表格**：支持列排序、关键字搜索、状态筛选组合、改进分页、空状态与加载骨架。
- **升级表单**：引入表单校验（必填/格式/范围），内联错误提示；付款凭证改为真实文件上传（图片预览）。
- **升级布局与导航**：面包屑、页面标题、侧边栏图标改用 SVG、路由过渡动画、404 页面、路由 meta 标题。
- **新增响应式适配**：移动端抽屉式侧边栏、表格横向滚动、栅格自适应。
- **新增无障碍支持**：键盘可达、焦点管理、ARIA 标签、模态焦点陷阱。
- **安全加固**：移除全部 `v-html` 图标用法（消除 XSS 向量）、输入消毒、HTTP 头部建议、敏感字段处理。
- **状态管理增强**：按领域拆分 Pinia store（camera/dongle/order/device/dashboard），支持缓存与乐观更新。
- **性能优化**：路由懒加载、组件按需引入、构建分包、虚拟滚动（大列表）。
- **开发体验**：ESLint + Prettier 配置、环境变量管理（`.env.development` / `.env.production`）。
- **后端微调**：新增付款凭证文件上传接口（`POST /api/v1/orders/{id}/voucher`，返回静态可访问 URL）；静态资源目录兼容新构建产物。
- **BREAKING**：前端构建产物目录与静态服务挂载保持一致，旧 `backend/static` 将被新构建覆盖。

## Impact
- Affected specs: 前端全部视图（Dashboard/Camera/Dongle/Order/Device）、MainLayout、API 层、Pinia store、路由配置、样式入口。
- Affected code:
  - `frontend/src/**`（几乎所有文件重构/新增）
  - `frontend/package.json`（新增 echarts、vee-validate、@vueuse/core、eslint、prettier 等依赖）
  - `frontend/vite.config.js`、`frontend/index.html`
  - `backend/app/api/endpoints/orders.py`、`backend/main.py`（文件上传接口与静态挂载）
  - `backend/static/`（重新构建后覆盖）

## ADDED Requirements

### Requirement: 设计系统与主题
系统 SHALL 提供基于 Tailwind CSS 4 的设计令牌体系，并支持亮色/暗色双主题。

#### Scenario: 主题切换与持久化
- **WHEN** 用户点击顶栏主题切换按钮
- **THEN** 全站立即切换至目标主题，且选择持久化到 localStorage，刷新后保持

#### Scenario: 默认跟随系统
- **WHEN** 首次访问且未设置过主题偏好
- **THEN** 系统根据 `prefers-color-scheme` 自动选择亮色或暗色

### Requirement: 可复用组件库
系统 SHALL 提供一套语义化基础组件，覆盖按钮、输入、选择、模态、表格、分页、徽章、卡片、Toast、空状态、骨架、搜索、筛选、面包屑、图标。

#### Scenario: 组件统一交互
- **WHEN** 任意视图使用 BaseButton 的 loading 状态
- **THEN** 按钮显示加载指示器并禁用点击，防止重复提交

#### Scenario: 图标安全渲染
- **WHEN** 侧边栏与按钮渲染图标
- **THEN** 使用 BaseIcon 的纯 SVG 方案渲染，不使用 `v-html`，消除 XSS 向量

### Requirement: 全局 Toast 通知系统
系统 SHALL 提供全局 Toast 通知，支持 success/error/warning/info 四种类型，自动消失并可手动关闭。

#### Scenario: 操作成功提示
- **WHEN** 用户成功同步相机/软件锁、创建订单、登记设备等操作完成
- **THEN** 右上角弹出 success Toast，5 秒后自动消失

#### Scenario: 错误提示
- **WHEN** API 请求失败
- **THEN** 弹出 error Toast 显示友好错误信息，不再使用各视图内联 notification div

### Requirement: 全局确认对话框
系统 SHALL 对危险/不可逆操作提供二次确认对话框。

#### Scenario: 发货确认
- **WHEN** 用户提交发货操作
- **THEN** 弹出确认对话框，用户确认后才执行

### Requirement: 增强数据大盘
系统 SHALL 在数据大盘展示 KPI 趋势卡、订单状态分布图、近 7 天趋势图与最近订单列表。

#### Scenario: 大盘加载
- **WHEN** 用户进入数据大盘
- **THEN** 显示 4 个 KPI 卡片（含数值与环比趋势）、订单状态分布饼图、近 7 天趋势折线图、最近 5 条订单列表

#### Scenario: 图表交互
- **WHEN** 用户悬停图表数据点
- **THEN** 显示 tooltip 明细

### Requirement: 增强数据表格
系统 SHALL 为相机/软件锁/订单列表提供关键字搜索、列排序、状态筛选与改进分页。

#### Scenario: 搜索与筛选
- **WHEN** 用户在搜索框输入 SN 关键字并选择状态筛选
- **THEN** 表格实时过滤展示匹配记录，并显示匹配数量

#### Scenario: 列排序
- **WHEN** 用户点击可排序列头
- **THEN** 表格按该列升序/降序排序，列头显示排序方向指示

### Requirement: 表单校验
系统 SHALL 对所有表单提供实时校验与内联错误提示。

#### Scenario: 必填校验
- **WHEN** 用户提交未填写必填字段的表单
- **THEN** 对应字段下方显示错误提示，阻止提交

#### Scenario: 格式校验
- **WHEN** 用户在 JSON 标定数据字段输入非法 JSON
- **THEN** 显示格式错误提示

### Requirement: 付款凭证文件上传
系统 SHALL 支持上传付款凭证图片文件并预览，替代原 URL 文本输入。

#### Scenario: 上传与预览
- **WHEN** 用户在上传付款弹窗选择图片文件
- **THEN** 显示图片预览缩略图，提交后文件上传至后端并返回可访问 URL

### Requirement: 响应式适配
系统 SHALL 在移动端（<768px）提供抽屉式侧边栏与自适应布局。

#### Scenario: 移动端侧边栏
- **WHEN** 用户在移动端点击菜单按钮
- **THEN** 侧边栏以抽屉形式滑出，带遮罩，点击遮罩或菜单项后收起

### Requirement: 路由与导航增强
系统 SHALL 提供面包屑、404 页面、路由过渡动画与页面标题。

#### Scenario: 404 页面
- **WHEN** 用户访问不存在的路由
- **THEN** 显示 404 页面并提供返回首页链接

#### Scenario: 面包屑导航
- **WHEN** 用户进入任意功能页
- **THEN** 顶栏显示"首页 / 当前模块"面包屑

### Requirement: 无障碍支持
系统 SHALL 支持键盘导航、焦点管理与 ARIA 标签。

#### Scenario: 模态键盘操作
- **WHEN** 模态打开时按 Esc
- **THEN** 关闭模态；Tab 键在模态内循环聚焦（焦点陷阱）

### Requirement: 安全加固
系统 SHALL 移除所有 `v-html` 图标用法，对用户输入进行消毒，避免 XSS。

#### Scenario: 无 v-html 图标
- **WHEN** 审计前端源码
- **THEN** 不存在用于渲染图标的 `v-html`，全部改用 BaseIcon SVG 方案

### Requirement: 浏览器端到端验证
系统升级完成后 SHALL 启动前后端，并在浏览器中对全部业务功能进行端到端检查。

#### Scenario: 全功能验证
- **WHEN** 升级完成并启动服务
- **THEN** 使用 Playwright 依次验证：大盘加载、相机同步与列表、软件锁同步与列表、订单全流程（创建→确认→付款→收款→发货→收货）、设备登记与追溯、主题切换、响应式、404 等场景，并截图记录

## MODIFIED Requirements

### Requirement: MainLayout 布局
MainLayout SHALL 使用 SVG 图标侧边栏、顶栏面包屑、主题切换按钮、移动端抽屉菜单，替代原 HTML 实体图标与固定布局。

### Requirement: 各业务视图
DashboardView/CameraView/DongleView/OrderView/DeviceView SHALL 重构为使用基础组件库与 composables，移除内联 notification，统一使用全局 Toast，表格使用 BaseTable，表单使用校验组件。

### Requirement: API 层
API 层 SHALL 保持现有接口签名兼容，新增付款凭证上传方法 `uploadVoucher(orderId, file)`，并统一错误处理透传至全局 Toast。

### Requirement: Pinia 状态管理
SHALL 按领域拆分 store（useDashboardStore/useCameraStore/useDongleStore/useOrderStore/useDeviceStore），保留 useAppStore 管理主题与侧边栏，支持列表缓存。
