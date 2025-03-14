'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FileText, MessageCircle, Users, Settings } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/utils/common';

const tabs = [
	{
		id: 'documents',
		label: 'Документы',
		icon: FileText,
		href: '/dashboard?tab=documents',
	},
	{
		id: 'chat',
		label: 'Чат с документом',
		icon: MessageCircle,
		href: '/dashboard?tab=chat',
	},
	{
		id: 'users',
		label: 'Пользователи',
		icon: Users,
		href: '/dashboard?tab=users',
		adminOnly: true,
	},
	{
		id: 'settings',
		label: 'Настройки',
		icon: Settings,
		href: '/dashboard?tab=settings',
	},
];

const DashboardTabs = () => {
	const searchParams = useSearchParams();
	const activeTab = searchParams.get('tab') || 'documents';
	const { currentUser } = useAppStore();

	return (
		<div className='border-b'>
			<div className='container mx-auto max-w-[1200px]'>
				<nav className='flex overflow-x-auto'>
					{tabs
						.filter((tab) => !tab.adminOnly || currentUser?.isAdmin)
						.map((tab) => (
							<Link
								key={tab.id}
								href={tab.href}
								className={cn(
									'flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap',
									activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
								)}>
								<tab.icon className='w-4 h-4 mr-2' />
								{tab.label}
							</Link>
						))}
				</nav>
			</div>
		</div>
	);
};

export default DashboardTabs;
