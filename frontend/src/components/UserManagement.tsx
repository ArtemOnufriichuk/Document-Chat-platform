import React, { useState, useCallback } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/ToastContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Card } from './ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog';
import { Switch } from './ui/Switch';
import { Alert, AlertDescription } from './ui/Alert';

// Иконки
const AlertCircle = () => {
	return <span className='h-4 w-4'>⚠️</span>;
};

const Loader2 = () => {
	return <span className='animate-spin'>⟳</span>;
};

const UserManagement = () => {
	const { users = [], addUser, deleteUser, changeUserPermissions, currentUser } = useAppStore();
	const { showToast } = useToast();
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
			showToast({
				title: 'Успех',
				description: 'Пользователь успешно добавлен',
				type: 'success',
			});
		} catch (error) {
			console.error('Error adding user:', error);
			setError('Не удалось добавить пользователя');
			showToast({
				title: 'Ошибка',
				description: 'Не удалось добавить пользователя',
				type: 'error',
			});
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
			showToast({
				title: 'Успех',
				description: 'Пользователь успешно удален',
				type: 'success',
			});
		} catch (error) {
			console.error('Error deleting user:', error);
			showToast({
				title: 'Ошибка',
				description: 'Не удалось удалить пользователя',
				type: 'error',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Check if user has admin permissions
	if (!currentUser?.isAdmin) {
		return (
			<Card>
				<div className='p-6'>
					<p className='text-center text-gray-500'>У вас нет доступа к управлению пользователями</p>
				</div>
			</Card>
		);
	}

	return (
		<>
			<div className='space-y-6'>
				<Card>
					<div className='p-4 border-b'>
						<h2 className='text-xl font-semibold'>Добавить нового пользователя</h2>
						<p className='text-sm text-gray-500'>Создайте новую учетную запись пользователя</p>
					</div>
					<div className='p-4'>
						{error && (
							<Alert variant='destructive' className='mb-4'>
								<AlertCircle />
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
											<Loader2 />
											<span className='ml-2'>Добавление...</span>
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
					</div>
				</Card>

				<Card>
					<div className='p-4 border-b'>
						<h2 className='text-xl font-semibold'>Управление пользователями</h2>
						<p className='text-sm text-gray-500'>Список всех пользователей системы</p>
					</div>
					<div className='p-4'>
						<div className='space-y-4'>
							{users.length === 0 ? (
								<p className='text-center text-gray-500'>Нет доступных пользователей</p>
							) : (
								users.map((user) => (
									<div key={user.id} className='border p-4 rounded-md'>
										<div className='flex justify-between items-center'>
											<div>
												<p className='font-medium'>{user.fullName || user.login}</p>
												<p className='text-sm text-gray-500'>{user.email}</p>
												<p className='text-xs text-gray-500'>Логин: {user.login}</p>
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
													variant='primary'
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
					</div>
				</Card>
			</div>

			{/* Delete User Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Удаление пользователя</DialogTitle>
						<DialogDescription>Вы уверены, что хотите удалить пользователя {userToDelete?.name}? Это действие нельзя отменить.</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
							Отмена
						</Button>
						<Button variant='primary' onClick={confirmDeleteUser} disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Loader2 />
									<span className='ml-2'>Удаление...</span>
								</>
							) : (
								'Удалить'
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default UserManagement;
