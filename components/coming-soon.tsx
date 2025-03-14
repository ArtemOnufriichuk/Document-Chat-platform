import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { PageContainer } from './layout/page-container';

interface ComingSoonProps {
	title: string;
	description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
	return (
		<PageContainer>
			<Card className='w-full'>
				<CardHeader>
					<CardTitle className='text-2xl'>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent className='flex flex-col items-center justify-center py-12'>
					<Clock className='w-16 h-16 text-muted-foreground mb-4' />
					<h3 className='text-xl font-semibold mb-2'>Coming Soon</h3>
					<p className='text-muted-foreground text-center max-w-md'>We're working hard to bring you this feature. Please check back later.</p>
				</CardContent>
			</Card>
		</PageContainer>
	);
}
