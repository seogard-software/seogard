const DEFAULT_DURATION = 4000

export function useToast() {
  const store = useToastStore()

  function success(message: string, duration = DEFAULT_DURATION) {
    store.add({ id: crypto.randomUUID(), type: 'success', message, duration })
  }

  function error(message: string, duration = DEFAULT_DURATION) {
    store.add({ id: crypto.randomUUID(), type: 'error', message, duration })
  }

  function warning(message: string, duration = DEFAULT_DURATION) {
    store.add({ id: crypto.randomUUID(), type: 'warning', message, duration })
  }

  function info(message: string, duration = DEFAULT_DURATION) {
    store.add({ id: crypto.randomUUID(), type: 'info', message, duration })
  }

  return { success, error, warning, info }
}
