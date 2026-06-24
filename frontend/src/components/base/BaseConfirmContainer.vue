<template>
  <BaseDialog
    :model-value="confirmState.visible"
    :title="confirmState.title"
    :content="confirmState.content"
    :confirm-text="confirmState.confirmText"
    :cancel-text="confirmState.cancelText"
    :variant="confirmState.variant"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>

<script setup>
import BaseDialog from './BaseDialog.vue'
import { useConfirm } from '@/composables/useConfirm'

const { confirmState, close } = useConfirm()

function handleConfirm() {
  close(true)
}

function handleCancel() {
  close(false)
}
</script>
