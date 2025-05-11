import { Request, Response } from 'express';
import path from 'path';
import { promises as fsPromises } from 'fs';
import * as claudeService from '../services/claudeService';
import type { ChatMessage } from '../services/claudeService'; // Импортируем тип из claudeService

const TEMP_DIR_NAME = 'temp';
const TEMP_DIR_PATH = path.join(process.cwd(), TEMP_DIR_NAME);

// Вспомогательная функция для чтения файла и кодирования в Base64
async function readFileAsBase64(filePath: string): Promise<string> {
	try {
		const fileData = await fsPromises.readFile(filePath);
		return fileData.toString('base64');
	} catch (error) {
		console.error('Error reading file for Base64 encoding:', filePath, error);
		throw new Error(`Failed to read file for chat: ${path.basename(filePath)}`);
	}
}

interface ChatRequestBody {
	relativeDocumentPath: string; // Относительный путь к документу в директории temp (e.g., '12345-mydoc.pdf')
	message: string;
	chatHistory?: ChatMessage[];
	model?: string;
}

export const handleChat = async (req: Request, res: Response): Promise<void> => {
	try {
		const { relativeDocumentPath, message, chatHistory = [], model } = req.body as ChatRequestBody;

		if (!relativeDocumentPath || !message) {
			res.status(400).json({ message: 'relativeDocumentPath and message are required' });
			return;
		}

		// Формируем абсолютный путь к документу, обеспечивая безопасность
		const safeRelativePath = path.basename(relativeDocumentPath); // Убираем возможные ../
		const absoluteDocumentPath = path.join(TEMP_DIR_PATH, safeRelativePath);

		// Проверяем существование файла
		try {
			await fsPromises.access(absoluteDocumentPath);
		} catch (error) {
			console.error('Document not found for chat:', absoluteDocumentPath);
			res.status(404).json({ message: `Document not found: ${safeRelativePath}` });
			return;
		}

		const base64PdfData = await readFileAsBase64(absoluteDocumentPath);

		console.log(`Processing chat for document: ${safeRelativePath} with message: "${message}"`);

		const claudeResponse = await claudeService.analyzePdfWithClaude(
			base64PdfData,
			message,
			chatHistory,
			model, // model может быть undefined, claudeService использует дефолтный
		);

		res.status(200).json({ response: claudeResponse });
	} catch (error) {
		console.error('Error in handleChat:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to process chat request';
		// Определяем статус код ошибки, если это возможно
		let statusCode = 500;
		if (errorMessage.includes('Claude API key not configured')) statusCode = 503; // Service Unavailable
		if (errorMessage.includes('Document not found')) statusCode = 404;

		res.status(statusCode).json({ message: errorMessage });
	}
};
