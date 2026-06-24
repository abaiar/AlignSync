<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">相机管理</h1>
      <BaseButton variant="primary" icon="upload" @click="openSyncModal">同步相机信息</BaseButton>
    </div>

    <BaseCard title="相机列表" :padding="false">
      <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <BaseFilterBar>
          <div class="w-64">
            <BaseSearchInput v-model="keyword" placeholder="搜索 SN / 型号" />
          </div>
          <div class="w-40">
            <BaseSelect
              v-model="statusFilter"
              :options="statusOptions"
              placeholder="全部状态"
            />
          </div>
        </BaseFilterBar>
      </div>

      <BaseTable
        :columns="columns"
        :data="filteredCameras"
        :loading="loading"
        row-key="id"
        @sort="onSort"
      >
        <template #col-sn="{ row }">
          <span class="font-mono">{{ row.sn }}</span>
        </template>
        <template #col-status="{ row }">
          <BaseBadge :text="row.status" :color="statusColor(row.status)" />
        </template>
        <template #col-calibration_date="{ row }">
          {{ formatDate(row.calibration_date) }}
        </template>
        <template #col-created_at="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
        <template #empty>
          <BaseEmptyState
            icon="camera"
            title="暂无相机数据"
            description="请点击「同步相机信息」按钮录入"
          />
        </template>
      </BaseTable>

      <template #footer>
        <BasePagination
          :total="total"
          :page="page"
          :page-size="pageSize"
          @change="onPageChange"
        />
      </template>
    </BaseCard>

    <BaseModal v-model="showSyncModal" title="同步相机信息" size="md">
      <div class="space-y-4">
        <BaseInput
          v-model="syncForm.sn"
          label="相机SN"
          placeholder="输入相机序列号"
          required
          :error="errors.sn"
        />
        <BaseInput
          v-model="syncForm.model"
          label="相机型号"
          placeholder="如: CAM-X100"
          required
          :error="errors.model"
        />
        <BaseTextarea
          v-model="syncForm.intrinsic_params"
          label="内参标定数据（JSON）"
          placeholder='{"fx": 1000, "fy": 1000, "cx": 640, "cy": 480}'
          :rows="3"
          :error="errors.intrinsic_params"
        />
        <BaseTextarea
          v-model="syncForm.extrinsic_params"
          label="外参标定数据（JSON）"
          placeholder='{"tx": 0, "ty": 0, "tz": 0}'
          :rows="3"
          :error="errors.extrinsic_params"
        />
        <BaseInput
          v-model="syncForm.calibration_date"
          label="标定日期"
          type="date"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="showSyncModal = false">取消</BaseButton>
          <BaseButton variant="primary" :loading="syncing" @click="handleSync">
            确认同步
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { syncCamera, getCameras } from '@/api/camera'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BasePagination from '@/components/base/BasePagination.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseSearchInput from '@/components/base/BaseSearchInput.vue'
import BaseFilterBar from '@/components/base/BaseFilterBar.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import { useToast } from '@/composables/useToast'
import { usePagination } from '@/composables/usePagination'
import { useFormValidation } from '@/composables/useFormValidation'

const toast = useToast()
const { page, pageSize, total, skip, setPage, setTotal } = usePagination({ pageSize: 20 })

const cameras = ref([])
const loading = ref(false)
const syncing = ref(false)
const keyword = ref('')
const statusFilter = ref('')
const showSyncModal = ref(false)
const sortKey = ref('')
const sortOrder = ref('')

const statusOptions = ['在库', '已发货', '已使用', '已退货', '返修中']

const columns = [
  { key: 'id', label: '内部ID' },
  { key: 'sn', label: 'SN', sortable: true },
  { key: 'model', label: '型号' },
  { key: 'status', label: '状态' },
  { key: 'calibration_date', label: '标定日期', sortable: true },
  { key: 'created_at', label: '入库时间' },
]

const syncForm = reactive({
  sn: '',
  model: '',
  intrinsic_params: '',
  extrinsic_params: '',
  calibration_date: '',
})

const rules = {
  sn: [(v) => !v && '请输入相机SN'],
  model: [(v) => !v && '请输入相机型号'],
  intrinsic_params: [(v) => {
    if (v && v.trim()) {
      try { JSON.parse(v) } catch { return '内参标定数据不是有效的 JSON' }
    }
    return false
  }],
  extrinsic_params: [(v) => {
    if (v && v.trim()) {
      try { JSON.parse(v) } catch { return '外参标定数据不是有效的 JSON' }
    }
    return false
  }],
}

const { errors, validate, clearErrors } = useFormValidation(syncForm, rules)

const filteredCameras = computed(() => {
  let list = cameras.value
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter((c) =>
      (c.sn && c.sn.toLowerCase().includes(kw)) ||
      (c.model && c.model.toLowerCase().includes(kw)),
    )
  }
  if (sortKey.value && sortOrder.value) {
    const key = sortKey.value
    const order = sortOrder.value === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      const va = a[key] ?? ''
      const vb = b[key] ?? ''
      if (va < vb) return -1 * order
      if (va > vb) return 1 * order
      return 0
    })
  }
  return list
})

function statusColor(status) {
  const map = {
    '在库': 'green',
    '已发货': 'blue',
    '已使用': 'gray',
    '已退货': 'red',
    '返修中': 'amber',
  }
  return map[status] || 'gray'
}

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('zh-CN')
}

function onSort({ key, order }) {
  sortKey.value = key
  sortOrder.value = order
}

function onPageChange(p) {
  setPage(p)
  loadCameras()
}

function openSyncModal() {
  Object.assign(syncForm, {
    sn: '',
    model: '',
    intrinsic_params: '',
    extrinsic_params: '',
    calibration_date: '',
  })
  clearErrors()
  showSyncModal.value = true
}

async function loadCameras() {
  loading.value = true
  try {
    const params = { skip: skip.value, limit: pageSize }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getCameras(params)
    cameras.value = res.data.items
    setTotal(res.data.total)
  } catch (e) {
    toast.error(e._userMessage || '加载相机列表失败')
  } finally {
    loading.value = false
  }
}

async function handleSync() {
  if (!validate()) return
  syncing.value = true
  try {
    let intrinsicParams = {}
    let extrinsicParams = {}
    if (syncForm.intrinsic_params && syncForm.intrinsic_params.trim()) {
      intrinsicParams = JSON.parse(syncForm.intrinsic_params)
    }
    if (syncForm.extrinsic_params && syncForm.extrinsic_params.trim()) {
      extrinsicParams = JSON.parse(syncForm.extrinsic_params)
    }
    const payload = {
      sn: syncForm.sn,
      model: syncForm.model,
      intrinsic_params: intrinsicParams,
      extrinsic_params: extrinsicParams,
      calibration_date: syncForm.calibration_date
        ? new Date(syncForm.calibration_date).toISOString()
        : new Date().toISOString(),
    }
    await syncCamera(payload)
    showSyncModal.value = false
    toast.success('相机信息同步成功')
    Object.assign(syncForm, {
      sn: '',
      model: '',
      intrinsic_params: '',
      extrinsic_params: '',
      calibration_date: '',
    })
    clearErrors()
    await loadCameras()
  } catch (e) {
    toast.error(e._userMessage || '同步失败')
  } finally {
    syncing.value = false
  }
}

watch(statusFilter, () => {
  setPage(1)
  loadCameras()
})

onMounted(loadCameras)
</script>
