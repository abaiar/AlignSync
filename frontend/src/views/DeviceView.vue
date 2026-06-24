<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">设备登记</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BaseCard title="登记定位仪设备">
        <div class="space-y-4">
          <BaseInput
            v-model="form.device_sn"
            label="整机SN"
            placeholder="输入整机序列号"
            required
            :error="deviceSnError"
          />

          <BaseInput
            v-model="form.dongle_sn"
            label="软件锁SN"
            placeholder="输入绑定的软件锁SN"
            required
            :error="dongleSnError"
          />

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                相机绑定
                <span class="text-red-500 text-xs">（至少2个，位置不可重复）</span>
              </label>
              <BaseButton variant="ghost" size="sm" icon="plus" @click="addCamera">
                添加相机
              </BaseButton>
            </div>

            <div v-for="(cam, idx) in form.cameras" :key="idx" class="flex items-start gap-2 mb-2">
              <div class="flex-1">
                <BaseInput
                  v-model="cam.camera_sn"
                  placeholder="相机SN"
                />
              </div>
              <div class="w-28">
                <BaseSelect
                  v-model="cam.position"
                  :options="positionOptions"
                  placeholder="选择位置"
                />
              </div>
              <BaseButton
                v-if="form.cameras.length > 2"
                variant="ghost"
                size="sm"
                icon="close"
                aria-label="移除相机"
                @click="form.cameras.splice(idx, 1)"
              />
            </div>

            <div v-if="cameraErrors.length" class="mt-2">
              <p v-for="err in cameraErrors" :key="err" class="text-xs text-red-500">{{ err }}</p>
            </div>
          </div>

          <div class="pt-2">
            <BaseButton
              variant="success"
              block
              :loading="submitting"
              :disabled="hasErrors"
              @click="handleSubmit"
            >
              提交设备登记
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="已登记设备" :padding="false">
        <div v-if="loading" class="p-5">
          <BaseSkeleton :lines="4" height="60px" />
        </div>

        <BaseEmptyState
          v-else-if="devices.length === 0"
          icon="device"
          title="暂无已登记设备"
        />

        <div v-else class="divide-y divide-gray-200 dark:divide-slate-700">
          <div
            v-for="device in devices"
            :key="device.id"
            class="px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{{ device.device_sn }}</span>
              <BaseBadge :text="device.status" :color="deviceStatusColor(device.status)" />
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>软件锁: <span class="font-mono">{{ device.dongle_sn }}</span></p>
              <p>相机: {{ device.cameras?.map(c => `${c.camera_sn}(${c.position})`).join(', ') }}</p>
              <p v-if="device.authorization_code" class="text-green-600 dark:text-green-400">
                授权号: <span class="font-mono">{{ device.authorization_code }}</span>
              </p>
              <p>登记时间: {{ formatDate(device.created_at) }}</p>
            </div>
            <BaseButton
              variant="ghost"
              size="sm"
              icon="trace"
              class="mt-2"
              @click="handleTrace(device.device_sn)"
            >
              查看追溯
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseModal v-model="showTraceModal" title="设备追溯信息" size="lg">
      <div v-if="traceLoading" class="py-4">
        <BaseSkeleton :lines="6" height="40px" />
      </div>

      <div v-else-if="traceData" class="space-y-4 text-sm">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-gray-500 dark:text-gray-400">整机SN</span>
            <p class="font-mono font-medium text-gray-800 dark:text-gray-100">{{ traceData.device_sn }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">授权号</span>
            <p class="font-mono font-medium text-green-600 dark:text-green-400">{{ traceData.authorization_code || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">软件锁SN</span>
            <p class="font-mono text-gray-800 dark:text-gray-100">{{ traceData.dongle_sn }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">软件版本</span>
            <p class="text-gray-800 dark:text-gray-100">{{ traceData.dongle_version || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">采购日期</span>
            <p class="text-gray-800 dark:text-gray-100">{{ formatDate(traceData.purchase_date) }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">组装人员</span>
            <p class="text-gray-800 dark:text-gray-100">{{ traceData.assembler || '-' }}</p>
          </div>
        </div>

        <div>
          <span class="text-gray-500 dark:text-gray-400">相机详情</span>
          <div
            v-for="(cam, idx) in (traceData.cameras || [])"
            :key="idx"
            class="mt-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md"
          >
            <p class="font-mono font-medium text-gray-800 dark:text-gray-100">{{ cam.camera_sn || cam.sn }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">位置: {{ cam.position }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">型号: {{ cam.model }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">标定参数: {{ JSON.stringify(cam.intrinsic_params || cam.calibration || {}) }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="default" @click="showTraceModal = false">关闭</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { assembleDevice, getDevices, traceDevice } from '@/api/device'
import { useToast } from '@/composables/useToast'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'

const toast = useToast()

const form = reactive({
  device_sn: '',
  dongle_sn: '',
  cameras: [
    { camera_sn: '', position: '' },
    { camera_sn: '', position: '' },
  ],
})

const positionOptions = ['左', '右', '前', '后']

const devices = ref([])
const loading = ref(false)
const submitting = ref(false)
const showTraceModal = ref(false)
const traceData = ref(null)
const traceLoading = ref(false)

const deviceSnError = computed(() => (!form.device_sn ? '请填写整机SN' : ''))
const dongleSnError = computed(() => (!form.dongle_sn ? '请填写软件锁SN' : ''))

const cameraErrors = computed(() => {
  const errors = []
  if (form.cameras.length < 2) {
    errors.push('至少需要绑定2个相机')
  }
  if (form.cameras.some(c => !c.camera_sn || !c.position)) {
    errors.push('请完整填写所有相机的SN和安装位置')
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

const hasErrors = computed(
  () => !!deviceSnError.value || !!dongleSnError.value || cameraErrors.value.length > 0,
)

function addCamera() {
  form.cameras.push({ camera_sn: '', position: '' })
}

function deviceStatusColor(status) {
  const map = {
    '已组装': 'blue',
    '已激活': 'green',
    '使用中': 'purple',
    '已退役': 'gray',
  }
  return map[status] || 'gray'
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
    toast.error(e._userMessage || '加载设备列表失败')
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (hasErrors.value) {
    toast.error('请完整填写表单')
    return
  }
  submitting.value = true
  try {
    await assembleDevice({
      device_sn: form.device_sn,
      dongle_sn: form.dongle_sn,
      cameras: form.cameras,
    })
    toast.success('设备登记成功')
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
    toast.error(e._userMessage || '设备登记失败')
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
    toast.error(e._userMessage || '获取追溯信息失败')
    showTraceModal.value = false
  } finally {
    traceLoading.value = false
  }
}

onMounted(loadDevices)
</script>
