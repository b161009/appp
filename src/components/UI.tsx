// Các thành phần giao diện tái sử dụng chung như Button, Card, Badge
import React from 'react';
import { cn } from '../lib/utils';

export const Button = ({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' }) => {
  const variants = {
    primary: 'bg-accent text-white hover:opacity-90',
    secondary: 'bg-white text-accent border border-border-theme hover:bg-slate-50',
    danger: 'bg-warning text-white hover:opacity-90',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-200',
    success: 'bg-success text-white hover:opacity-90'
  };
  return (
    <button 
      className={cn('px-4 py-2 rounded font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-[13px]', variants[variant], className)} 
      {...props} 
    />
  );
};

export const Card = ({ children, className, title, extra, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode, title?: string, extra?: React.ReactNode }) => (
  <div className={cn('card-theme', className)} {...props}>
    {title && (
      <div className="card-header-theme">
        <span>{title}</span>
        {extra && <span className="text-xs font-normal opacity-70">{extra}</span>}
      </div>
    )}
    {children}
  </div>
);

export const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn('px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider', className)}>
    {children}
  </span>
);
