'use server';

import fs from 'fs';
import path from 'path';
import type { DB, User, Document, Settings } from '@/types';

const DB_PATH = path.join(process.cwd(), 'database.json');

const defaultDB: DB = {
	users: [
		{
			id: '1',
			login: 'admin',
			password: 'admin123',
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

async function readDB(): Promise<DB> {
	try {
		// Check if database file exists
		if (!fs.existsSync(DB_PATH)) {
			console.log('Database file not found, creating with default data');
			// Create the database file with default data
			fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
			return defaultDB;
		}

		const data = fs.readFileSync(DB_PATH, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		console.error('Error reading database:', error);
		// Return default data if there's an error
		return defaultDB;
	}
}

export async function getUsers(): Promise<User[]> {
	const db = await readDB();
	return db.users || [];
}

export async function getDocuments(): Promise<Document[]> {
	const db = await readDB();
	return db.documents || [];
}

export async function getSettings(): Promise<Settings> {
	const db = await readDB();
	return db.settings || {};
}

export async function writeDB(db: DB): Promise<void> {
	try {
		fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
	} catch (error) {
		console.error('Error writing to database:', error);
	}
}

export async function updateDB(updater: (db: DB) => DB): Promise<void> {
	const db = await readDB();
	const updatedDB = updater(db);
	await writeDB(updatedDB);
}
