<template>
  <nav class="flex items-center text-sm" aria-label="面包屑">
    <ol class="flex items-center flex-wrap gap-1">
      <li v-for="(item, idx) in items" :key="idx" class="flex items-center">
        <router-link
          v-if="item.to && idx < items.length - 1"
          :to="item.to"
          class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {{ item.label }}
        </router-link>
        <span v-else class="text-gray-700 dark:text-gray-200 font-medium">{{ item.label }}</span>
        <BaseIcon
          v-if="idx < items.length - 1"
          name="chevron-right"
          :size="14"
          class="mx-1 text-gray-300 dark:text-slate-600"
        />
      </li>
    </ol>
  </nav>
</template>

<script setup>
import BaseIcon from './BaseIcon.vue'

defineProps({
  items: { type: Array, default: () => [] },
})
</script>
