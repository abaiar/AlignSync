<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">采购订单管理</h1>
      <BaseButton variant="warning" icon="plus" @click="openCreateModal">新建订单</BaseButton>
    </div>

    <!-- Filter bar -->
    <div class="mb-4">
      <BaseFilterBar>
        <div class="w-64">
          <BaseSearchInput v-model="searchQuery" placeholder="搜索PO编号" />
        </div>
        <div class="w-40">
          <BaseSelect v-model="statusFilter" placeholder="全部状态" :options="statusOptions" />
        </div>
      </BaseFilterBar>
    </div>

    <!-- Table -->
    <BaseCard title="订单列表" :padding="false">
      <BaseTable
        :columns="columns"
        :data="displayOrders"
        :loading="loading"
        row-key="id"
        @sort="handleSort"
      >
        <template #col-po_number="{ row }">
          <span class="font-mono text-gray-900 dark:text-gray-100">{{ row.po_number }}</span>
        </template>
        <template #col-total_amount="{ row }">
          <span class="font-medium text-gray-900 dark:text-gray-100">¥{{ (row.total_amount ?? 0).toFixed(2) }}</span>
        </template>
        <template #col-status="{ row }">
          <BaseBadge :text="row.status" :color="statusColorMap[row.status] || 'gray'" />
        </template>
        <template #col-created_at="{ row }">
          <span class="text-gray-600 dark:text-gray-300">{{ formatDate(row.created_at) }}</span>
        </template>
        <template #col-actions="{ row }">
          <div class="flex items-center gap-2">
            <BaseButton
              v-if="row.status === '待确认'"
              variant="primary"
              size="sm"
              @click="openActionModal(row, 'confirm')"
            >确认订单</BaseButton>
            <BaseButton
              v-if="row.status === '已确认' || row.status === '待收款'"
              variant="success"
              size="sm"
              @click="openActionModal(row, 'pay')"
            >上传付款</BaseButton>
            <BaseButton
              v-if="row.status === '待收款'"
              variant="default"
              size="sm"
              @click="handleConfirmPayment(row)"
            >确认收款</BaseButton>
            <BaseButton
              v-if="row.status === '已收款'"
              variant="warning"
              size="sm"
              @click="openActionModal(row, 'ship')"
            >发货</BaseButton>
            <BaseButton
              v-if="row.status === '已发货'"
              variant="default"
              size="sm"
              @click="handleReceive(row)"
            >确认收货</BaseButton>
          </div>
        </template>
        <template #empty>
          <BaseEmptyState
            icon="order"
            :title="emptyTitle"
            :description="emptyDescription"
          />
        </template>
      </BaseTable>
      <div v-if="total > 0" class="border-t border-gray-200 dark:border-slate-700">
        <BasePagination
          :total="total"
          :page="page"
          :page-size="pageSize"
          @change="onPageChange"
        />
      </div>
    </BaseCard>

    <!-- Create order modal -->
    <BaseModal v-model="showCreateModal" title="新建采购订单" size="lg">
      <div class="space-y-4">
        <BaseInput
          v-model="createForm.tenant_id"
          label="租户ID（生产厂）"
          type="number"
          placeholder="输入租户ID"
          required
          :error="errors.tenant_id"
        />
        <BaseTextarea v-model="createForm.remark" label="备注" placeholder="可选" :rows="2" />
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">订单明细</label>
            <BaseButton variant="ghost" size="sm" icon="plus" @click="addCreateItem">添加明细</BaseButton>
          </div>
          <div v-for="(item, idx) in createForm.items" :key="idx" class="flex items-center gap-2 mb-2">
            <div class="flex-1">
              <BaseInput v-model="item.product_model" placeholder="产品型号" />
            </div>
            <div class="w-20">
              <BaseInput v-model="item.quantity" type="number" placeholder="数量" />
            </div>
            <div class="w-24">
              <BaseInput v-model="item.unit_price" type="number" placeholder="单价" />
            </div>
            <BaseButton variant="ghost" size="sm" icon="close" @click="createForm.items.splice(idx, 1)" />
          </div>
          <p v-if="errors.items" class="mt-1 text-xs text-red-500">{{ errors.items }}</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="default" @click="showCreateModal = false">取消</BaseButton>
          <BaseButton variant="warning" :loading="submitting" @click="handleCreate">提交订单</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Action modal -->
    <BaseModal v-model="showActionModal" :title="actionTitle" size="md">
      <!-- 确认采购订单 -->
      <div v-if="actionType === 'confirm'" class="space-y-4">
        <BaseTextarea v-model="actionForm.opinion" label="确认意见" placeholder="可选" :rows="3" />
      </div>

      <!-- 上传付款凭证 -->
      <div v-else-if="actionType === 'pay'" class="space-y-4">
        <BaseInput
          v-model="actionForm.payment_amount"
          label="付款金额"
          type="number"
          required
        />
        <BaseInput v-model="actionForm.payment_method" label="付款方式" placeholder="如: 银行转账" />
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">付款凭证</label>
          <label
            class="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-md px-3 py-4 text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:border-amber-400 hover:text-amber-600 transition-colors"
          >
            <BaseIcon name="upload" :size="18" />
            <span>{{ voucherFile ? voucherFile.name : '点击上传付款凭证图片' }}</span>
            <input type="file" accept="image/*" class="hidden" @change="onVoucherSelect" />
          </label>
          <div v-if="voucherPreview" class="mt-2">
            <img
              :src="voucherPreview"
              alt="凭证预览"
              class="max-h-40 rounded-md border border-gray-200 dark:border-slate-600"
            />
          </div>
        </div>
        <BaseTextarea v-model="actionForm.payment_remark" label="付款备注" placeholder="可选" :rows="2" />
      </div>

      <!-- 订单发货 -->
      <div v-else-if="actionType === 'ship'" class="space-y-4">
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">发货相机SN</label>
            <BaseButton variant="ghost" size="sm" icon="plus" @click="actionForm.camera_items.push({ camera_sn: '' })">添加相机</BaseButton>
          </div>
          <div v-for="(item, idx) in actionForm.camera_items" :key="`cam-${idx}`" class="flex items-center gap-2 mb-2">
            <div class="flex-1">
              <BaseInput v-model="item.camera_sn" placeholder="相机SN" />
            </div>
            <BaseButton variant="ghost" size="sm" icon="close" @click="actionForm.camera_items.splice(idx, 1)" />
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">发货软件锁ID</label>
            <BaseButton variant="ghost" size="sm" icon="plus" @click="actionForm.dongle_ids.push('')">添加软件锁</BaseButton>
          </div>
          <div v-for="(id, idx) in actionForm.dongle_ids" :key="`dgl-${idx}`" class="flex items-center gap-2 mb-2">
            <div class="flex-1">
              <BaseInput v-model="actionForm.dongle_ids[idx]" placeholder="软件锁ID" />
            </div>
            <BaseButton variant="ghost" size="sm" icon="close" @click="actionForm.dongle_ids.splice(idx, 1)" />
          </div>
        </div>
        <BaseInput v-model="actionForm.carrier" label="物流公司" placeholder="如: 顺丰" />
        <BaseInput v-model="actionForm.tracking_number" label="物流单号" placeholder="输入物流单号" />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="default" @click="showActionModal = false">取消</BaseButton>
          <BaseButton variant="warning" :loading="submitting" @click="handleAction">确认</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  createOrder,
  getOrders,
  confirmOrder,
  payOrder,
  confirmPayment,
  shipOrder,
  receiveOrder,
  uploadVoucher,
} from '@/api/order'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { usePagination } from '@/composables/usePagination'
import { useFormValidation } from '@/composables/useFormValidation'
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
import BaseIcon from '@/components/base/BaseIcon.vue'

