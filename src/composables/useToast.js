import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

export function useToast() {
  const show = (msg, type = 'info', duration = 3500) => {
    const id = ++nextId
    toasts.value.push({ id, msg, type })
    setTimeout(() => dismiss(id), duration)
  }
  const dismiss = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }
  return { toasts, show, dismiss }
}
