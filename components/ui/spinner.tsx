import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
	size?: 'default' | 'sm' | 'lg';
}

export function Spinner({ className, size = 'default', ...props }: SpinnerProps) {
	return (
		<div className={cn('animate-spin text-muted-foreground', className)} {...props}>
			<Loader2 className={cn('size-4', size === 'sm' && 'size-3', size === 'lg' && 'size-6')} />
		</div>
	);
}
