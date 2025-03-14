'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { LogOut, User as UserIcon, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types';

export default function DashboardHeader({ currentUser }: { currentUser: User }) {
	const router = useRouter();
	const { logout } = useAppStore();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = () => {
		setIsLoggingOut(true);

		setTimeout(() => {
			logout();
			router.push('/');
		}, 300);
	};

	return (
		<header className='border-b'>
			<div className='container mx-auto flex h-16 items-center justify-between py-4 max-w-[1200px]'>
				<div className='flex items-center gap-2'>
					<FileText className='h-6 w-6 text-primary' />
					<h1 className='text-xl font-bold'>PDF Chat</h1>
				</div>

				<div className='flex items-center gap-4'>
					<div className='flex items-center gap-2'>
						<UserIcon className='h-4 w-4' />
						<span className='text-sm font-medium'>{currentUser.fullName || currentUser.login}</span>
						{currentUser.isAdmin && <span className='ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>Admin</span>}
					</div>
					<Button variant='ghost' size='sm' onClick={handleLogout} disabled={isLoggingOut}>
						{isLoggingOut ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <LogOut className='h-4 w-4 mr-2' />}
						Выйти
					</Button>
				</div>
			</div>
		</header>
	);
}
