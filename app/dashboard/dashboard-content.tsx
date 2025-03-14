'use client';

import { useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import LoadingSpinner from '@/components/loading';

// Lazy load components for better performance
const DocumentList = lazy(() => import('@/components/document-list'));
const AddDocumentForm = lazy(() => import('@/components/add-document-form'));
const Chat = lazy(() => import('@/components/chat'));
const UserManagement = lazy(() => import('@/components/user-management'));
const Settings = lazy(() => import('@/components/settings'));

const DashboardContent = () => {
	const searchParams = useSearchParams();
	const { currentUser, documents, fetchDocuments } = useAppStore();

	const activeTab = searchParams.get('tab') || 'documents';

	// Fetch documents when the component mounts and when the active tab changes
	useEffect(() => {
		// Always fetch documents when the component mounts or tab changes
		// This ensures we have the latest documents for both documents tab and chat tab
		fetchDocuments();

		// Set up an interval to refresh documents every 10 seconds when on documents or chat tab
		if (activeTab === 'documents' || activeTab === 'chat') {
			const intervalId = setInterval(() => {
				fetchDocuments();
			}, 10000);

			// Clean up interval on unmount or tab change
			return () => clearInterval(intervalId);
		}
	}, [fetchDocuments, activeTab]);

	const renderContent = () => {
		// Wrap all content in Suspense for lazy loading
		return <Suspense fallback={<LoadingSpinner text={`Загрузка ${getTabName(activeTab)}...`} />}>{getTabContent()}</Suspense>;
	};

	// Get readable tab name for loading message
	const getTabName = (tab: string) => {
		switch (tab) {
			case 'documents':
				return 'документов';
			case 'chat':
				return 'чата';
			case 'users':
				return 'пользователей';
			case 'settings':
				return 'настроек';
			default:
				return 'страницы';
		}
	};

	// Get content based on active tab
	const getTabContent = () => {
		switch (activeTab) {
			case 'documents':
				return (
					<div className='flex flex-col gap-4 max-w-[1200px] mx-auto'>
						{currentUser?.isAdmin && <AddDocumentForm />}
						<DocumentList />
					</div>
				);
			case 'chat':
				return (
					<div className='flex flex-col gap-4 max-w-[1200px] mx-auto'>
						<Chat />
					</div>
				);
			case 'users':
				return currentUser?.isAdmin ? (
					<div className='max-w-[1200px] mx-auto'>
						<UserManagement />
					</div>
				) : (
					<div className='text-center py-12'>
						<p>У вас нет доступа к этому разделу</p>
					</div>
				);
			case 'settings':
				return (
					<div className='max-w-[1200px] mx-auto'>
						<Settings />
					</div>
				);
			default:
				return null;
		}
	};

	return <div className='container py-6'>{renderContent()}</div>;
};

export default DashboardContent;
