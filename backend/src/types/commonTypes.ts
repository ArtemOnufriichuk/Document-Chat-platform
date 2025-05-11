export interface User {
	id: string;
	login: string;
	password?: string; // Пароль здесь опционален, т.к. мы не всегда его возвращаем
	isAdmin: boolean;
	email: string;
	fullName?: string;
	createdAt: string;
	lastLogin: string;
}

export interface Document {
	id: string;
	title: string;
	url: string;
	createdAt: string;
	updatedAt: string;
}

export interface Settings {
	theme?: 'light' | 'dark' | 'system';
}

// Основная структура для файла database.json
export interface DB {
	users: User[];
	documents: Document[];
	settings: Settings;
}
