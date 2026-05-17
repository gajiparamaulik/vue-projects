import { ref } from 'vue';

export type ToastType = 'success' | 'delete' | 'complete' | 'warning' | 'info'

export interface Toast {
    id: number
    title: string
    message: string
    type: ToastType
    leaving: boolean
}

const toasts = ref<Toast[]>([])
let _id = 0

const TOAST_DURATION = 4000   // ms before auto-dismiss
const LEAVE_OFFSET   = 400    // ms leave animation duration

export function useToast() {
    

    const show = (
        title: string,
        message: string = '',
        type: ToastType = 'info'
    ) => {
        const id = ++_id
        toasts.value.push({ id, title, message, type, leaving: false })

        // Start leave animation
        setTimeout(() => {
            const t = toasts.value.find(t => t.id === id)
            if (t) t.leaving = true
        }, TOAST_DURATION - LEAVE_OFFSET)

        // Remove from DOM
        setTimeout(() => {
            toasts.value = toasts.value.filter(t => t.id !== id)
        }, TOAST_DURATION)
    }

    const dismiss = (id: number) => {
        const t = toasts.value.find(t => t.id === id)
        if (t) t.leaving = true
        setTimeout(() => {
            toasts.value = toasts.value.filter(t => t.id !== id)
        }, LEAVE_OFFSET)
    }

    // Convenience helpers
    const success  = (title: string, message = '') => show(title, message, 'success')
    const deleted  = (title: string, message = '') => show(title, message, 'delete')
    const complete = (title: string, message = '') => show(title, message, 'complete')
    const warning  = (title: string, message = '') => show(title, message, 'warning')
    const info     = (title: string, message = '') => show(title, message, 'info')

    return { toasts, show, dismiss, success, deleted, complete, warning, info }
}
