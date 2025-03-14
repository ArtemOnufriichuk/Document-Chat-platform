'use client';

import type React from 'react';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageContainer } from './layout/page-container';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function UserManagement() {
	const { users = [], addUser, updateUser, deleteUser, changeUserPermissions, currentUser } = useAppStore();
	const { toast } = useToast();
	const [newUser, setNewUser] = useState({
		login: '',
		password: '',
		email: '',
		fullName: '',
		isAdmin: false,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

	/**
	 * Reset the form to its initial state
	 */
	const resetForm = useCallback(() => {
		setNewUser({
			login: '',
			password: '',
			email: '',
			fullName: '',
			isAdmin: false,
		});
		setError(null);
	}, []);

	/**
	 * Handle adding a new user
	 */
	const handleAddUser = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Validate form
		if (!newUser.login || !newUser.password || !newUser.email) {
			setError('Пожалуйста, заполните все обязательные поля');
			return;
		}

		// Check if login already exists
		if (users.some((user) => user.login === newUser.login)) {
			setError('Пользователь с таким логином уже существует');
			return;
		}

		try {
			setIsSubmitting(true);
			await addUser(newUser);
			resetForm();
			toast({
				title: 'Успех',
				description: 'Пользователь успешно добавлен',
			});
		} catch (error) {
			console.error('Error adding user:', error);
			setError('Не удалось добавить пользователя');
		} finally {
			setIsSubmitting(false);
		}
	};

	/**
	 * Handle deleting a user with confirmation
	 */
	const handleDeleteUser = async (userId: string, userName: string) => {
		setUserToDelete({ id: userId, name: userName });
		setIsDeleteDialogOpen(true);
	};

	/**
	 * Confirm user deletion
	 */
	const confirmDeleteUser = async () => {
		if (!userToDelete) return;

		try {
			setIsSubmitting(true);
			await deleteUser(userToDelete.id);
			setIsDeleteDialogOpen(false);
			setUserToDelete(null);
			toast({
				title: 'Успех',
				description: 'Пользователь успешно удален',
			});
		} catch (error) {
			console.error('Error deleting user:', error);
			toast({
				title: 'Ошибка',
				description: 'Не удалось удалить пользователя',
				variant: 'destructive',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Check if user has admin permissions
	if (!currentUser?.isAdmin) {
		return (
			<PageContainer>
				<Card>
					<CardContent className='p-6'>
						<p className='text-center text-muted-foreground'>У вас нет доступа к управлению пользователями</p>
					</CardContent>
				</Card>
			</PageContainer>
		);
	}

	return (
		<PageContainer>
			<div className='space-y-6'>
				<Card>
					<CardHeader>
						<CardTitle>Добавить нового пользователя</CardTitle>
						<CardDescription>Создайте новую учетную запись пользователя</CardDescription>
					</CardHeader>
					<CardContent>
						{error && (
							<Alert variant='destructive' className='mb-4'>
								<AlertCircle className='h-4 w-4' />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<form onSubmit={handleAddUser} className='space-y-4'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='login'>
										Логин <span className='text-red-500'>*</span>
									</Label>
									<Input
										id='login'
										value={newUser.login}
										onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
										required
										disabled={isSubmitting}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='password'>
										Пароль <span className='text-red-500'>*</span>
									</Label>
									<Input
										id='password'
										type='password'
										value={newUser.password}
										onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
										required
										disabled={isSubmitting}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='email'>
										Email <span className='text-red-500'>*</span>
									</Label>
									<Input
										id='email'
										type='email'
										value={newUser.email}
										onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
										required
										disabled={isSubmitting}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='fullName'>Полное имя</Label>
									<Input
										id='fullName'
										value={newUser.fullName}
										onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
										disabled={isSubmitting}
									/>
								</div>
							</div>
							<div className='flex items-center space-x-2'>
								<Switch
									id='isAdmin'
									checked={newUser.isAdmin}
									onCheckedChange={(checked: boolean) => setNewUser({ ...newUser, isAdmin: checked })}
									disabled={isSubmitting}
								/>
								<Label htmlFor='isAdmin'>Администратор</Label>
							</div>
							<div className='flex gap-2'>
								<Button type='submit' disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
											Добавление...
										</>
									) : (
										'Добавить пользователя'
									)}
								</Button>
								<Button type='button' variant='outline' onClick={resetForm} disabled={isSubmitting}>
									Сбросить
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Управление пользователями</CardTitle>
						<CardDescription>Список всех пользователей системы</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{users.length === 0 ? (
								<p className='text-center text-muted-foreground'>Нет доступных пользователей</p>
							) : (
								users.map((user) => (
									<div key={user.id} className='border p-4 rounded-md'>
										<div className='flex justify-between items-center'>
											<div>
												<p className='font-medium'>{user.fullName || user.login}</p>
												<p className='text-sm text-muted-foreground'>{user.email}</p>
												<p className='text-xs text-muted-foreground'>Логин: {user.login}</p>
											</div>
											<div className='flex items-center space-x-4'>
												<div className='flex items-center space-x-2'>
													<Switch
														id={`admin-${user.id}`}
														checked={user.isAdmin}
														onCheckedChange={(checked: boolean) => changeUserPermissions(user.id, checked)}
														disabled={user.id === currentUser.id}
													/>
													<Label htmlFor={`admin-${user.id}`}>Админ</Label>
												</div>
												<Button
													variant='destructive'
													size='sm'
													onClick={() => handleDeleteUser(user.id, user.fullName || user.login)}
													disabled={user.id === currentUser.id}>
													Удалить
												</Button>
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Delete User Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle>Удаление пользователя</DialogTitle>
						<DialogDescription>Вы уверены, что хотите удалить пользователя {userToDelete?.name}? Это действие нельзя отменить.</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
							Отмена
						</Button>
						<Button variant='destructive' onClick={confirmDeleteUser} disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Удаление...
								</>
							) : (
								'Удалить'
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageContainer>
	);
}
