<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">数据大盘</h1>

    <!-- KPI cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <template v-if="loading">
        <BaseCard v-for="i in 4" :key="`kpi-skeleton-${i}`">
          <BaseSkeleton :lines="3" />
        </BaseCard>
      </template>
      <template v-else>
        <BaseCard v-for="card in statCards" :key="card.title">
          <div class="flex items-start justify-between">
            <div class="min-w-0">
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ card.title }}</p>
              <p class="mt-2 text-3xl font-bold" :class="card.valueClass">{{ card.value }}</p>
              <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">{{ card.subtitle }}</p>
            </div>
            <div class="shrink-0 rounded-lg p-2.5" :class="card.iconBg">
              <BaseIcon :name="card.icon" :size="22" :class="card.iconText" />
            </div>
          </div>
        </BaseCard>
      </template>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <BaseCard title="订单状态分布">
        <BaseSkeleton v-if="loading" :lines="1" height="288px" />
        <div v-else ref="pieChartRef" class="h-72 w-full"></div>
      </BaseCard>
      <BaseCard title="近7天趋势">
        <BaseSkeleton v-if="loading" :lines="1" height="288px" />
        <div v-else ref="lineChartRef" class="h-72 w-full"></div>
      </BaseCard>
    </div>

    <!-- Recent orders -->
    <BaseCard title="最近订单" class="mt-6">
      <BaseSkeleton v-if="loading" :lines="5" height="40px" />
      <BaseEmptyState
        v-else-if="recentOrders.length === 0"
        icon="order"
        title="暂无订单"
        description="还没有任何订单数据"
      />
      <ul v-else class="divide-y divide-gray-200 dark:divide-slate-700">
        <li
          v-for="order in recentOrders"
          :key="order.id"
          class="flex flex-wrap items-center justify-between gap-2 py-3"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-mono text-sm text-gray-800 dark:text-gray-100 truncate">{{ order.po_number }}</span>
            <BaseBadge :text="order.status" :color="statusColorMap[order.status] || 'gray'" />
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span class="text-gray-700 dark:text-gray-200 font-medium">¥{{ formatMoney(order.total_amount) }}</span>
            <span class="text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">{{ formatDate(order.created_at) }}</span>
          </div>
        </li>
      </ul>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useResizeObserver } from '@vueuse/core'
import { getDashboardStats } from '@/api/dashboard'
import { getOrders } from '@/api/order'
import { getDevices } from '@/api/device'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/composables/useToast'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseIcon from '@/components/base/BaseIcon.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'

const appStore = useAppStore()
const toast = useToast()

const loading = ref(true)
const stats = ref(null)
const orders = ref([])
const devices = ref([])

const pieChartRef = ref(null)
const lineChartRef = ref(null)
let pieChart = null
let lineChart = null

const statusColorMap = {
  待确认: 'amber',
  已确认: 'blue',
  待收款: 'orange',
  已收款: 'purple',
  已发货: 'indigo',
  已完成: 'green',
  已取消: 'red',
}

const statusColorHex = {
  待确认: '#f59e0b',
  已确认: '#3b82f6',
  待收款: '#f97316',
  已收款: '#8b5cf6',
  已发货: '#6366f1',
  已完成: '#22c55e',
  已取消: '#ef4444',
}

const statCards = computed(() => [
  {
    title: '相机在库',
    value: stats.value?.camera_in_stock ?? '-',
    icon: 'camera',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    iconText: 'text-blue-600 dark:text-blue-400',
    valueClass: 'text-blue-600 dark:text-blue-400',
    subtitle: '当前在库相机数量',
  },
  {
    title: '软件锁在库',
    value: stats.value?.dongle_in_stock ?? '-',
    icon: 'dongle',
    iconBg: 'bg-purple-50 dark:bg-purple-900/30',
    iconText: 'text-purple-600 dark:text-purple-400',
    valueClass: 'text-purple-600 dark:text-purple-400',
    subtitle: '当前在库软件锁数量',
  },
  {
    title: '待处理订单',
    value: stats.value?.pending_orders ?? '-',
    icon: 'order',
    iconBg: 'bg-amber-50 dark:bg-amber-900/30',
    iconText: 'text-amber-600 dark:text-amber-400',
    valueClass: 'text-amber-600 dark:text-amber-400',
    subtitle: '待确认 / 待收款订单',
  },
  {
    title: '已登记设备',
    value: stats.value?.total_devices ?? '-',
    icon: 'device',
    iconBg: 'bg-green-50 dark:bg-green-900/30',
    iconText: 'text-green-600 dark:text-green-400',
    valueClass: 'text-green-600 dark:text-green-400',
    subtitle: '累计登记设备总数',
  },
])

