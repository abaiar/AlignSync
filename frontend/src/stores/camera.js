import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCameras } from '@/api/camera'

export const useCameraStore = defineStore('camera', () => {
  const list = ref([])
  const total = ref(0)
  const loading = ref(false)

  async function fetch(params) {
    loading.value = true
    try {
      const res = await getCameras(params)
      list.value = res.data.items
      total.value = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  return { list, total, loading, fetch }
})
