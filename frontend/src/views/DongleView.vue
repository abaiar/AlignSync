<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">软件锁管理</h1>
      <BaseButton variant="primary" icon="plus" @click="openSyncModal">同步授权信息</BaseButton>
    </div>

    <BaseCard title="软件锁列表" :padding="false">
      <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <BaseFilterBar>
          <div class="w-64">
            <BaseSearchInput v-model="keyword" placeholder="搜索 软件锁ID / 版本" />
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
        :data="filteredDongles"
        :loading="loading"
        row-key="id"
        @sort="onSort"
      >
        <template #col-dongle_id="{ row }">
          <span class="font-mono">{{ row.dongle_id }}</span>
        </template>
        <template #col-features="{ row }">
          <template v-if="row.features && row.features.length">
            <BaseBadge
              v-for="f in row.features"
              :key="f"
              :text="f"
              color="purple"
              class="mr-1 mb-1"
            />
          </template>
          <span v-else class="text-gray-400 dark:text-gray-500">-</span>
        </template>
        <template #col-status="{ row }">
          <BaseBadge :text="row.status" :color="statusColor(row.status)" />
        </template>
        <template #col-expiry_date="{ row }">
          {{ formatDate(row.expiry_date) }}
        </template>
        <template #col-created_at="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
        <template #empty>
          <BaseEmptyState
            icon="dongle"
            title="暂无软件锁数据"
            description="请点击「同步授权信息」按钮录入"
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

    <BaseModal v-model="showSyncModal" title="同步软件锁授权信息" size="md">
      <div class="space-y-4">
        <BaseInput
          v-model="syncForm.dongle_id"
          label="软件锁ID"
          placeholder="输入软件锁ID"
          required
          :error="errors.dongle_id"
        />
        <BaseInput
          v-model="syncForm.version"
          label="软件版本"
          placeholder="如: v3.2.1"
          required
          :error="errors.version"
        />
        <BaseInput
          v-model="syncForm.featuresStr"
          label="授权功能（逗号分隔）"
          placeholder="如: 3D定位,高级测量"
        />
        <BaseInput
          v-model="syncForm.expiry_date"
          label="授权到期日"
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
import { syncDongle, getDongles } from '@/api/dongle'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BasePagination from '@/components/base/BasePagination.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseSearchInput from '@/components/base/BaseSearchInput.vue'
import BaseFilterBar from '@/components/base/BaseFilterBar.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import { useToast } from '@/composables/useToast'
import { usePagination } from '@/composables/usePagination'
import { useFormValidation } from '@/composables/useFormValidation'

const toast = useToast()
const { page, pageSize, total, skip, setPage, setTotal } = usePagination({ pageSize: 20 })

const dongles = ref([])
const loading = ref(false)
const syncing = ref(false)
const keyword = ref('')
const statusFilter = ref('')
const showSyncModal = ref(false)
const sortKey = ref('')
const sortOrder = ref('')

const statusOptions = ['已授权', '在库', '已发货', '已使用', '已退货']

const columns = [
  { key: 'id', label: '内部ID' },
  { key: 'dongle_id', label: '软件锁ID', sortable: true },
  { key: 'version', label: '版本' },
  { key: 'features', label: '授权功能' },
  { key: 'status', label: '状态' },
  { key: 'expiry_date', label: '到期日' },
  { key: 'created_at', label: '入库时间' },
]

const syncForm = reactive({
  dongle_id: '',
  version: '',
  featuresStr: '',
  expiry_date: '',
})

const rules = {
  dongle_id: [(v) => !v && '请输入软件锁ID'],
  version: [(v) => !v && '请输入软件版本'],
}

const { errors, validate, clearErrors } = useFormValidation(syncForm, rules)

const filteredDongles = computed(() => {
  let list = dongles.value
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter((d) =>
      (d.dongle_id && d.dongle_id.toLowerCase().includes(kw)) ||
      (d.version && d.version.toLowerCase().includes(kw)),
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
    '已授权': 'purple',
    '在库': 'green',
    '已发货': 'blue',
    '已使用': 'gray',
    '已退货': 'red',
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
  loadDongles()
}

function openSyncModal() {
  Object.assign(syncForm, {
    dongle_id: '',
    version: '',
    featuresStr: '',
    expiry_date: '',
  })
  clearErrors()
  showSyncModal.value = true
}

async function loadDongles() {
  loading.value = true
  try {
    const params = { skip: skip.value, limit: pageSize }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getDongles(params)
    dongles.value = res.data.items
    setTotal(res.data.total)
  } catch (e) {
    toast.error(e._userMessage || '加载软件锁列表失败')
  } finally {
    loading.value = false
  }
}

async function handleSync() {
  if (!validate()) return
  syncing.value = true
  try {
    const payload = {
      dongle_id: syncForm.dongle_id,
      version: syncForm.version,
      features: syncForm.featuresStr
        ? syncForm.featuresStr.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      expiry_date: syncForm.expiry_date
        ? new Date(syncForm.expiry_date).toISOString()
        : new Date().toISOString(),
    }
    await syncDongle(payload)
    showSyncModal.value = false
    toast.success('软件锁授权信息同步成功')
    Object.assign(syncForm, {
      dongle_id: '',
      version: '',
      featuresStr: '',
      expiry_date: '',
    })
    clearErrors()
    await loadDongles()
  } catch (e) {
    toast.error(e._userMessage || '同步失败')
  } finally {
    syncing.value = false
  }
}

watch(statusFilter, () => {
  setPage(1)
  loadDongles()
})

onMounted(loadDongles)
</script>
