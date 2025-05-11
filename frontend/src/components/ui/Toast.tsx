import * as React from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

interface ToastProps {
	id: string;
	title?: string;
	description?: string;
	type?: 'success' | 'error' | 'info' | 'warning';
	onClose: (id: string) => void;
	duration?: number;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(({ id, title, description, type = 'info', onClose, duration = 5000 }, ref) => {
	React.useEffect(() => {
		const timer = setTimeout(() => {
			onClose(id);
		}, duration);

		return () => clearTimeout(timer);
	}, [id, duration, onClose]);

	// Определяем стили в зависимости от типа уведомления
	const toastTypeStyles = {
		success: 'bg-green-50 border-green-200',
		error: 'bg-red-50 border-red-200',
		warning: 'bg-amber-50 border-amber-200',
		info: 'bg-blue-50 border-blue-200',
	};

	const titleTypeStyles = {
		success: 'text-green-800',
		error: 'text-red-800',
		warning: 'text-amber-800',
		info: 'text-blue-800',
	};

	const descriptionTypeStyles = {
		success: 'text-green-600',
		error: 'text-red-600',
		warning: 'text-amber-600',
		info: 'text-blue-600',
	};

	return (
		<div
			ref={ref}
			className={cn('relative w-full max-w-sm rounded-lg border p-4 shadow-md transition-all', toastTypeStyles[type], 'animate-in slide-in-from-right')}
			data-type={type}>
			<div className='flex items-start gap-3'>
				<div className='grow'>
					{title && <div className={cn('font-medium', titleTypeStyles[type])}>{title}</div>}
					{description && <div className={cn('text-sm', descriptionTypeStyles[type])}>{description}</div>}
				</div>
				<button type='button' onClick={() => onClose(id)} className='shrink-0 rounded-full p-1 transition-colors hover:bg-gray-100' aria-label='Закрыть'>
					<X className='h-4 w-4 text-gray-500' />
				</button>
			</div>
		</div>
	);
});

Toast.displayName = 'Toast';

export const ToastContainer = ({ children }: { children: React.ReactNode }) => {
	return <div className='fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-sm sm:bottom-4 sm:right-4'>{children}</div>;
};
