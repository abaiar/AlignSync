<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">设备登记</h1>

    <div v-if="notification" :class="[
      'mb-4 p-4 rounded-lg text-sm',
      notification.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
    ]">
      {{ notification.message }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">登记定位仪设备</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">整机SN</label>
            <input
              v-model="form.device_sn"
              type="text"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="输入整机序列号"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">软件锁SN</label>
            <input
              v-model="form.dongle_sn"
              type="text"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="输入绑定的软件锁SN"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">
                相机绑定
                <span class="text-red-500 text-xs">（至少2个，位置不可重复）</span>
              </label>
              <button
                @click="addCamera"
                class="text-xs text-green-600 hover:text-green-800 font-medium"
              >+ 添加相机</button>
            </div>

            <div v-for="(cam, idx) in form.cameras" :key="idx" class="flex space-x-2 mb-2 items-start">
              <div class="flex-1">
                <input
                  v-model="cam.camera_sn"
                  type="text"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="相机SN"
                />
              </div>
              <div class="w-28">
                <select
                  v-model="cam.position"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">选择位置</option>
                  <option value="左">左</option>
                  <option value="右">右</option>
                  <option value="前">前</option>
                  <option value="后">后</option>
                </select>
              </div>
              <button
                v-if="form.cameras.length > 2"
                @click="form.cameras.splice(idx, 1)"
                class="text-red-400 hover:text-red-600 text-sm px-2 py-2"
              >✕</button>
            </div>

            <div v-if="cameraErrors.length" class="mt-2">
              <p v-for="err in cameraErrors" :key="err" class="text-xs text-red-500">{{ err }}</p>
            </div>
          </div>

          <div class="pt-4">
            <button
              @click="handleSubmit"
              :disabled="submitting || cameraErrors.length > 0"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {{ submitting ? '提交中...' : '提交设备登记' }}
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-700">已登记设备</h2>
        </div>

        <div v-if="loading" class="p-12 text-center text-gray-400">加载中...</div>

        <div v-else-if="devices.length === 0" class="p-12 text-center text-gray-400">
          暂无已登记设备
        </div>

        <div v-else class="divide-y divide-gray-200">
          <div v-for="device in devices" :key="device.id" class="px-6 py-4 hover:bg-gray-50">
            <div class="flex items-center justify-between mb-2">
              <span class="font-mono text-sm font-medium text-gray-900">{{ device.device_sn }}</span>
              <span :class="deviceStatusClass(device.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                {{ device.status }}
              </span>
            </div>
            <div class="text-xs text-gray-500 space-y-1">
              <p>软件锁: <span class="font-mono">{{ device.dongle_sn }}</span></p>
              <p>相机: {{ device.cameras?.map(c => `${c.camera_sn}(${c.position})`).join(', ') }}</p>
              <p v-if="device.authorization_code" class="text-green-600">
                授权号: <span class="font-mono">{{ device.authorization_code }}</span>
              </p>
              <p>登记时间: {{ formatDate(device.created_at) }}</p>
            </div>
            <button
              @click="handleTrace(device.device_sn)"
              class="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >查看追溯</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showTraceModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">设备追溯信息</h3>
        <div v-if="traceLoading" class="text-center text-gray-400 py-8">加载中...</div>
        <div v-else-if="traceData" class="space-y-4 text-sm">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-gray-500">整机SN</span>
              <p class="font-mono font-medium">{{ traceData.device_sn }}</p>
            </div>
            <div>
              <span class="text-gray-500">授权号</span>
              <p class="font-mono font-medium text-green-600">{{ traceData.authorization_code || '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500">软件锁SN</span>
              <p class="font-mono">{{ traceData.dongle_sn }}</p>
            </div>
            <div>
              <span class="text-gray-500">软件版本</span>
              <p>{{ traceData.dongle_version || '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500">采购日期</span>
              <p>{{ formatDate(traceData.purchase_date) }}</p>
            </div>
            <div>
              <span class="text-gray-500">组装人员</span>
              <p>{{ traceData.assembler || '-' }}</p>
            </div>
          </div>
          <div>
            <span class="text-gray-500">相机详情</span>
            <div v-for="(cam, idx) in traceData.cameras" :key="idx" class="mt-2 p-3 bg-gray-50 rounded-md">
              <p class="font-mono font-medium">{{ cam.camera_sn || cam.sn }}</p>
              <p class="text-xs text-gray-400 mt-1">位置: {{ cam.position }}</p>
              <p class="text-xs text-gray-400 mt-1">型号: {{ cam.model }}</p>
              <p class="text-xs text-gray-400 mt-1">标定参数: {{ JSON.stringify(cam.intrinsic_params || cam.calibration || {}) }}</p>
            </div>
          </div>
        </div>
        <div class="flex justify-end mt-6">
          <button @click="showTraceModal = false" class="px-4 py-2 text-sm text-gray-600 border rounded-md hover:bg-gray-50">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { assembleDevice, getDevices, traceDevice } from '../api/device'

const form = reactive({
  device_sn: '',
  dongle_sn: '',
  cameras: [
    { camera_sn: '', position: '' },
    { camera_sn: '', position: '' },
  ],
})

const devices = ref([])
const loading = ref(false)
const submitting = ref(false)
const notification = ref(null)
const showTraceModal = ref(false)
const traceData = ref(null)
const traceLoading = ref(false)

function showNotification(message, type = 'error') {
  notification.value = { message, type }
  setTimeout(() => { notification.value = null }, 5000)
}

const cameraErrors = computed(() => {
  const errors = []
  if (form.cameras.length < 2) {
    errors.push('至少需要绑定2个相机')
  }
  const positions = form.cameras.map(c => c.position).filter(Boolean)
  const uniquePositions = new Set(positions)
  if (positions.length !== uniquePositions.size) {
    errors.push('相机安装位置不可重复')
  }
  const sns = form.cameras.map(c => c.camera_sn).filter(Boolean)
  const uniqueSns = new Set(sns)
  if (sns.length !== uniqueSns.size) {
    errors.push('相机SN不可重复')
  }
  return errors
})

function addCamera() {
  form.cameras.push({ camera_sn: '', position: '' })
}

function deviceStatusClass(status) {
  const map = {
    '已组装': 'bg-blue-100 text-blue-800',
    '已激活': 'bg-green-100 text-green-800',
    '使用中': 'bg-purple-100 text-purple-800',
    '已退役': 'bg-gray-100 text-gray-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('zh-CN')
}

async function loadDevices() {
  loading.value = true
  try {
    const res = await getDevices()
    devices.value = res.data.items
  } catch (e) {
    showNotification(e._userMessage || '加载设备列表失败')
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!form.device_sn || !form.dongle_sn) {
    showNotification('请填写整机SN和软件锁SN')
    return
  }
  if (form.cameras.some(c => !c.camera_sn || !c.position)) {
    showNotification('请完整填写所有相机的SN和安装位置')
    return
  }
  if (cameraErrors.value.length > 0) {
    showNotification(cameraErrors.value[0])
    return
  }

  submitting.value = true
  try {
    await assembleDevice({
      device_sn: form.device_sn,
      dongle_sn: form.dongle_sn,
      cameras: form.cameras,
    })
    showNotification('设备登记成功', 'success')
    Object.assign(form, {
      device_sn: '',
      dongle_sn: '',
      cameras: [
        { camera_sn: '', position: '' },
        { camera_sn: '', position: '' },
      ],
    })
    await loadDevices()
  } catch (e) {
    showNotification(e._userMessage || '设备登记失败')
  } finally {
    submitting.value = false
  }
}

async function handleTrace(deviceSn) {
  showTraceModal.value = true
  traceLoading.value = true
  traceData.value = null
  try {
    const res = await traceDevice(deviceSn)
    traceData.value = res.data
  } catch (e) {
    showNotification(e._userMessage || '获取追溯信息失败')
    showTraceModal.value = false
  } finally {
    traceLoading.value = false
  }
}

onMounted(loadDevices)
</script>
