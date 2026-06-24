import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getOrders } from '@/api/order'

export const useOrderStore = defineStore('order', () => {
  const list = ref([])
  const total = ref(0)
  const loading = ref(false)

  async function fetch(params) {
    loading.value = true
    try {
      const res = await getOrders(params)
      list.value = res.data.items
      total.value = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  return { list, total, loading, fetch }
})
