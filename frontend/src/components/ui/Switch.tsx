import React from 'react';
import { cn } from '../../utils/cn';

interface SwitchProps {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
	id?: string;
	className?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({ checked, onCheckedChange, disabled, id, className }, ref) => {
	return (
		<div className={cn('relative inline-flex h-6 w-11 items-center rounded-full', className)}>
			<input
				ref={ref}
				id={id}
				type='checkbox'
				className='peer sr-only'
				checked={checked}
				disabled={disabled}
				onChange={(e) => onCheckedChange(e.target.checked)}
			/>
			<span className={cn('absolute inset-0 rounded-full transition', checked ? 'bg-blue-600' : 'bg-gray-200', disabled && 'opacity-50 cursor-not-allowed')} />
			<span
				className={cn(
					'absolute inset-y-0 left-0 flex h-6 w-6 items-center justify-center rounded-full bg-white transition-all',
					checked ? 'translate-x-5' : 'translate-x-0',
				)}
			/>
		</div>
	);
});

Switch.displayName = 'Switch';
