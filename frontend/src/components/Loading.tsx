import React from 'react';

interface LoadingProps {
	fullScreen?: boolean;
	message?: string;
}

const Loading: React.FC<LoadingProps> = ({ fullScreen = false, message = 'Загрузка...' }) => {
	const loadingContent = (
		<div className='flex flex-col items-center justify-center'>
			<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
			{message && <p className='mt-4 text-sm text-gray-600'>{message}</p>}
		</div>
	);

	if (fullScreen) {
		return <div className='fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50'>{loadingContent}</div>;
	}

	return <div className='flex items-center justify-center py-8'>{loadingContent}</div>;
};

export default Loading;
