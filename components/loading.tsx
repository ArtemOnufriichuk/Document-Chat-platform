'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
	text?: string;
	size?: 'small' | 'medium' | 'large';
	fullScreen?: boolean;
}

const LoadingSpinner = ({ text = 'Загрузка...', size = 'medium', fullScreen = false }: LoadingSpinnerProps) => {
	const sizeMap = {
		small: 'h-4 w-4',
		medium: 'h-8 w-8',
		large: 'h-12 w-12',
	};

	const containerClass = fullScreen
		? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
		: 'flex flex-col items-center justify-center min-h-[200px] p-8';

	return (
		<div className={containerClass}>
			<div className='flex flex-col items-center justify-center space-y-4'>
				<Loader2 className={`${sizeMap[size]} animate-spin text-primary`} />
				{text && <p className='text-sm text-muted-foreground'>{text}</p>}
			</div>
		</div>
	);
};

export default LoadingSpinner;
