<template>
  <Transition name="modal">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="close"
    >
      <Transition name="modal-panel" appear>
        <div
          v-if="modelValue"
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          :class="[
            'w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden',
            sizeClasses,
          ]"
          @keydown.tab="trapFocus"
        >
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700 shrink-0">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ title }}</h3>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="关闭"
              @click="close"
            >
              <BaseIcon name="close" :size="20" />
            </button>
          </div>
          <div class="px-5 py-4 overflow-y-auto flex-1">
            <slot />
          </div>
          <div
            v-if="$slots.footer"
            class="px-5 py-4 border-t border-gray-200 dark:border-slate-700 shrink-0"
          >
            <slot name="footer" />
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useEventListener } from '@vueuse/core'
import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'md' },
})

const emit = defineEmits(['update:modelValue', 'close'])

const panelRef = ref(null)

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}[props.size] || 'max-w-md'

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function trapFocus(e) {
  if (!panelRef.value) return
  const focusable = panelRef.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

useEventListener('keydown', (e) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
})

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      document.body.style.overflow = 'hidden'
      await nextTick()
      const focusable = panelRef.value?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable?.[0]?.focus()
    } else {
      document.body.style.overflow = ''
    }
  },
)
</script>
