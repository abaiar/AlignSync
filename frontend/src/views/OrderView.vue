<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">采购订单管理</h1>
      <button
        @click="openCreateModal"
        class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
      >
        新建订单
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
        <h2 class="text-lg font-semibold text-gray-700">订单列表</h2>
        <select
          v-model="statusFilter"
          @change="loadOrders"
          class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">全部状态</option>
          <option value="待确认">待确认</option>
          <option value="已确认">已确认</option>
          <option value="待收款">待收款</option>
          <option value="已收款">已收款</option>
          <option value="已发货">已发货</option>
          <option value="已完成">已完成</option>
          <option value="已取消">已取消</option>
        </select>
      </div>

      <div v-if="loading" class="p-12 text-center text-gray-400">加载中...</div>

      <div v-else-if="orders.length === 0" class="p-12 text-center text-gray-400">
        暂无订单数据，请点击"新建订单"按钮
      </div>

      <table v-else class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO编号</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">租户ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总额</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-mono text-gray-900">{{ order.po_number }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ order.tenant_id }}</td>
            <td class="px-6 py-4 text-sm text-gray-900 font-medium">¥{{ order.total_amount?.toFixed(2) }}</td>
            <td class="px-6 py-4">
              <span :class="statusClass(order.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                {{ order.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(order.created_at) }}</td>
            <td class="px-6 py-4 text-sm space-x-2">
              <button
                v-if="order.status === '待确认'"
                @click="openActionModal(order, 'confirm')"
                class="text-blue-600 hover:text-blue-800 font-medium"
              >确认订单</button>
              <button
                v-if="order.status === '已确认' || order.status === '待收款'"
                @click="openActionModal(order, 'pay')"
                class="text-green-600 hover:text-green-800 font-medium"
              >上传付款</button>
              <button
                v-if="order.status === '待收款'"
                @click="openActionModal(order, 'confirmPayment')"
                class="text-purple-600 hover:text-purple-800 font-medium"
              >确认收款</button>
              <button
                v-if="order.status === '已收款'"
                @click="openActionModal(order, 'ship')"
                class="text-amber-600 hover:text-amber-800 font-medium"
              >发货</button>
              <button
                v-if="order.status === '已发货'"
                @click="openActionModal(order, 'receive')"
                class="text-teal-600 hover:text-teal-800 font-medium"
              >确认收货</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="orders.length > 0" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <span class="text-sm text-gray-500">共 {{ total }} 条记录</span>
        <div class="flex space-x-2">
          <button @click="skip > 0 && (skip -= limit) && loadOrders()" :disabled="skip === 0" class="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50">上一页</button>
          <button @click="orders.length >= limit && (skip += limit) && loadOrders()" :disabled="orders.length < limit" class="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50">下一页</button>
        </div>
      </div>
    </div>

    <!-- 新建订单弹窗 -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">新建采购订单</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">租户ID（生产厂）</label>
            <input v-model.number="createForm.tenant_id" type="number" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="输入租户ID" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea v-model="createForm.remark" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" rows="2" placeholder="可选"></textarea>
          </div>
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">订单明细</label>
              <button @click="addCreateItem" class="text-xs text-amber-600 hover:text-amber-800 font-medium">+ 添加明细</button>
            </div>
            <div v-for="(item, idx) in createForm.items" :key="idx" class="flex space-x-2 mb-2">
              <input v-model="item.product_model" type="text" class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="产品型号" />
              <input v-model.number="item.quantity" type="number" class="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="数量" min="1" />
              <input v-model.number="item.unit_price" type="number" class="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="单价" min="0" step="0.01" />
              <button @click="createForm.items.splice(idx, 1)" class="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
            </div>
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button @click="showCreateModal = false" class="px-4 py-2 text-sm text-gray-600 border rounded-md hover:bg-gray-50">取消</button>
          <button @click="handleCreate" :disabled="submitting" class="px-4 py-2 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50">
            {{ submitting ? '提交中...' : '提交订单' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 状态操作弹窗 -->
    <div v-if="showActionModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ actionTitle }}</h3>

        <!-- 确认订单 -->
        <div v-if="actionType === 'confirm'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">确认意见</label>
            <textarea v-model="actionForm.opinion" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows="3" placeholder="可选"></textarea>
          </div>
        </div>

        <!-- 上传付款 -->
        <div v-if="actionType === 'pay'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">付款金额</label>
            <input v-model.number="actionForm.payment_amount" type="number" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" min="0" step="0.01" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">付款方式</label>
            <input v-model="actionForm.payment_method" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="如: 银行转账" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">付款凭证</label>
            <input v-model="actionForm.payment_voucher" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="截图URL或描述" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">付款备注</label>
            <textarea v-model="actionForm.payment_remark" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows="2" placeholder="可选"></textarea>
          </div>
        </div>

        <!-- 确认收款 -->
        <div v-if="actionType === 'confirmPayment'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea v-model="actionForm.remark" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows="2" placeholder="可选"></textarea>
          </div>
        </div>

        <!-- 发货 -->
        <div v-if="actionType === 'ship'" class="space-y-4">
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">发货相机SN</label>
              <button @click="actionForm.camera_items.push({ camera_sn: '' })" class="text-xs text-amber-600 hover:text-amber-800 font-medium">+ 添加相机</button>
            </div>
            <div v-for="(item, idx) in actionForm.camera_items" :key="idx" class="flex space-x-2 mb-2">
              <input v-model="item.camera_sn" type="text" class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="相机SN" />
              <button @click="actionForm.camera_items.splice(idx, 1)" class="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">发货软件锁ID</label>
              <button @click="actionForm.dongle_ids.push('')" class="text-xs text-amber-600 hover:text-amber-800 font-medium">+ 添加软件锁</button>
            </div>
            <div v-for="(id, idx) in actionForm.dongle_ids" :key="idx" class="flex space-x-2 mb-2">
              <input v-model="actionForm.dongle_ids[idx]" type="text" class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="软件锁ID" />
              <button @click="actionForm.dongle_ids.splice(idx, 1)" class="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">物流公司</label>
            <input v-model="actionForm.carrier" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="如: 顺丰" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">物流单号</label>
            <input v-model="actionForm.tracking_number" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="输入物流单号" />
          </div>
        </div>

        <!-- 确认收货 -->
        <div v-if="actionType === 'receive'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">收货备注</label>
            <textarea v-model="actionForm.remark" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows="2" placeholder="可选"></textarea>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button @click="showActionModal = false" class="px-4 py-2 text-sm text-gray-600 border rounded-md hover:bg-gray-50">取消</button>
          <button @click="handleAction" :disabled="submitting" class="px-4 py-2 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50">
            {{ submitting ? '处理中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { createOrder, getOrders, confirmOrder, payOrder, confirmPayment, shipOrder, receiveOrder } from '../api/order'

const orders = ref([])
const loading = ref(false)
const submitting = ref(false)
const total = ref(0)
const skip = ref(0)
const limit = ref(20)
const statusFilter = ref('')
const notification = ref(null)
const showCreateModal = ref(false)
const showActionModal = ref(false)
const currentOrder = ref(null)
const actionType = ref('')

const createForm = reactive({
  tenant_id: null,
  remark: '',
  items: [{ product_model: '', quantity: 1, unit_price: 0 }],
})

const actionForm = reactive({
  opinion: '',
  payment_amount: 0,
  payment_method: '',
  payment_voucher: '',
  payment_remark: '',
  remark: '',
  camera_items: [{ camera_sn: '' }],
  dongle_ids: [],
  tracking_number: '',
  carrier: '',
})

const actionTitleMap = {
  confirm: '确认采购订单',
  pay: '上传付款凭证',
  confirmPayment: '确认收款',
  ship: '订单发货',
  receive: '确认收货',
}

const actionTitle = ref('')

function showNotification(message, type = 'error') {
  notification.value = { message, type }
  setTimeout(() => { notification.value = null }, 5000)
}

function statusClass(status) {
  const map = {
    '待确认': 'bg-yellow-100 text-yellow-800',
    '已确认': 'bg-blue-100 text-blue-800',
    '待收款': 'bg-orange-100 text-orange-800',
    '已收款': 'bg-purple-100 text-purple-800',
    '已发货': 'bg-indigo-100 text-indigo-800',
    '已完成': 'bg-green-100 text-green-800',
    '已取消': 'bg-red-100 text-red-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('zh-CN')
}

function addCreateItem() {
  createForm.items.push({ product_model: '', quantity: 1, unit_price: 0 })
}

function openCreateModal() {
  Object.assign(createForm, { tenant_id: null, remark: '', items: [{ product_model: '', quantity: 1, unit_price: 0 }] })
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
    payment_voucher: '',
    payment_remark: '',
    remark: '',
    camera_items: [{ camera_sn: '' }],
    dongle_ids: [],
    tracking_number: '',
    carrier: '',
  })
  showActionModal.value = true
}

async function loadOrders() {
  loading.value = true
  try {
    const params = { skip: skip.value, limit: limit.value }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getOrders(params)
    orders.value = res.data.items
    total.value = res.data.total
  } catch (e) {
    showNotification(e._userMessage || '加载订单列表失败')
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  submitting.value = true
  try {
    await createOrder({
      tenant_id: createForm.tenant_id,
      items: createForm.items.filter(i => i.product_model),
      remark: createForm.remark || null,
    })
    showCreateModal.value = false
    showNotification('订单创建成功', 'success')
    await loadOrders()
  } catch (e) {
    showNotification(e._userMessage || '创建订单失败')
  } finally {
    submitting.value = false
  }
}

async function handleAction() {
  submitting.value = true
  try {
    const id = currentOrder.value.id
    switch (actionType.value) {
      case 'confirm':
        await confirmOrder(id, { opinion: actionForm.opinion || null })
        break
      case 'pay':
        await payOrder(id, {
          payment_amount: actionForm.payment_amount,
          payment_method: actionForm.payment_method || null,
          payment_voucher: actionForm.payment_voucher || null,
          payment_remark: actionForm.payment_remark || null,
        })
        break
      case 'confirmPayment':
        await confirmPayment(id, { confirmed: true, remark: actionForm.remark || null })
        break
      case 'ship':
        await shipOrder(id, {
          camera_items: actionForm.camera_items.filter(i => i.camera_sn),
          dongle_ids: actionForm.dongle_ids.filter(Boolean),
          tracking_number: actionForm.tracking_number,
          carrier: actionForm.carrier || null,
        })
        break
      case 'receive':
        await receiveOrder(id, { received: true, remark: actionForm.remark || null })
        break
    }
    showActionModal.value = false
    showNotification('操作成功', 'success')
    await loadOrders()
  } catch (e) {
    showNotification(e._userMessage || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadOrders)
</script>
