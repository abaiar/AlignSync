<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
      sizeClasses,
      variantClasses,
      block ? 'w-full' : '',
    ]"
    @click="emit('click', $event)"
  >
    <svg
      v-if="loading"
      class="animate-spin"
      :width="iconSize"
      :height="iconSize"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <BaseIcon v-else-if="icon" :name="icon" :size="iconSize" />
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  variant: { type: String, default: 'default' },
  size: { type: String, default: 'md' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  icon: { type: String, default: '' },
  block: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
})

const emit = defineEmits(['click'])

const sizeClasses = computed(() => {
  const map = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  return map[props.size] || map.md
})

const iconSize = computed(() => {
  const map = { sm: 14, md: 16, lg: 18 }
  return map[props.size] || 16
})

const variantClasses = computed(() => {
  const map = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700',
    success:
      'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700',
    warning:
      'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 dark:bg-amber-500 dark:hover:bg-amber-600',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700',
    ghost:
      'text-gray-700 hover:bg-gray-100 focus:ring-gray-300 dark:text-gray-200 dark:hover:bg-slate-700',
    default:
      'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-700',
  }
  return map[props.variant] || map.default
})
</script>
