import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { DB } from '@/types';

// Mock data to use when database doesn't exist
const mockUsers = [
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
	{
		id: '2',
		login: 'user',
		password: 'user123',
		isAdmin: false,
		email: 'user@example.com',
		fullName: 'Regular User',
		createdAt: new Date().toISOString(),
		lastLogin: new Date().toISOString(),
	},
];

export async function GET() {
	try {
		const DB_PATH = path.join(process.cwd(), 'database.json');

		if (!fs.existsSync(DB_PATH)) {
			// Database file not found, returning mock users
			return NextResponse.json(mockUsers);
		}

		const data = fs.readFileSync(DB_PATH, 'utf-8');
		const db: DB = JSON.parse(data);

		return NextResponse.json(db.users || []);
	} catch (error) {
		console.error('Error getting users:', error);
		return NextResponse.json(mockUsers);
	}
}
