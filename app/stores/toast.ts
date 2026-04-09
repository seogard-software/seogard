interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration: number
}

interface ToastState {
  toasts: Toast[]
}

export const useToastStore = defineStore('toast', {
  state: (): ToastState => ({
    toasts: [],
  }),

  actions: {
    add(toast: Toast) {
      this.toasts.push(toast)
      setTimeout(() => this.remove(toast.id), toast.duration)
    },

    remove(id: string) {
      this.toasts = this.toasts.filter(t => t.id !== id)
    },
  },
})
