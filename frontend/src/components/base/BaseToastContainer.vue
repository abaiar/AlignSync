<template>
  <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'flex items-start gap-3 p-4 rounded-lg shadow-lg border',
          typeClasses(toast.type),
        ]"
        role="alert"
      >
        <BaseIcon :name="iconFor(toast.type)" :size="18" class="shrink-0 mt-0.5" />
        <p class="flex-1 text-sm">{{ toast.message }}</p>
        <button
          class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="关闭"
          @click="remove(toast.id)"
        >
          <BaseIcon name="close" :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import BaseIcon from './BaseIcon.vue'
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

function iconFor(type) {
  const map = { success: 'success', error: 'error', warning: 'warning', info: 'info' }
  return map[type] || 'info'
}

function typeClasses(type) {
  const map = {
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800',
  }
  return map[type] || map.info
}
</script>
