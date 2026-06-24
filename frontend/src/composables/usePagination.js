import { ref, computed } from 'vue'

export function usePagination({ pageSize = 20 } = {}) {
  const page = ref(1)
  const total = ref(0)

  const skip = computed(() => (page.value - 1) * pageSize)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

  function setPage(p) {
    if (p < 1 || p > totalPages.value) return
    page.value = p
  }

  function setTotal(t) {
    total.value = t
    if (page.value > totalPages.value) page.value = totalPages.value
  }

  return { page, pageSize, total, skip, totalPages, setPage, setTotal }
}
