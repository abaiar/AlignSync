<template>
  <div class="w-full space-y-2">
    <div
      v-for="i in lines"
      :key="i"
      class="animate-pulse rounded bg-gray-200 dark:bg-slate-700"
      :style="{ height: height }"
    />
  </div>
</template>

<script setup>
defineProps({
  lines: { type: Number, default: 1 },
  height: { type: String, default: '12px' },
})
</script>
