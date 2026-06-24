# Tasks

- [x] Task 1: 搭建前端工程化基础（依赖、配置、设计令牌）
  - [x] SubTask 1.1: 更新 `frontend/package.json`，新增依赖：echarts、@vueuse/core（自建 SVG 图标集替代 iconify，自建 useFormValidation 替代 vee-validate）
  - [x] SubTask 1.2: 配置 Prettier，添加 `format` 脚本
  - [x] SubTask 1.3: 新增 `.env.development` / `.env.production` 管理环境变量（API base URL）
  - [x] SubTask 1.4: 在 `style.css` 中定义设计令牌（CSS 变量：颜色/间距/圆角/阴影/字体），配置 Tailwind 暗色模式 `dark:` 策略
  - [x] SubTask 1.5: 更新 `vite.config.js`：构建分包优化（manualChunks 函数式）、别名 `@` 指向 `src`

- [x] Task 2: 构建可复用组件库（`src/components/base/`）
  - [x] SubTask 2.1: BaseIcon —— 纯 SVG 图标组件，封装常用图标，替代 `v-html`
  - [x] SubTask 2.2: BaseButton —— 支持 variant(primary/success/warning/danger/ghost)、size、loading、disabled、icon
  - [x] SubTask 2.3: BaseInput / BaseTextarea / BaseSelect —— 支持 label、error、hint、v-model，统一暗色样式
  - [x] SubTask 2.4: BaseModal / BaseDialog —— 模态与确认对话框，含遮罩、Esc 关闭、焦点陷阱、过渡动画
  - [x] SubTask 2.5: BaseTable —— 支持列定义、排序、空状态、加载骨架插槽
  - [x] SubTask 2.6: BasePagination —— 页码/上一页/下一页/总数显示
  - [x] SubTask 2.7: BaseBadge —— 状态徽章，支持颜色映射
  - [x] SubTask 2.8: BaseCard / BaseEmptyState / BaseSkeleton —— 卡片、空状态、骨架屏
  - [x] SubTask 2.9: BaseSearchInput / BaseFilterBar —— 搜索输入与筛选条
  - [x] SubTask 2.10: BaseBreadcrumb —— 面包屑导航

- [x] Task 3: 构建 Composables 与全局服务（`src/composables/`、`src/stores/`）
  - [x] SubTask 3.1: `useToast` + Toast 容器组件 `BaseToastContainer`，挂载到 App.vue，支持 success/error/warning/info
  - [x] SubTask 3.2: `useConfirm` + 确认对话框，支持标题/内容/确认按钮文案
  - [x] SubTask 3.3: `usePagination` —— 封装 skip/limit/total 逻辑
  - [x] SubTask 3.4: `useAsync` —— 封装 loading/error/data 状态
  - [x] SubTask 3.5: 按领域拆分 Pinia store：useDashboardStore/useCameraStore/useDongleStore/useOrderStore/useDeviceStore；useAppStore 增加主题（亮/暗）与持久化、移动端抽屉状态

- [x] Task 4: 升级 MainLayout 与路由
  - [x] SubTask 4.1: 重构 MainLayout —— SVG 图标侧边栏、顶栏面包屑、主题切换按钮、移动端抽屉菜单、响应式
  - [x] SubTask 4.2: 路由增强 —— 添加 404 兜底路由、路由 meta（title/icon）、路由过渡动画（`<router-view v-slot>` + `<Transition>`）
  - [x] SubTask 4.3: 更新 `App.vue` 挂载 ToastContainer 与全局过渡

- [x] Task 5: 升级数据大盘（DashboardView）
  - [x] SubTask 5.1: KPI 卡片增加环比趋势展示与图标
  - [x] SubTask 5.2: 接入 ECharts，新增订单状态分布饼图
  - [x] SubTask 5.3: 新增近 7 天趋势折线图（订单/设备登记）
  - [x] SubTask 5.4: 新增最近 5 条订单列表卡片
  - [x] SubTask 5.5: 加载骨架与空状态

- [x] Task 6: 升级相机管理（CameraView）
  - [x] SubTask 6.1: 使用 BaseTable + 搜索 + 状态筛选 + 排序 + BasePagination
  - [x] SubTask 6.2: 同步弹窗使用 BaseModal + 校验组件（SN/型号必填，JSON 格式校验）
  - [x] SubTask 6.3: 移除内联 notification，改用全局 Toast；加载骨架

