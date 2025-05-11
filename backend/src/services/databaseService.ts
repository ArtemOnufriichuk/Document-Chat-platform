import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt'; // Импорт bcrypt
// Предполагаем, что types.ts находится в корне проекта и доступен так:
// Если types.ts будет специфичен для фронтенда, эти типы нужно будет перенести/адаптировать
import type { DB, User, Document, Settings } from '../types/commonTypes';

// Путь к файлу database.json относительно корня бэкенд-проекта
const DB_PATH = path.join(process.cwd(), 'database.json');
// process.cwd() в данном контексте будет D:\WORK\AI\WORK_PROJECTS\DocumentChat\backend
const SALT_ROUNDS = 10; // То же значение, что и в userController

const getDefaultDB = async (): Promise<DB> => {
	const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
	return {
		users: [
			{
				id: '1',
				login: 'admin',
				password: hashedPassword, // Сохраняем хешированный пароль
				isAdmin: true,
				email: 'admin@example.com',
				fullName: 'Admin User',
				createdAt: new Date().toISOString(),
				lastLogin: new Date().toISOString(),
			},
		],
		documents: [],
		settings: {
			theme: 'dark',
		},
	};
};

export const readDB = async (): Promise<DB> => {
	try {
		if (!fs.existsSync(DB_PATH)) {
			console.log('Database file not found at ', DB_PATH, ', creating with default data');
			const defaultDbData = await getDefaultDB(); // Получаем defaultDB с хешированным паролем
			fs.writeFileSync(DB_PATH, JSON.stringify(defaultDbData, null, 2));
			return defaultDbData;
		}
		const data = fs.readFileSync(DB_PATH, 'utf-8');
		return JSON.parse(data) as DB;
	} catch (error) {
		console.error('Error reading database:', error);
		console.log('Returning default DB due to error.');
		return await getDefaultDB(); // Возвращаем defaultDB с хешированным паролем и в случае ошибки чтения
	}
};

export const getUsers = async (): Promise<User[]> => {
	const db = await readDB();
	return db.users || [];
};

export const getDocuments = async (): Promise<Document[]> => {
	const db = await readDB();
	return db.documents || [];
};

export const getSettings = async (): Promise<Settings> => {
	const db = await readDB();
	return db.settings || {}; // Возвращаем пустой объект, если настройки отсутствуют
};

export const writeDB = async (db: DB): Promise<void> => {
	try {
		fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
	} catch (error) {
		console.error('Error writing to database:', error);
		// В реальном приложении здесь может потребоваться обработка ошибки записи
	}
};

// Эта функция может быть полезной для атомарных обновлений
export const updateDB = async (updater: (db: DB) => DB): Promise<void> => {
	const db = await readDB();
	const updatedDB = updater(db);
	await writeDB(updatedDB);
};
