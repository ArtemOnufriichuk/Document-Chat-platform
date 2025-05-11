import React from 'react';
import { cn } from '../../utils/cn';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'destructive';
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className, variant = 'default', ...props }, ref) => {
	return (
		<div
			ref={ref}
			className={cn(
				'relative w-full rounded-lg border p-4',
				variant === 'default' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-red-50 border-red-200 text-red-600',
				className,
			)}
			{...props}
		/>
	);
});

Alert.displayName = 'Alert';

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(({ className, ...props }, ref) => {
	return <h5 ref={ref} className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />;
});

AlertTitle.displayName = 'AlertTitle';

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(({ className, ...props }, ref) => {
	return <div ref={ref} className={cn('text-sm', className)} {...props} />;
});

AlertDescription.displayName = 'AlertDescription';
