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

	// useEffect(() => {
	// 	const currentUsers = useAppStore.getState().users;
	// 	if (!currentUsers || currentUsers.length === 0) {
	// 		const hardcodedUsers = [
	// 			{
	// 				id: '1',
	// 				login: 'admin',
	// 				password: 'admin123',
	// 				isAdmin: true,
	// 				email: 'admin@example.com',
	// 				fullName: 'Admin User',
	// 				createdAt: '2023-01-01T00:00:00.000Z',
	// 				lastLogin: '2023-01-01T00:00:00.000Z',
	// 			},
	// 			{
	// 				id: '2',
	// 				login: 'user',
	// 				password: 'user123',
	// 				isAdmin: false,
	// 				email: 'user@example.com',
	// 				fullName: 'Regular User',
	// 				createdAt: '2023-01-01T00:00:00.000Z',
	// 				lastLogin: '2023-01-01T00:00:00.000Z',
	// 			},
	// 		];
	// 		useAppStore.setState({ users: hardcodedUsers });
	// 	}

	// }, []);

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
