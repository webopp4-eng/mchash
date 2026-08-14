'use client';

import { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

let toastId = 0;
export const toastEmitter = {
  listeners: new Set<(toast: Toast) => void>(),
  subscribe: (listener: (toast: Toast) => void) => {
    toastEmitter.listeners.add(listener);
    return () => {
      toastEmitter.listeners.delete(listener);
    };
  },
  emit: (toast: Toast) => {
    toastEmitter.listeners.forEach(listener => listener(toast));
  },
  success: (title: string, message?: string) => {
    toastEmitter.emit({
      id: `toast-${++toastId}`,
      type: 'success',
      title,
      message: message || '',
      duration: 4000,
    });
  },
  error: (title: string, message?: string) => {
    toastEmitter.emit({
      id: `toast-${++toastId}`,
      type: 'error',
      title,
      message: message || '',
      duration: 5000,
    });
  },
  info: (title: string, message?: string) => {
    toastEmitter.emit({
      id: `toast-${++toastId}`,
      type: 'info',
      title,
      message: message || '',
      duration: 4000,
    });
  },
  warning: (title: string, message?: string) => {
    toastEmitter.emit({
      id: `toast-${++toastId}`,
      type: 'warning',
      title,
      message: message || '',
      duration: 5000,
    });
  },
};

interface ToastProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(onClose, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  const bgClass = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-rose-50 border-rose-200',
    info: 'bg-sky-50 border-sky-200',
    warning: 'bg-amber-50 border-amber-200',
  }[toast.type];

  const iconClass = {
    success: 'text-emerald-600',
    error: 'text-rose-600',
    info: 'text-sky-600',
    warning: 'text-amber-600',
  }[toast.type];

  const Icon = {
    success: FaCheckCircle,
    error: FaExclamationCircle,
    info: FaInfoCircle,
    warning: FaExclamationCircle,
  }[toast.type];

  return (
    <div
      className={`flex items-start gap-3 rounded-[18px] border ${bgClass} p-4 shadow-lg backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-300`}
      role="alert"
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconClass}`} />
      <div className="flex-1">
        <p className={`font-bold text-sm ${iconClass}`}>{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-600 mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
        aria-label="Close notification"
      >
        <FaTimes className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function NotificationContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastEmitter.subscribe((toast: Toast) => {
      setToasts(prev => [...prev, toast]);
    });
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-auto">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
