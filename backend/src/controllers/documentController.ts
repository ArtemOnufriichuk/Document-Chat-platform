import { Request, Response } from 'express';
import * as dbService from '../services/databaseService';
import type { Document, DB } from '../types/commonTypes';

// Получить все документы
export const getAllDocuments = async (req: Request, res: Response): Promise<void> => {
	try {
		const documents = await dbService.getDocuments();
		res.status(200).json(documents);
	} catch (error) {
		console.error('Error in getAllDocuments:', error);
		res.status(500).json({ message: 'Failed to get documents' });
	}
};

// Создать новый документ
export const createDocument = async (req: Request, res: Response): Promise<void> => {
	try {
		const { title, url } = req.body;

		if (!title || !url) {
			res.status(400).json({ message: 'Title and URL are required' });
			return;
		}

		const db = await dbService.readDB();
		// Проверка на дубликат URL, если нужно
		const existingDocument = db.documents.find((doc) => doc.url === url);
		if (existingDocument) {
			res.status(409).json({ message: 'Document with this URL already exists' });
			return;
		}

		const newDocument: Document = {
			id: Date.now().toString(), // Простой генератор ID
			title,
			url,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		db.documents.push(newDocument);
		await dbService.writeDB(db);
		res.status(201).json(newDocument);
	} catch (error) {
		console.error('Error in createDocument:', error);
		res.status(500).json({ message: 'Failed to create document' });
	}
};

// Обновить документ по ID
export const updateDocument = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const { title, url } = req.body;

		if (!id) {
			res.status(400).json({ message: 'Document ID is required' });
			return;
		}
		// Хотя бы одно поле для обновления должно быть предоставлено
		if (!title && !url) {
			res.status(400).json({ message: 'At least one field (title or url) must be provided for update' });
			return;
		}

		const db = await dbService.readDB();
		const docIndex = db.documents.findIndex((doc) => doc.id === id);

		if (docIndex === -1) {
			res.status(404).json({ message: 'Document not found' });
			return;
		}

		// Обновляем только предоставленные поля
		const updatedDoc = { ...db.documents[docIndex] };
		if (title) updatedDoc.title = title;
		if (url) {
			// Проверка на дубликат URL при обновлении, если новый URL отличается от старого
			if (url !== db.documents[docIndex].url) {
				const existingDocumentWithNewUrl = db.documents.find((d) => d.url === url && d.id !== id);
				if (existingDocumentWithNewUrl) {
					res.status(409).json({ message: 'Another document with this URL already exists' });
					return;
				}
			}
			updatedDoc.url = url;
		}
		updatedDoc.updatedAt = new Date().toISOString();

		db.documents[docIndex] = updatedDoc;
		await dbService.writeDB(db);
		res.status(200).json(updatedDoc);
	} catch (error) {
		console.error('Error in updateDocument:', error);
		res.status(500).json({ message: 'Failed to update document' });
	}
};

// Удалить документ по ID
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		if (!id) {
			res.status(400).json({ message: 'Document ID is required' });
			return;
		}

		const db = await dbService.readDB();
		const initialLength = db.documents.length;
		db.documents = db.documents.filter((doc) => doc.id !== id);

		if (db.documents.length === initialLength) {
			res.status(404).json({ message: 'Document not found or already deleted' });
			return;
		}

		await dbService.writeDB(db);
		res.status(200).json({ message: 'Document deleted successfully' }); // или 204 No Content
	} catch (error) {
		console.error('Error in deleteDocument:', error);
		res.status(500).json({ message: 'Failed to delete document' });
	}
};
