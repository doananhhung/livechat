import { useState, useEffect } from "react";

interface ToastProps {
  id?: string;
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

interface ToastState extends ToastProps {
  id: string;
}

let toasts: ToastState[] = [];

const listeners: Array<(toasts: ToastState[]) => void> = [];

const toast = (props: ToastProps) => {
  const id = Math.random().toString(36).substr(2, 9);
  toasts = [...toasts, { ...props, id }];
  listeners.forEach((listener) => listener(toasts));

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener(toasts));
  }, 3000); // Auto-dismiss after 3 seconds
};

export const useToast = () => {
  const [state, setState] = useState<ToastState[]>(toasts);

  useEffect(() => {
    const listener = (newToasts: ToastState[]) => setState(newToasts);
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return { toasts, toast };
};
