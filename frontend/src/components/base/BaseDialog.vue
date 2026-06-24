<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
    @close="emit('cancel')"
  >
    <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{{ content }}</p>
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="default" size="sm" @click="emit('cancel')">
          {{ cancelText }}
        </BaseButton>
        <BaseButton :variant="variant" size="sm" @click="emit('confirm')">
          {{ confirmText }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '确认' },
  content: { type: String, default: '' },
  confirmText: { type: String, default: '确认' },
  cancelText: { type: String, default: '取消' },
  variant: { type: String, default: 'primary' },
})

const emit = defineEmits(['confirm', 'cancel', 'update:modelValue'])
</script>
