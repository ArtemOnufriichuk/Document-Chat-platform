'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import DashboardContent from './dashboard-content';
import LoadingSpinner from '@/components/loading';
import * as serverActions from '@/lib/server-actions';

const DashboardPage = () => {
	const [isLoading, setIsLoading] = useState(true);

	// Initialize store with data from server only once
	useEffect(() => {
		const initializeStore = async () => {
			try {
				const documentsData = await serverActions.getDocuments();
				useAppStore.setState({ documents: documentsData });

				const settings = await serverActions.getSettings();
				useAppStore.setState({ settings });
			} catch (error) {
				console.error('Error initializing store:', error);
			} finally {
				setIsLoading(false);
			}
		};

		initializeStore();
	}, []);

	if (isLoading) {
		return <LoadingSpinner />;
	}

	return <DashboardContent />;
};

export default DashboardPage;
