import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { DB, Document } from '@/types';

async function readDB(): Promise<DB> {
	const DB_PATH = path.join(process.cwd(), 'database.json');
	const data = fs.readFileSync(DB_PATH, 'utf-8');
	return JSON.parse(data);
}

async function writeDB(db: DB): Promise<void> {
	const DB_PATH = path.join(process.cwd(), 'database.json');
	fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export async function GET() {
	try {
		const db = await readDB();
		return NextResponse.json(db.documents || []);
	} catch (error) {
		console.error('Error getting documents:', error);
		return NextResponse.json({ error: 'Failed to get documents' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const db = await readDB();
		const data = await request.json();

		// Validate incoming data
		if (!data.title || !data.url) {
			return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
		}

		// Create new document
		const newDocument: Document = {
			id: Date.now().toString(),
			title: data.title,
			url: data.url,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		// Add to database
		db.documents = [...(db.documents || []), newDocument];
		await writeDB(db);

		console.log(`Added new document: ${newDocument.title} with ID ${newDocument.id}`);
		return NextResponse.json(newDocument, { status: 201 });
	} catch (error) {
		console.error('Error adding document:', error);
		return NextResponse.json({ error: 'Failed to add document' }, { status: 500 });
	}
}

export async function PUT(request: NextRequest) {
	try {
		const db = await readDB();
		const { searchParams } = new URL(request.url);
		const id = searchParams.get('id');

		if (!id) {
			return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
		}

		const data = await request.json();
		const documentIndex = db.documents.findIndex((doc) => doc.id === id);

		if (documentIndex === -1) {
			return NextResponse.json({ error: 'Document not found' }, { status: 404 });
		}

		// Update document
		db.documents[documentIndex] = {
			...db.documents[documentIndex],
			...data,
			updatedAt: new Date().toISOString(),
		};

		await writeDB(db);

		return NextResponse.json(db.documents[documentIndex]);
	} catch (error) {
		console.error('Error updating document:', error);
		return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const db = await readDB();
		const { searchParams } = new URL(request.url);
		const id = searchParams.get('id');

		if (!id) {
			return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
		}

		// Filter out the document to delete
		const initialLength = db.documents.length;
		db.documents = db.documents.filter((doc) => doc.id !== id);

		if (db.documents.length === initialLength) {
			return NextResponse.json({ error: 'Document not found' }, { status: 404 });
		}

		await writeDB(db);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting document:', error);
		return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
	}
}
