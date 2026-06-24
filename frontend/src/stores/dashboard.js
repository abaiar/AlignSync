import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDashboardStats } from '@/api/dashboard'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref(null)
  const loading = ref(false)

  async function fetchStats() {
    loading.value = true
    try {
      const res = await getDashboardStats()
      stats.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  return { stats, loading, fetchStats }
})
