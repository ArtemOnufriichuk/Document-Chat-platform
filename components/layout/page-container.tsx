import React from 'react';

interface PageContainerProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * A shared container component that provides consistent layout for dashboard pages
 * Centers content with a maximum width and adds appropriate spacing
 */
export function PageContainer({ children, className = '' }: PageContainerProps) {
	return <div className={`w-full max-w-[1200px] mx-auto px-4 ${className}`}>{children}</div>;
}
