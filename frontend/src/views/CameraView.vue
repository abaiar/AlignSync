<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">相机管理</h1>
      <button
        @click="handleSync"
        :disabled="syncing"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        {{ syncing ? '同步中...' : '同步相机信息' }}
      </button>
    </div>

    <div v-if="notification" :class="[
      'mb-4 p-4 rounded-lg text-sm',
      notification.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
    ]">
      {{ notification.message }}
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-700">相机列表</h2>
        <select
          v-model="statusFilter"
          @change="loadCameras"
          class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="在库">在库</option>
          <option value="已发货">已发货</option>
          <option value="已使用">已使用</option>
          <option value="已退货">已退货</option>
          <option value="返修中">返修中</option>
        </select>
      </div>

      <div v-if="loading" class="p-12 text-center text-gray-400">加载中...</div>

      <div v-else-if="cameras.length === 0" class="p-12 text-center text-gray-400">
        暂无相机数据，请点击"同步相机信息"按钮
      </div>

      <table v-else class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内部ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SN</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">型号</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标定日期</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入库时间</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="camera in cameras" :key="camera.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900">{{ camera.id }}</td>
            <td class="px-6 py-4 text-sm font-mono text-gray-900">{{ camera.sn }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ camera.model }}</td>
            <td class="px-6 py-4">
              <span :class="statusClass(camera.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                {{ camera.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(camera.calibration_date) }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(camera.created_at) }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="cameras.length > 0" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <span class="text-sm text-gray-500">共 {{ total }} 条记录</span>
        <div class="flex space-x-2">
          <button
            @click="skip > 0 && (skip -= limit) && loadCameras()"
            :disabled="skip === 0"
            class="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
          >上一页</button>
          <button
            @click="cameras.length >= limit && (skip += limit) && loadCameras()"
            :disabled="cameras.length < limit"
            class="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
          >下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { syncCamera, getCameras } from '../api/camera'

const cameras = ref([])
const loading = ref(false)
const syncing = ref(false)
const total = ref(0)
const skip = ref(0)
const limit = ref(20)
const statusFilter = ref('')
const notification = ref(null)

function showNotification(message, type = 'error') {
  notification.value = { message, type }
  setTimeout(() => { notification.value = null }, 5000)
}

function statusClass(status) {
  const map = {
    '在库': 'bg-green-100 text-green-800',
    '已发货': 'bg-blue-100 text-blue-800',
    '已使用': 'bg-gray-100 text-gray-800',
    '已退货': 'bg-red-100 text-red-800',
    '返修中': 'bg-yellow-100 text-yellow-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('zh-CN')
}

async function loadCameras() {
  loading.value = true
  try {
    const params = { skip: skip.value, limit: limit.value }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getCameras(params)
    cameras.value = res.data.items
    total.value = res.data.total
  } catch (e) {
    showNotification(e._userMessage || '加载相机列表失败')
  } finally {
    loading.value = false
  }
}

async function handleSync() {
  syncing.value = true
  try {
    await syncCamera()
    showNotification('相机信息同步成功', 'success')
    await loadCameras()
  } catch (e) {
    showNotification(e._userMessage || '同步失败')
  } finally {
    syncing.value = false
  }
}

onMounted(loadCameras)
</script>
