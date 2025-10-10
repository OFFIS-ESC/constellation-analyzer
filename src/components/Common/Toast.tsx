import { useEffect, useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';
import type { Toast as ToastType } from '../../stores/toastStore';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const Toast = ({ toast, onClose }: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false);

  // Icon and color configuration based on type
  const config = {
    success: {
      icon: <CheckCircleIcon className="w-5 h-5" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
    },
    error: {
      icon: <ErrorIcon className="w-5 h-5" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
    },
    info: {
      icon: <InfoIcon className="w-5 h-5" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
    },
    warning: {
      icon: <WarningIcon className="w-5 h-5" />,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      iconColor: 'text-orange-600',
    },
  }[toast.type];

  const handleClose = () => {
    setIsExiting(true);
    // Wait for animation to complete before removing from store
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  // Auto-close when duration expires (handled by store, but we track for animation)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, toast.duration - 300); // Start exit animation 300ms before removal

    return () => clearTimeout(timer);
  }, [toast.duration]);

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border rounded-lg shadow-lg p-4 mb-2
        flex items-start space-x-3 min-w-[320px] max-w-[400px]
        transition-all duration-300 ease-in-out
        ${isExiting
          ? 'opacity-0 translate-x-8 scale-95'
          : 'opacity-100 translate-x-0 scale-100 animate-slide-in-right'
        }
      `}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${config.iconColor}`}>
        {config.icon}
      </div>

      {/* Message */}
      <div className="flex-1 text-sm font-medium pt-0.5">
        {toast.message}
      </div>

      {/* Close button */}
      <IconButton
        size="small"
        onClick={handleClose}
        className={`flex-shrink-0 -mt-1 -mr-1 ${config.iconColor}`}
        aria-label="Dismiss notification"
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </div>
  );
};

export default Toast;
