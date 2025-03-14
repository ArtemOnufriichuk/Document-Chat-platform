'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import LoginPage from '@/components/login-page';
import LoadingSpinner from '@/components/loading';
import * as serverActions from '@/lib/server-actions';

export default function Home() {
	const router = useRouter();
	const { currentUser, users } = useAppStore();
	const [isLoading, setIsLoading] = useState(true);

	// Initialize users on first load only
	useEffect(() => {
		const initializeUsers = async () => {
			try {
				// Only fetch if data is empty
				if (!users || users.length === 0) {
					const usersData = await serverActions.getUsers();
					useAppStore.setState({ users: usersData });
				}
			} catch (error) {
				console.error('Error loading users:', error);
			} finally {
				setIsLoading(false);
			}
		};

		initializeUsers();
	}, []);

	// Handle navigation on login
	useEffect(() => {
		if (currentUser) {
			router.push('/dashboard');
		}
	}, [currentUser, router]);

	if (isLoading) {
		return <LoadingSpinner />;
	}

	return <LoginPage />;
}
