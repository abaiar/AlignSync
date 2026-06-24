<template>
  <div class="w-full">
    <label
      v-if="label"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <select
      :value="modelValue"
      :disabled="disabled"
      :class="[
        'w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
        error
          ? 'border-red-400 focus:ring-red-400 dark:border-red-500'
          : 'border-gray-300 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100',
      ]"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option
        v-for="opt in normalizedOptions"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const normalizedOptions = computed(() =>
  props.options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  ),
)
</script>
