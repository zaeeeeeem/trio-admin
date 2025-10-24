import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full ${sizes[size]} mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2DFFF]">
          <h2 className="text-xl font-semibold text-[#1E2934BA]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F2DFFF] rounded-lg transition-colors"
          >
            <X size={20} className="text-[#1E2934BA]" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
      </div>
    </div>
  );
}
