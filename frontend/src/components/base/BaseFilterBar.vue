<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="flex flex-wrap items-center gap-3 flex-1">
      <slot />
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
</script>
