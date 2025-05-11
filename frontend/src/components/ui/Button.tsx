import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'primary' | 'outline' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ children, className, variant = 'default', size = 'md', ...props }, ref) => {
	return (
		<button
			ref={ref}
			className={cn(
				// Base styles
				'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',

				// Variant styles
				{
					'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
					'bg-slate-900 text-slate-50 hover:bg-slate-900/90': variant === 'default',
					'border border-slate-200 hover:bg-slate-100 hover:text-slate-900': variant === 'outline',
					'hover:bg-slate-100 hover:text-slate-900': variant === 'ghost',
				},

				// Size styles
				{
					'h-8 px-3 text-xs': size === 'sm',
					'h-10 py-2 px-4': size === 'md',
					'h-12 px-6 text-lg': size === 'lg',
				},

				className,
			)}
			{...props}>
			{children}
		</button>
	);
});

Button.displayName = 'Button';

export { Button };
