import { reactive } from 'vue'

const toasts = reactive([])
let counter = 0

function add(type, message, duration) {
  const id = ++counter
  toasts.push({ id, type, message })
  setTimeout(() => remove(id), duration)
  return id
}

function remove(id) {
  const idx = toasts.findIndex((t) => t.id === id)
  if (idx > -1) toasts.splice(idx, 1)
}

export function useToast() {
  return {
    toasts,
    success: (msg) => add('success', msg, 5000),
    error: (msg) => add('error', msg, 6000),
    warning: (msg) => add('warning', msg, 5000),
    info: (msg) => add('info', msg, 5000),
    remove,
  }
}
