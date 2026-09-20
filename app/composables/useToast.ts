export type ToastTone = 'success' | 'info' | 'error'

export interface ToastMessage {
  id: string
  key?: string
  message: string
  tone: ToastTone
  duration: number
}

let toastSequence = 0

export function useToast() {
  const toasts = useState<ToastMessage[]>('global-toasts', () => [])

  function dismiss(id: string) {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }

  function show(message: string, options: { key?: string, tone?: ToastTone, duration?: number } = {}) {
    const toast: ToastMessage = {
      id: `toast-${++toastSequence}`,
      key: options.key,
      message,
      tone: options.tone ?? 'success',
      duration: options.duration ?? 4000,
    }
    const existingIndex = options.key ? toasts.value.findIndex(item => item.key === options.key) : -1
    if (existingIndex >= 0) toasts.value.splice(existingIndex, 1, toast)
    else toasts.value = [...toasts.value.slice(-2), toast]
    return toast.id
  }

  return {
    toasts: readonly(toasts),
    show,
    success: (message: string, key?: string) => show(message, { key, tone: 'success' }),
    info: (message: string, key?: string) => show(message, { key, tone: 'info' }),
    error: (message: string, key?: string) => show(message, { key, tone: 'error', duration: 6000 }),
    dismiss,
  }
}
