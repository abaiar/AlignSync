# Checklist

## 工程化基础
- [x] `package.json` 已新增 echarts、@vueuse/core 等依赖并可正常安装
- [x] Prettier 配置就绪，`npm run format` 可用
- [x] 环境变量文件 `.env.development` / `.env.production` 已创建并配置 API base URL
- [x] `style.css` 定义设计令牌（CSS 变量）并配置 Tailwind 暗色模式
- [x] `vite.config.js` 配置别名 `@` 与构建分包

## 组件库
- [x] BaseIcon 纯 SVG 图标组件可用，覆盖侧边栏与按钮所需全部图标
- [x] BaseButton 支持 variant/size/loading/disabled/icon
- [x] BaseInput/BaseTextarea/BaseSelect 支持 label/error/hint/v-model 与暗色样式
- [x] BaseModal/BaseDialog 支持遮罩、Esc 关闭、焦点陷阱、过渡动画
- [x] BaseTable 支持列定义、排序、空状态、加载骨架
- [x] BasePagination 显示页码/上一页/下一页/总数
- [x] BaseBadge/BaseCard/BaseEmptyState/BaseSkeleton 可用
- [x] BaseSearchInput/BaseFilterBar/BaseBreadcrumb 可用

## Composables 与 Store
- [x] `useToast` + BaseToastContainer 已挂载到 App.vue，支持四种类型
- [x] `useConfirm` 确认对话框可用
- [x] `usePagination`/`useAsync` 封装完成
- [x] 按领域拆分的 Pinia store 就绪，useAppStore 支持主题持久化与移动端抽屉

## 布局与路由
- [x] MainLayout 使用 SVG 图标侧边栏、顶栏面包屑、主题切换按钮
- [x] 移动端抽屉式侧边栏可用（<768px）
- [x] 404 兜底路由页面存在并提供返回首页链接
- [x] 路由过渡动画生效
- [x] 路由 meta title 配置完成

## 数据大盘
- [x] 4 个 KPI 卡片含数值与趋势展示
- [x] 订单状态分布饼图（ECharts）正常渲染
- [x] 近 7 天趋势折线图正常渲染
- [x] 最近 5 条订单列表展示
- [x] 加载骨架与空状态生效

## 相机管理
- [x] 列表使用 BaseTable + 搜索 + 状态筛选 + 排序 + 分页
- [x] 同步弹窗使用 BaseModal + 校验（SN/型号必填，JSON 格式校验）
- [x] 使用全局 Toast 替代内联 notification
- [x] 加载骨架生效

## 软件锁管理
- [x] 列表使用 BaseTable + 搜索 + 状态筛选 + 排序 + 分页
- [x] 同步弹窗使用 BaseModal + 校验
- [x] 全局 Toast + 骨架屏

## 采购订单
- [x] 订单列表使用 BaseTable + 搜索 + 状态筛选 + 排序 + 分页
- [x] 新建订单弹窗使用 BaseModal + 校验
- [x] 状态操作弹窗（确认/付款/收款/发货/收货）使用 BaseModal + 校验
- [x] 付款凭证支持文件上传 + 图片预览
- [x] 危险操作使用 useConfirm 二次确认

## 设备登记
- [x] 登记表单使用校验组件（整机SN/软件锁SN/相机绑定）
- [x] 已登记设备列表使用 BaseTable/BaseCard + 骨架
- [x] 追溯弹窗使用 BaseModal 优化展示

## API 与后端
- [x] 前端 `uploadVoucher(orderId, file)` 使用 FormData 上传
- [x] 后端 `POST /orders/{id}/voucher` 文件上传接口可用，返回可访问 URL
- [x] 后端静态挂载兼容 vouchers 目录与新构建产物
- [x] API 错误拦截器对接全局 Toast

## 安全加固
- [x] 全局搜索确认无 `v-html` 图标用法（消除 XSS）
- [x] 用户输入渲染点无 XSS 风险
- [x] 后端文件上传校验类型与大小限制
- [x] HTTP 安全头部建议已补全（CSP/X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy）

## 构建与联调
- [x] `npm run build` 构建无错误（675 模块，0 错误）
- [x] 构建产物已复制到 `backend/static/`，后端可服务 SPA
- [x] 后端依赖已安装，uvicorn 启动成功（端口 8000）
- [x] 前后端联通，API 请求正常（/health 返回 200，安全头部齐全）

## 浏览器端到端验证
- [x] 数据大盘：KPI/图表/最近订单加载渲染正常
- [x] 相机管理：同步、列表搜索/筛选/排序/分页正常
- [x] 软件锁管理：同步、列表交互正常
- [x] 订单全流程：创建→确认→上传付款→确认收款→发货→确认收货 全部通过
- [x] 设备登记与追溯：登记设备、查看追溯信息正常
- [x] 主题切换（亮/暗）持久化生效
- [x] 响应式移动端抽屉菜单可用
- [x] 404 页面与路由过渡正常
- [x] 表单校验与错误 Toast 正常
- [x] 各页面与关键操作已截图记录（26 张截图，20 项检查全部通过，0 控制台错误）
