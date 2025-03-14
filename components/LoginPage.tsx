'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const LoginPage = () => {
	const router = useRouter();
	const { login } = useAppStore();
	const [username, setUsername] = useState('admin');
	const [password, setPassword] = useState('admin123');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	/**
	 * Handle login form submission
	 */
	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		setTimeout(() => {
			try {
				const success = login(username, password);

				if (success) {
					router.push('/dashboard');
				} else {
					setError('Неверный логин или пароль');
					setIsLoading(false);
				}
			} catch (err) {
				setError('Ошибка при входе в систему');
				setIsLoading(false);
			}
		}, 500);
	};

	return (
		<div className='flex items-center justify-center min-h-screen bg-background'>
			<Card className='w-[350px]'>
				<CardHeader>
					<CardTitle>Вход в систему</CardTitle>
					<CardDescription>Введите свои учетные данные для входа</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleLogin}>
						<div className='grid w-full items-center gap-4'>
							<div className='flex flex-col space-y-1.5'>
								<Label htmlFor='username'>Имя пользователя</Label>
								<Input
									id='username'
									placeholder='Введите имя пользователя'
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									disabled={isLoading}
								/>
							</div>
							<div className='flex flex-col space-y-1.5'>
								<Label htmlFor='password'>Пароль</Label>
								<Input
									id='password'
									type='password'
									placeholder='Введите пароль'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									disabled={isLoading}
								/>
							</div>
						</div>
						{error && <p className='text-red-500 mt-2'>{error}</p>}
						<Button className='w-full mt-4' type='submit' disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Вход...
								</>
							) : (
								'Войти'
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default LoginPage;
