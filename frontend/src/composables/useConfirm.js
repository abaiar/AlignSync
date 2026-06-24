import { reactive } from 'vue'

const confirmState = reactive({
  visible: false,
  title: '确认操作',
  content: '',
  confirmText: '确认',
  cancelText: '取消',
  variant: 'primary',
  resolve: null,
})

function confirm(options = {}) {
  return new Promise((resolve) => {
    confirmState.title = options.title || '确认操作'
    confirmState.content = options.content || ''
    confirmState.confirmText = options.confirmText || '确认'
    confirmState.cancelText = options.cancelText || '取消'
    confirmState.variant = options.variant || 'primary'
    confirmState.resolve = resolve
    confirmState.visible = true
  })
}

function close(result) {
  if (confirmState.resolve) {
    confirmState.resolve(result)
    confirmState.resolve = null
  }
  confirmState.visible = false
}

export function useConfirm() {
  return { confirmState, confirm, close }
}
