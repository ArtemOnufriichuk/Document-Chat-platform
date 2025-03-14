export interface User {
	id: string;
	login: string;
	password?: string;
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

export interface DB {
	users: User[];
	documents: Document[];
	settings: Settings;
}
