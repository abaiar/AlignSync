<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">软件锁管理</h1>
      <button
        @click="showSyncModal = true"
        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
      >
        同步授权信息
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
        <h2 class="text-lg font-semibold text-gray-700">软件锁列表</h2>
        <select
          v-model="statusFilter"
          @change="loadDongles"
          class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">全部状态</option>
          <option value="已授权">已授权</option>
          <option value="在库">在库</option>
          <option value="已发货">已发货</option>
          <option value="已使用">已使用</option>
          <option value="已退货">已退货</option>
        </select>
      </div>

      <div v-if="loading" class="p-12 text-center text-gray-400">加载中...</div>

      <div v-else-if="dongles.length === 0" class="p-12 text-center text-gray-400">
        暂无软件锁数据，请点击"同步授权信息"按钮
      </div>

      <table v-else class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内部ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">软件锁ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">版本</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">授权功能</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">到期日</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入库时间</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="dongle in dongles" :key="dongle.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900">{{ dongle.id }}</td>
            <td class="px-6 py-4 text-sm font-mono text-gray-900">{{ dongle.dongle_id }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ dongle.version }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">
              <span
                v-for="f in dongle.features"
                :key="f"
                class="inline-block bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs mr-1 mb-1"
              >{{ f }}</span>
              <span v-if="!dongle.features?.length" class="text-gray-400">-</span>
            </td>
            <td class="px-6 py-4">
              <span :class="statusClass(dongle.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                {{ dongle.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(dongle.expiry_date) }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(dongle.created_at) }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="dongles.length > 0" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <span class="text-sm text-gray-500">共 {{ total }} 条记录</span>
        <div class="flex space-x-2">
          <button
            @click="skip > 0 && (skip -= limit) && loadDongles()"
            :disabled="skip === 0"
            class="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
          >上一页</button>
          <button
            @click="dongles.length >= limit && (skip += limit) && loadDongles()"
            :disabled="dongles.length < limit"
            class="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
          >下一页</button>
        </div>
      </div>
    </div>

    <div v-if="showSyncModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">同步软件锁授权信息</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">软件锁ID</label>
            <input v-model="syncForm.dongle_id" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="输入软件锁ID" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">软件版本</label>
            <input v-model="syncForm.version" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="如: v3.2.1" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">授权功能（逗号分隔）</label>
            <input v-model="syncForm.featuresStr" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="如: 3D定位,高级测量" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">授权到期日</label>
            <input v-model="syncForm.expiry_date" type="date" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button @click="showSyncModal = false" class="px-4 py-2 text-sm text-gray-600 border rounded-md hover:bg-gray-50">取消</button>
          <button @click="handleSync" :disabled="syncing" class="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50">
            {{ syncing ? '同步中...' : '确认同步' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { syncDongle, getDongles } from '../api/dongle'

const dongles = ref([])
const loading = ref(false)
const syncing = ref(false)
const total = ref(0)
const skip = ref(0)
const limit = ref(20)
const statusFilter = ref('')
const notification = ref(null)
const showSyncModal = ref(false)

const syncForm = reactive({
  dongle_id: '',
  version: '',
  featuresStr: '',
  expiry_date: '',
})

function showNotification(message, type = 'error') {
  notification.value = { message, type }
  setTimeout(() => { notification.value = null }, 5000)
}

function statusClass(status) {
  const map = {
    '已授权': 'bg-purple-100 text-purple-800',
    '在库': 'bg-green-100 text-green-800',
    '已发货': 'bg-blue-100 text-blue-800',
    '已使用': 'bg-gray-100 text-gray-800',
    '已退货': 'bg-red-100 text-red-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('zh-CN')
}

async function loadDongles() {
  loading.value = true
  try {
    const params = { skip: skip.value, limit: limit.value }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getDongles(params)
    dongles.value = res.data.items
    total.value = res.data.total
  } catch (e) {
    showNotification(e._userMessage || '加载软件锁列表失败')
  } finally {
    loading.value = false
  }
}

async function handleSync() {
  syncing.value = true
  try {
    const payload = {
      dongle_id: syncForm.dongle_id,
      version: syncForm.version,
      features: syncForm.featuresStr ? syncForm.featuresStr.split(',').map(s => s.trim()).filter(Boolean) : [],
      expiry_date: syncForm.expiry_date ? new Date(syncForm.expiry_date).toISOString() : new Date().toISOString(),
    }
    await syncDongle(payload)
    showSyncModal.value = false
    showNotification('软件锁授权信息同步成功', 'success')
    Object.assign(syncForm, { dongle_id: '', version: '', featuresStr: '', expiry_date: '' })
    await loadDongles()
  } catch (e) {
    showNotification(e._userMessage || '同步失败')
  } finally {
    syncing.value = false
  }
}

onMounted(loadDongles)
</script>