const toast = useToast()
const { confirm } = useConfirm()
const { page, pageSize, total, skip, setPage, setTotal } = usePagination({ pageSize: 20 })

const orders = ref([])
const loading = ref(false)
const submitting = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const sortKey = ref('')
const sortOrder = ref('')

const showCreateModal = ref(false)
const showActionModal = ref(false)
const currentOrder = ref(null)
const actionType = ref('')
const actionTitle = ref('')
const voucherFile = ref(null)
const voucherPreview = ref(null)

const statusColorMap = {
  待确认: 'amber',
  已确认: 'blue',
  待收款: 'orange',
  已收款: 'purple',
  已发货: 'indigo',
  已完成: 'green',
  已取消: 'red',
}

const statusOptions = [
  { label: '待确认', value: '待确认' },
  { label: '已确认', value: '已确认' },
  { label: '待收款', value: '待收款' },
  { label: '已收款', value: '已收款' },
  { label: '已发货', value: '已发货' },
  { label: '已完成', value: '已完成' },
  { label: '已取消', value: '已取消' },
]

const actionTitleMap = {
  confirm: '确认采购订单',
  pay: '上传付款凭证',
  ship: '订单发货',
}

const columns = [
  { key: 'po_number', label: 'PO编号' },
  { key: 'tenant_id', label: '租户ID' },
  { key: 'total_amount', label: '总额', sortable: true },
  { key: 'status', label: '状态' },
  { key: 'created_at', label: '创建时间', sortable: true },
  { key: 'actions', label: '操作' },
]

