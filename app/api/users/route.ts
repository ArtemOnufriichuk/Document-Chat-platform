import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { DB, User } from '@/types';

export async function GET() {
	try {
		const DB_PATH = path.join(process.cwd(), 'database.json');
		const data = fs.readFileSync(DB_PATH, 'utf-8');
		const db: DB = JSON.parse(data);

		return NextResponse.json(db.users || []);
	} catch (error) {
		console.error('Error getting users:', error);
		return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const user = await request.json();
		const DB_PATH = path.join(process.cwd(), 'database.json');
		const data = fs.readFileSync(DB_PATH, 'utf-8');
		const db: DB = JSON.parse(data);

		const newUser: User = {
			id: Date.now().toString(),
			login: user.login,
			password: user.password,
			isAdmin: user.isAdmin || false,
			email: user.email,
			fullName: user.fullName || '',
			createdAt: new Date().toISOString(),
			lastLogin: new Date().toISOString(),
		};

		db.users = [...(db.users || []), newUser];

		fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

		return NextResponse.json(newUser);
	} catch (error) {
		console.error('Error adding user:', error);
		return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
	}
}
