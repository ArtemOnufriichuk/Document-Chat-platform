import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Label } from './ui/Label';

const LoginPage = () => {
	const navigate = useNavigate();
	const { login } = useAppStore();
	const [username, setUsername] = useState('admin');
	const [password, setPassword] = useState('admin123');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	/**
	 * Handle login form submission
	 */
	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		try {
			console.log('Attempting login with:', username, password);
			const success = await login(username, password);
			console.log('Login result:', success);

			if (success) {
				navigate('/');
			} else {
				setError('Неверный логин или пароль');
			}
		} catch (err) {
			console.error('Login error details:', err);
			setError('Ошибка при входе в систему');
		} finally {
			setIsLoading(false);
		}
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
						<Button className='w-full mt-4' type='submit' disabled={isLoading} variant='primary'>
							{isLoading ? 'Вход...' : 'Войти'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default LoginPage;
