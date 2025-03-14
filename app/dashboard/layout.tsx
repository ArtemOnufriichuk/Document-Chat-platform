'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import DashboardTabs from './dashboard-tabs';
import { Loader2 } from 'lucide-react';
import DashboardHeader from './dashboard-header';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const { currentUser } = useAppStore();

	useEffect(() => {
		if (!currentUser) {
			router.push('/');
		}
	}, [currentUser, router]);

	if (!currentUser) {
		return null;
	}

	return (
		<div className='flex flex-col min-h-screen'>
			<DashboardHeader currentUser={currentUser} />

			<DashboardTabs />

			<main className='mx-auto flex-1 container py-4'>
				<Suspense
					fallback={
						<div className='flex justify-center py-8'>
							<Loader2 className='h-8 w-8 animate-spin' />
						</div>
					}>
					{children}
				</Suspense>
			</main>
		</div>
	);
};

export default DashboardLayout;
