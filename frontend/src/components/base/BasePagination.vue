<template>
  <div class="flex items-center justify-between flex-wrap gap-3 px-4 py-3">
    <span class="text-sm text-gray-500 dark:text-gray-400">共 {{ total }} 条</span>
    <div class="flex items-center gap-1">
      <button
        class="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        :disabled="page <= 1"
        @click="go(page - 1)"
      >
        <BaseIcon name="chevron-left" :size="16" />
      </button>
      <button
        v-for="p in pages"
        :key="p"
        :class="[
          'min-w-[32px] px-2 py-1 text-sm border rounded-md transition-colors',
          p === page
            ? 'bg-blue-600 text-white border-blue-600'
            : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700',
        ]"
        @click="go(p)"
      >
        {{ p }}
      </button>
      <button
        class="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        :disabled="page >= totalPages"
        @click="go(page + 1)"
      >
        <BaseIcon name="chevron-right" :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
})

const emit = defineEmits(['update:page', 'change'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const pages = computed(() => {
  const total = totalPages.value
  const current = props.page
  const window = 5
  let start = Math.max(1, current - Math.floor(window / 2))
  let end = Math.min(total, start + window - 1)
  if (end - start + 1 < window) {
    start = Math.max(1, end - window + 1)
  }
  const arr = []
  for (let i = start; i <= end; i++) arr.push(i)
  return arr
})

function go(p) {
  if (p < 1 || p > totalPages.value || p === props.page) return
  emit('update:page', p)
  emit('change', p)
}
</script>
