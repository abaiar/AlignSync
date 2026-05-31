<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">数据大盘</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="card in statCards"
        :key="card.title"
        class="bg-white rounded-lg shadow p-6"
      >
        <div class="text-sm text-gray-500 mb-2">{{ card.title }}</div>
        <div class="text-3xl font-bold" :class="card.color">{{ card.value }}</div>
      </div>
    </div>
    <div class="mt-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">系统说明</h2>
      <p class="text-gray-500 text-sm leading-relaxed">
        AlignSync 车轮定位仪协同制造与溯源平台，用于核心资产（相机/软件锁）入库管理、
        B2B 采购订单状态流转、设备组装登记与 BOM 防伪溯源。请通过左侧菜单导航至各功能模块。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDashboardStats } from '../api/dashboard'

const statCards = ref([
  { title: '相机在库', value: '-', color: 'text-blue-600' },
  { title: '软件锁在库', value: '-', color: 'text-purple-600' },
  { title: '待处理订单', value: '-', color: 'text-amber-600' },
  { title: '已登记设备', value: '-', color: 'text-green-600' },
])

async function loadStats() {
  try {
    const res = await getDashboardStats()
    const data = res.data
    statCards.value = [
      { title: '相机在库', value: data.camera_in_stock ?? '-', color: 'text-blue-600' },
      { title: '软件锁在库', value: data.dongle_in_stock ?? '-', color: 'text-purple-600' },
      { title: '待处理订单', value: data.pending_orders ?? '-', color: 'text-amber-600' },
      { title: '已登记设备', value: data.total_devices ?? '-', color: 'text-green-600' },
    ]
  } catch (e) {
    // ignore
  }
}

onMounted(loadStats)
</script>