const createForm = reactive({
  tenant_id: null,
  remark: '',
  items: [{ product_model: '', quantity: 1, unit_price: 0 }],
})

const actionForm = reactive({
  opinion: '',
  payment_amount: 0,
  payment_method: '',
  payment_remark: '',
  camera_items: [{ camera_sn: '' }],
  dongle_ids: [],
  tracking_number: '',
  carrier: '',
})

const { errors, validate, clearErrors } = useFormValidation(createForm, {
  tenant_id: [(v) => (v === null || v === '' || v === undefined) && '请输入租户ID'],
  items: [(v) => (!v || !v.some((i) => i.product_model)) && '至少添加一条明细并填写产品型号'],
})

const displayOrders = computed(() => {
  let result = [...orders.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((o) => o.po_number?.toLowerCase().includes(q))
  }
  if (sortKey.value && sortOrder.value) {
    result.sort((a, b) => {
      let av = a[sortKey.value]
      let bv = b[sortKey.value]
      if (sortKey.value === 'total_amount') {
        av = Number(av) || 0
        bv = Number(bv) || 0
      } else if (sortKey.value === 'created_at') {
        av = av ? new Date(av).getTime() : 0
        bv = bv ? new Date(bv).getTime() : 0
      }
      if (av < bv) return sortOrder.value === 'asc' ? -1 : 1
      if (av > bv) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    })
  }
  return result
})

const emptyTitle = computed(() =>
  searchQuery.value ? '未找到匹配的订单' : '暂无订单数据',
)

const emptyDescription = computed(() =>
  searchQuery.value ? '请尝试其他PO编号' : '请点击“新建订单”按钮创建',
)

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('zh-CN')
}

function handleSort({ key, order }) {
  sortKey.value = key
  sortOrder.value = order
}

function addCreateItem() {
  createForm.items.push({ product_model: '', quantity: 1, unit_price: 0 })
}

function openCreateModal() {
  Object.assign(createForm, {
    tenant_id: null,
    remark: '',
    items: [{ product_model: '', quantity: 1, unit_price: 0 }],
  })
  clearErrors()
  showCreateModal.value = true
}

