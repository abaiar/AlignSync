import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDevices } from '@/api/device'

export const useDeviceStore = defineStore('device', () => {
  const list = ref([])
  const loading = ref(false)

  async function fetch(params) {
    loading.value = true
    try {
      const res = await getDevices(params)
      list.value = res.data.items
      return res.data
    } finally {
      loading.value = false
    }
  }

  return { list, loading, fetch }
})
