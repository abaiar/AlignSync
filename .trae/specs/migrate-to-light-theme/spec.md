# 前端浅色主题迁移 Spec

## Why

当前 AlignSync 前端采用深色（炭灰/琥珀）主题，与多数企业级 B2B 管理系统的浅色系视觉惯例不符。需将全站视觉风格从深色系迁移至浅色系，同时保持现有功能与交互逻辑不变，确保所有 UI 元素（背景、文本、按钮、卡片、导航栏、表格、表单、图表等）的颜色、对比度和视觉层次符合浅色系设计规范。

## What Changes

### 主题变量迁移（覆盖 90% UI）
- 修改 `globals.css` `:root` 中全部 13 个 CSS 变量值，从深色 hex 迁移至浅色 hex
- 更新 `.grid-bg` 网格背景的 rgba 颜色
- 更新 `.status-badge-*`（success/warning/danger/info/muted）的硬编码 rgba 边框与背景色
- 更新 `::selection` 选中色

### 硬编码颜色修复
- `statistics/page.tsx`：7 个 recharts 图表 hex 颜色常量 + 1 个 rgba cursor 值
- `login/page.tsx`：`to-black/40` 渐变遮罩
- `payments/[id]/page.tsx`：2 处 `bg-black/60` 模态遮罩
- `purchase-orders/[id]/page.tsx`：2 处 `bg-black/60` 模态遮罩
- `Button.tsx`：primary 按钮 `text-black`（评估新 accent 下的对比度）
- `purchase-orders/new/page.tsx`：`bg-black` 单选圆点、`text-black` 选中文字
- `devices/new/page.tsx`：`text-black` 选中文字

### 浅色主题设计规范
- **主背景**：浅灰白（如 `#f8fafc` / `#f9fafb`）
- **卡片/表面**：白色或极浅灰（如 `#ffffff` / `#f1f5f9`）
- **抬升表面**（输入框/hover）：浅灰（如 `#f1f5f9` / `#e2e8f0`）
- **主文字**：深灰/近黑（如 `#0f172a` / `#1e293b`）
- **次要文字**：中灰（如 `#64748b`）
- **弱化文字**：浅灰（如 `#94a3b8`）
- **强调色**：保持琥珀色系或调整为更适合浅色背景的色调（如 `#d97706` / `#ea580c`）
- **边框**：浅灰（如 `#e2e8f0` / `#cbd5e1`）
- **状态色**：success/warning/danger/info 调整为浅色背景下高对比度的色值

### 不变项
- `tailwind.config.ts` token 映射不变（语义化 token 架构保留）
- 所有组件/页面的语义化 class 不变（`bg-surface`、`text-fg-primary` 等）
- 字体配置不变（DM Sans / Saira / JetBrains Mono）
- 所有业务逻辑、API 调用、交互行为不变

## Impact

- **Affected specs**: `build-align-sync-system`（视觉层变更，不影响业务逻辑）
- **Affected code**:
  - `frontend/app/globals.css`（核心 — CSS 变量 + 组件层样式）
  - `frontend/app/dashboard/statistics/page.tsx`（图表颜色常量）
  - `frontend/app/login/page.tsx`（渐变遮罩）
  - `frontend/app/dashboard/payments/[id]/page.tsx`（模态遮罩）
  - `frontend/app/dashboard/purchase-orders/[id]/page.tsx`（模态遮罩）
  - `frontend/app/dashboard/purchase-orders/new/page.tsx`（硬编码黑色）
  - `frontend/app/dashboard/devices/new/page.tsx`（硬编码黑色）
  - `frontend/components/ui/Button.tsx`（primary 按钮文字色）
- **Affected systems**: 无后端变更，无数据库变更

## ADDED Requirements

### Requirement: 浅色主题视觉规范
系统 SHALL 采用浅色系主题，所有 UI 元素的颜色、对比度和视觉层次符合浅色系设计规范。

#### Scenario: 背景与表面层次
- **WHEN** 用户访问任意页面
- **THEN** 主背景为浅灰白色，卡片/面板为白色或极浅灰，输入框/hover 态为浅灰，形成清晰的视觉层次

#### Scenario: 文字可读性
- **WHEN** 用户查看任意文字内容
- **THEN** 主文字为深灰/近黑（对比度 ≥ 7:1），次要文字为中灰（对比度 ≥ 4.5:1），符合 WCAG AA 标准

#### Scenario: 强调色与状态色
- **WHEN** 用户查看按钮、链接、状态标签等强调元素
- **THEN** 强调色在浅色背景下具有足够对比度，状态色（成功/警告/危险/信息）清晰可辨

### Requirement: 图表浅色适配
系统 SHALL 将统计页面的 recharts 图表颜色适配浅色主题。

#### Scenario: 图表渲染
- **WHEN** 用户访问 `/dashboard/statistics`
- **THEN** 图表网格线、坐标轴、tooltip 背景均为浅色系，数据系列颜色在浅色背景下清晰可辨

### Requirement: 模态遮罩浅色适配
系统 SHALL 将模态框遮罩适配浅色主题。

#### Scenario: 模态框显示
- **WHEN** 用户触发模态框（如查看付款凭证、确认订单）
- **THEN** 遮罩层为半透明深色（在浅色背景上仍提供视觉聚焦效果），模态内容为浅色主题

### Requirement: 功能完整性验证
系统 SHALL 在主题迁移后保持所有业务功能正常，依据 `项目需求.md` 中的用例验证。

#### Scenario: 相机信息同步（UC-CAM-001）
- **WHEN** 相机生产人员访问相机管理页面并执行同步
- **THEN** 页面以浅色主题渲染，同步功能正常工作

#### Scenario: 软件锁授权同步（UC-SW-001）
- **WHEN** 软件管理员访问软件锁管理页面并执行同步
- **THEN** 页面以浅色主题渲染，同步功能正常工作

#### Scenario: 提交采购订单（UC-PO-001）
- **WHEN** 采购员访问新建采购订单页面并提交订单
- **THEN** 表单以浅色主题渲染，订单创建成功

#### Scenario: 订单确认（UC-PO-002）
- **WHEN** 业务员访问订单详情并确认
- **THEN** 详情页以浅色主题渲染，订单状态更新成功

#### Scenario: 设备追溯查询（UC-QRY-001）
- **WHEN** 用户访问追溯查询页面并查询设备
- **THEN** 追溯结果以浅色主题渲染，数据展示完整

## MODIFIED Requirements

无（本变更仅涉及视觉层，不修改业务需求）。

## REMOVED Requirements

无。

## 设计决策

1. **不引入主题切换机制**：项目无 next-themes / ThemeProvider，本次仅做单向迁移（深色→浅色），不增加暗/亮切换功能，保持架构简单。
2. **保留语义化 token 架构**：Tailwind config 的 token 映射不变，仅修改 CSS 变量值，最大化复用现有组件代码。
3. **模态遮罩保留半透明黑色**：`bg-black/60` 在浅色背景上仍是常见做法，提供视觉聚焦，无需改为白色遮罩。
4. **强调色评估**：琥珀色 `#f59e0b` 在浅色背景上对比度可能不足（特别是作为按钮文字背景时），需评估是否调整为更深的橙色调（如 `#d97706`）。
5. **PRD 验证说明**：`项目需求.md` 为业务需求文档（含 UC-CAM-001 等用例），不含具体视觉验证步骤或示例截图。验证将覆盖浅色主题的视觉正确性 + PRD 用例的功能正确性。
