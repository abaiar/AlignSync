<template>
  <div class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
    <div
      v-if="title || $slots.title || $slots.actions"
      class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700"
    >
      <div class="text-base font-semibold text-gray-800 dark:text-gray-100">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="$slots.actions">
        <slot name="actions" />
      </div>
    </div>
    <div :class="padding ? 'p-5' : ''">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="px-5 py-4 border-t border-gray-200 dark:border-slate-700"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  padding: { type: Boolean, default: true },
})
</script>
