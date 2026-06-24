import { ref, shallowRef } from 'vue'

export function useAsync(fn) {
  const data = shallowRef(null)
  const loading = ref(false)
  const error = ref(null)

  async function run(...args) {
    loading.value = true
    error.value = null
    try {
      const result = await fn(...args)
      data.value = result
      return result
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, run }
}