const recentOrders = computed(() => {
  return [...orders.value]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5)
})

const statusCounts = computed(() => {
  const counts = {}
  orders.value.forEach((o) => {
    const s = o.status || '未知'
    counts[s] = (counts[s] || 0) + 1
  })
  return counts
})

function dateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const trendData = computed(() => {
  const days = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(dateKey(d))
  }
  const orderCounts = days.map((key) =>
    orders.value.filter((o) => (o.created_at ? dateKey(new Date(o.created_at)) === key : false)).length,
  )
  const deviceCounts = days.map((key) =>
    devices.value.filter((d) => (d.created_at ? dateKey(new Date(d.created_at)) === key : false)).length,
  )
  const labels = days.map((key) => key.slice(5))
  return { labels, orderCounts, deviceCounts }
})

function formatMoney(v) {
  if (v == null) return '0.00'
  return Number(v).toFixed(2)
}

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildPieOption() {
  const dark = appStore.isDark
  const textColor = dark ? '#94a3b8' : '#64748b'
  const tooltipBg = dark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)'
  const tooltipText = dark ? '#e2e8f0' : '#1f2937'
  const tooltipBorder = dark ? '#334155' : '#e5e7eb'
  const counts = statusCounts.value
  const data = Object.keys(counts).map((name) => ({
    name,
    value: counts[name],
    itemStyle: { color: statusColorHex[name] || '#94a3b8' },
  }))
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: tooltipText },
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: textColor },
    },
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: dark ? '#1e293b' : '#ffffff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: tooltipText },
        },
        data,
      },
    ],
  }
}

function buildLineOption() {
  const dark = appStore.isDark
  const textColor = dark ? '#94a3b8' : '#64748b'
  const tooltipBg = dark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)'
  const tooltipText = dark ? '#e2e8f0' : '#1f2937'
  const tooltipBorder = dark ? '#334155' : '#e5e7eb'
  const splitLine = dark ? '#334155' : '#e5e7eb'
  const { labels, orderCounts, deviceCounts } = trendData.value
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: tooltipText },
    },
    legend: {
      data: ['订单', '设备'],
      bottom: 0,
      textStyle: { color: textColor },
    },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: textColor } },
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: splitLine } },
    },
    series: [
      {
        name: '订单',
        type: 'line',
        smooth: true,
        data: orderCounts,
        itemStyle: { color: '#3b82f6' },
        areaStyle: { color: 'rgba(59,130,246,0.15)' },
      },
      {
        name: '设备',
        type: 'line',
        smooth: true,
        data: deviceCounts,
        itemStyle: { color: '#22c55e' },
        areaStyle: { color: 'rgba(34,197,94,0.15)' },
      },
    ],
  }
}

function initCharts() {
  if (pieChartRef.value && !pieChart) {
    pieChart = echarts.init(pieChartRef.value)
  }
  if (lineChartRef.value && !lineChart) {
    lineChart = echarts.init(lineChartRef.value)
  }
  updateCharts()
}

function updateCharts() {
  if (pieChart) pieChart.setOption(buildPieOption(), true)
  if (lineChart) lineChart.setOption(buildLineOption(), true)
}

useResizeObserver(pieChartRef, () => pieChart?.resize())
useResizeObserver(lineChartRef, () => lineChart?.resize())

watch(() => appStore.isDark, () => updateCharts())

async function loadData() {
  loading.value = true
  const results = await Promise.allSettled([
    getDashboardStats(),
    getOrders({ limit: 100 }),
    getDevices({ limit: 100 }),
  ])

  if (results[0].status === 'fulfilled') {
    stats.value = results[0].value.data
  } else {
    toast.error(results[0].reason?._userMessage || '加载大盘统计数据失败')
  }

  if (results[1].status === 'fulfilled') {
    orders.value = results[1].value.data.items || []
  } else {
    toast.error(results[1].reason?._userMessage || '加载订单数据失败')
  }

  if (results[2].status === 'fulfilled') {
    devices.value = results[2].value.data.items || []
  } else {
    toast.error(results[2].reason?._userMessage || '加载设备数据失败')
  }

  loading.value = false
}

onMounted(async () => {
  await loadData()
  await nextTick()
  initCharts()
})

onUnmounted(() => {
  pieChart?.dispose()
  pieChart = null
  lineChart?.dispose()
  lineChart = null
})
</script>
