<template>
  <div class="w-full overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 dark:bg-slate-700/50">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="col.width ? { width: col.width } : {}"
            :class="[
              'px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap',
              col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
              col.sortable ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : '',
            ]"
            @click="col.sortable && handleSort(col.key)"
          >
            <span class="inline-flex items-center gap-1">
              {{ col.label }}
              <template v-if="col.sortable">
                <BaseIcon
                  v-if="sortKey === col.key && sortOrder === 'asc'"
                  name="sort-asc"
                  :size="14"
                  class="text-blue-500"
                />
                <BaseIcon
                  v-else-if="sortKey === col.key && sortOrder === 'desc'"
                  name="sort-desc"
                  :size="14"
                  class="text-blue-500"
                />
                <BaseIcon v-else name="sort-asc" :size="14" class="opacity-30" />
              </template>
            </span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
        <template v-if="loading">
          <tr v-for="i in 5" :key="`sk-${i}`">
            <td v-for="col in columns" :key="col.key" class="px-4 py-3">
              <BaseSkeleton height="14px" />
            </td>
          </tr>
        </template>
        <template v-else-if="data.length === 0">
          <tr>
            <td :colspan="columns.length" class="px-4 py-12">
              <slot name="empty">
                <BaseEmptyState icon="info" title="暂无数据" />
              </slot>
            </td>
          </tr>
        </template>
        <template v-else>
          <tr
            v-for="row in data"
            :key="getRowKey(row)"
            class="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-4 py-3 text-gray-700 dark:text-gray-200 whitespace-nowrap',
                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
              ]"
            >
              <slot :name="`col-${col.key}`" :row="row">
                {{ col.formatter ? col.formatter(row[col.key], row) : (row[col.key] ?? '-') }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseIcon from './BaseIcon.vue'
import BaseSkeleton from './BaseSkeleton.vue'
import BaseEmptyState from './BaseEmptyState.vue'

const props = defineProps({
  columns: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  rowKey: { type: [String, Function], default: 'id' },
})

const emit = defineEmits(['sort'])

const sortKey = ref('')
const sortOrder = ref('')

function getRowKey(row) {
  if (typeof props.rowKey === 'function') return props.rowKey(row)
  return row[props.rowKey] ?? JSON.stringify(row)
}

function handleSort(key) {
  if (sortKey.value !== key) {
    sortKey.value = key
    sortOrder.value = 'asc'
  } else if (sortOrder.value === 'asc') {
    sortOrder.value = 'desc'
  } else {
    sortKey.value = ''
    sortOrder.value = ''
  }
  emit('sort', { key: sortKey.value, order: sortOrder.value })
}
</script>
