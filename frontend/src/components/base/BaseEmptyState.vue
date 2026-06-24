<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="text-gray-300 dark:text-slate-600 mb-4">
      <BaseIcon :name="icon" :size="56" />
    </div>
    <h3 class="text-base font-medium text-gray-700 dark:text-gray-200 mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-gray-400 dark:text-gray-500 max-w-sm">{{ description }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>

<script setup>
import BaseIcon from './BaseIcon.vue'

defineProps({
  icon: { type: String, default: 'info' },
  title: { type: String, default: '暂无数据' },
  description: { type: String, default: '' },
})
</script>
