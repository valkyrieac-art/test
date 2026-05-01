import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'action-button',
        variant === 'primary' && 'bg-brand-600 text-white hover:bg-brand-700',
        variant === 'secondary' && 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
        variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700',
        variant === 'ghost' && 'bg-transparent text-slate-700 hover:bg-slate-100',
        className,
      )}
      {...props}
    />
  );
}