- [x] Task 7: 升级软件锁管理（DongleView）
  - [x] SubTask 7.1: 使用 BaseTable + 搜索 + 状态筛选 + 排序 + BasePagination
  - [x] SubTask 7.2: 同步弹窗使用 BaseModal + 校验（dongle_id/版本必填）
  - [x] SubTask 7.3: 全局 Toast + 骨架屏

- [x] Task 8: 升级采购订单（OrderView）
  - [x] SubTask 8.1: 订单列表使用 BaseTable + 搜索 + 状态筛选 + 排序 + BasePagination
  - [x] SubTask 8.2: 新建订单弹窗使用 BaseModal + 校验（租户/明细）
  - [x] SubTask 8.3: 状态操作弹窗（确认/付款/收款/发货/收货）使用 BaseModal + 校验
  - [x] SubTask 8.4: 付款凭证改为文件上传 + 图片预览（调用后端上传接口）
  - [x] SubTask 8.5: 发货/危险操作使用 useConfirm 二次确认；全局 Toast

- [x] Task 9: 升级设备登记（DeviceView）
  - [x] SubTask 9.1: 登记表单使用校验组件（整机SN/软件锁SN/相机绑定校验）
  - [x] SubTask 9.2: 已登记设备列表使用 BaseTable/BaseCard 列表 + 骨架
  - [x] SubTask 9.3: 追溯弹窗使用 BaseModal 优化展示；全局 Toast

- [x] Task 10: API 层与后端微调
  - [x] SubTask 10.1: 前端 API 层新增 `uploadVoucher(orderId, file)`，使用 FormData 上传
  - [x] SubTask 10.2: 后端 `orders.py` 新增 `POST /orders/{id}/voucher` 文件上传接口，保存至 `backend/static/vouchers/`，返回可访问 URL
  - [x] SubTask 10.3: 后端 `main.py` 确认静态挂载兼容 vouchers 目录与新构建产物
  - [x] SubTask 10.4: 前端 API 错误拦截器对接全局 Toast

- [x] Task 11: 安全加固（应用 security-best-practices）
  - [x] SubTask 11.1: 全局搜索移除所有 `v-html` 用法，替换为 BaseIcon
  - [x] SubTask 11.2: 审计用户输入渲染点，确保无 XSS 风险
  - [x] SubTask 11.3: 后端文件上传接口校验文件类型与大小限制
  - [x] SubTask 11.4: 检查并补全 HTTP 安全头部建议（CSP/X-Frame-Options 等）

- [x] Task 12: 构建与部署联调
  - [x] SubTask 12.1: 执行 `npm run build`，确保构建无错误
  - [x] SubTask 12.2: 将构建产物复制到 `backend/static/`，确保后端可正确服务 SPA
  - [x] SubTask 12.3: 安装后端依赖，启动后端服务（uvicorn）
  - [x] SubTask 12.4: 启动前端 dev server 或通过后端访问，确认前后端联通

- [x] Task 13: 浏览器端到端全方位验证（应用 webapp-testing）
  - [x] SubTask 13.1: 启动前后端服务，打开浏览器访问应用
  - [x] SubTask 13.2: 验证数据大盘：KPI/图表/最近订单加载与渲染
  - [x] SubTask 13.3: 验证相机管理：同步相机、列表搜索/筛选/排序/分页
  - [x] SubTask 13.4: 验证软件锁管理：同步软件锁、列表交互
  - [x] SubTask 13.5: 验证订单全流程：创建→确认→上传付款（含文件上传）→确认收款→发货→确认收货
  - [x] SubTask 13.6: 验证设备登记与追溯：登记设备、查看追溯信息
  - [x] SubTask 13.7: 验证主题切换（亮/暗）持久化
  - [x] SubTask 13.8: 验证响应式（移动端抽屉菜单）
  - [x] SubTask 13.9: 验证 404 页面与路由过渡
  - [x] SubTask 13.10: 验证表单校验与错误 Toast
  - [x] SubTask 13.11: 截图记录各页面与关键操作，汇总验证报告

# Task Dependencies
- Task 2 依赖 Task 1（设计令牌与配置）
- Task 3 依赖 Task 1
- Task 4 依赖 Task 2、Task 3
- Task 5/6/7/8/9 依赖 Task 2、Task 3、Task 4（可并行）
- Task 10 可与 Task 5-9 并行（后端微调独立）
- Task 11 依赖 Task 2-9 完成（全局审计）
- Task 12 依赖 Task 1-11 完成
- Task 13 依赖 Task 12 完成
