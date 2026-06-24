<template>
  <div class="relative w-full">
    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
      <BaseIcon name="search" :size="16" />
    </span>
    <input
      :value="debounced"
      type="text"
      :placeholder="placeholder"
      class="w-full rounded-md border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      @input="onInput"
    />
    <button
      v-if="debounced"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      aria-label="清除"
      @click="clear"
    >
      <BaseIcon name="close" :size="16" />
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '搜索...' },
})

const emit = defineEmits(['update:modelValue'])

const inner = ref(props.modelValue)
const debounced = refDebounced(inner, 300)

watch(debounced, (v) => emit('update:modelValue', v))
watch(
  () => props.modelValue,
  (v) => {
    if (v !== inner.value) inner.value = v
  },
)

function onInput(e) {
  inner.value = e.target.value
}

function clear() {
  inner.value = ''
}
</script>
