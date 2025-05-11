import { Request, Response } from 'express';
import * as dbService from '../services/databaseService';
import type { User, DB } from '../types/commonTypes';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // Количество раундов для хеширования

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
	try {
		const users = await dbService.getUsers();
		// Возвращаем пользователей без паролей
		const usersWithoutPasswords = users.map(({ password, ...user }) => user);
		res.status(200).json(usersWithoutPasswords);
	} catch (error) {
		console.error('Error in getAllUsers:', error);
		res.status(500).json({ message: 'Failed to get users' });
	}
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
	try {
		const { login, password, isAdmin, email, fullName } = req.body;

		if (!login || !password || !email) {
			res.status(400).json({ message: 'Login, password, and email are required' });
			return;
		}

		const db = await dbService.readDB();
		const existingUser = db.users.find((u) => u.login === login || u.email === email);
		if (existingUser) {
			res.status(409).json({ message: 'User with this login or email already exists' });
			return;
		}

		const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

		const newUser: User = {
			id: Date.now().toString(), // Простой генератор ID
			login,
			password: hashedPassword,
			isAdmin: isAdmin || false,
			email,
			fullName: fullName || '',
			createdAt: new Date().toISOString(),
			lastLogin: new Date().toISOString(), // Можно установить при первом логине
		};

		db.users.push(newUser);
		await dbService.writeDB(db);

		// Не возвращаем пароль в ответе
		const { password: _, ...userWithoutPassword } = newUser;
		res.status(201).json(userWithoutPassword);
	} catch (error) {
		console.error('Error in createUser:', error);
		res.status(500).json({ message: 'Failed to create user' });
	}
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
	try {
		const { login, password } = req.body;
		if (!login || !password) {
			res.status(400).json({ message: 'Login and password are required' });
			return;
		}

		const db = await dbService.readDB();
		const user = db.users.find((u) => u.login === login);

		if (!user || !user.password) {
			// Проверка на наличие пользователя и его пароля в БД
			res.status(401).json({ message: 'Invalid login or password' });
			return;
		}

		const isPasswordMatch = await bcrypt.compare(password, user.password);
		if (!isPasswordMatch) {
			res.status(401).json({ message: 'Invalid login or password' });
			return;
		}

		// Успешный вход
		// Обновляем lastLogin
		user.lastLogin = new Date().toISOString();
		await dbService.writeDB(db);

		// Не возвращаем пароль
		const { password: _, ...userWithoutPassword } = user;

		// Пока просто возвращаем пользователя. В будущем здесь может быть JWT.
		res.status(200).json({ message: 'Login successful', user: userWithoutPassword });
	} catch (error) {
		console.error('Error in loginUser:', error);
		res.status(500).json({ message: 'Login failed' });
	}
};
