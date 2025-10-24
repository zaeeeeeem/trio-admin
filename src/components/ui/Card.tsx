import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function Card({ children, className = '', title, action }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-[#F2DFFF] flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold text-[#1E2934BA]">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