function openActionModal(order, type) {
  currentOrder.value = order
  actionType.value = type
  actionTitle.value = actionTitleMap[type]
  Object.assign(actionForm, {
    opinion: '',
    payment_amount: order.total_amount || 0,
    payment_method: '',
    payment_remark: '',
    camera_items: [{ camera_sn: '' }],
    dongle_ids: [],
    tracking_number: '',
    carrier: '',
  })
  voucherFile.value = null
  if (voucherPreview.value) {
    URL.revokeObjectURL(voucherPreview.value)
    voucherPreview.value = null
  }
  showActionModal.value = true
}

function onVoucherSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (voucherPreview.value) URL.revokeObjectURL(voucherPreview.value)
  voucherFile.value = file
  voucherPreview.value = URL.createObjectURL(file)
}

function onPageChange(p) {
  setPage(p)
  loadOrders()
}

async function loadOrders() {
  loading.value = true
  try {
    const params = { skip: skip.value, limit: pageSize }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getOrders(params)
    orders.value = res.data.items
    setTotal(res.data.total)
  } catch (e) {
    toast.error(e._userMessage || '加载订单列表失败')
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!validate()) return
  submitting.value = true
  try {
    const filtered = createForm.items
      .filter((i) => i.product_model)
      .map((i) => ({
        product_model: i.product_model,
        quantity: Number(i.quantity) || 0,
        unit_price: Number(i.unit_price) || 0,
      }))
    await createOrder({
      tenant_id: Number(createForm.tenant_id),
      items: filtered,
      remark: createForm.remark || null,
    })
    showCreateModal.value = false
    toast.success('订单创建成功')
    await loadOrders()
  } catch (e) {
    toast.error(e._userMessage || '创建订单失败')
  } finally {
    submitting.value = false
  }
}

async function handleAction() {
  submitting.value = true
  try {
    const id = currentOrder.value.id
    if (actionType.value === 'confirm') {
      await confirmOrder(id, { opinion: actionForm.opinion || null })
    } else if (actionType.value === 'pay') {
      let voucherUrl = null
      if (voucherFile.value) {
        const res = await uploadVoucher(id, voucherFile.value)
        voucherUrl = res.data.voucher_url
      }
      await payOrder(id, {
        payment_amount: Number(actionForm.payment_amount),
        payment_method: actionForm.payment_method || null,
        payment_voucher: voucherUrl,
        payment_remark: actionForm.payment_remark || null,
      })
    } else if (actionType.value === 'ship') {
      await shipOrder(id, {
        camera_items: actionForm.camera_items.filter((i) => i.camera_sn),
        dongle_ids: actionForm.dongle_ids.filter(Boolean),
        tracking_number: actionForm.tracking_number,
        carrier: actionForm.carrier || null,
      })
    }
    showActionModal.value = false
    toast.success('操作成功')
    await loadOrders()
  } catch (e) {
    toast.error(e._userMessage || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleConfirmPayment(order) {
  const ok = await confirm({
    title: '确认收款',
    content: `确认订单 ${order.po_number} 已收到付款？`,
    variant: 'primary',
  })
  if (!ok) return
  try {
    await confirmPayment(order.id, { confirmed: true, remark: null })
    toast.success('操作成功')
    await loadOrders()
  } catch (e) {
    toast.error(e._userMessage || '操作失败')
  }
}

async function handleReceive(order) {
  const ok = await confirm({
    title: '确认收货',
    content: `确认订单 ${order.po_number} 已收到货物？`,
    variant: 'primary',
  })
  if (!ok) return
  try {
    await receiveOrder(order.id, { received: true, remark: null })
    toast.success('操作成功')
    await loadOrders()
  } catch (e) {
    toast.error(e._userMessage || '操作失败')
  }
}

watch(statusFilter, () => {
  page.value = 1
  loadOrders()
})

watch(showActionModal, (val) => {
  if (!val && voucherPreview.value) {
    URL.revokeObjectURL(voucherPreview.value)
    voucherPreview.value = null
    voucherFile.value = null
  }
})

onBeforeUnmount(() => {
  if (voucherPreview.value) URL.revokeObjectURL(voucherPreview.value)
})

onMounted(loadOrders)
</script>
