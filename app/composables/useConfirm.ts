// Confirmation minimale basée sur window.confirm — à remplacer par une modal design plus tard.
export function useConfirm() {
  return (message: string) => (import.meta.client ? window.confirm(message) : false)
}
