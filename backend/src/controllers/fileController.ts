import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

const TEMP_DIR_NAME = 'temp';
const TEMP_DIR_PATH = path.join(process.cwd(), TEMP_DIR_NAME);

// Вспомогательная функция для проверки и создания директории
async function ensureDirectoryExists(dirPath: string): Promise<void> {
	try {
		await fsPromises.access(dirPath);
		// console.log('Directory already exists:', dirPath); // Можно закомментировать для чистоты логов
	} catch (error) {
		// console.log('Directory does not exist, creating:', dirPath);
		await fsPromises.mkdir(dirPath, { recursive: true });
		// console.log('Directory successfully created:', dirPath);
	}
}

// Вспомогательная функция для скачивания файла (упрощенная)
async function downloadFile(url: string, outputPath: string): Promise<void> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download file: ${response.status} ${response.statusText} from ${url}`);
	}
	const buffer = await response.arrayBuffer();
	await fsPromises.writeFile(outputPath, Buffer.from(buffer));
}

// Контроллер для обеспечения существования temp директории
export const ensureTempDir = async (req: Request, res: Response): Promise<void> => {
	try {
		await ensureDirectoryExists(TEMP_DIR_PATH);
		res.status(200).json({ message: 'Temp directory ensured', path: TEMP_DIR_PATH });
	} catch (error) {
		console.error('Error ensuring temp directory:', error);
		res.status(500).json({ message: 'Failed to ensure temp directory' });
	}
};

// Контроллер для скачивания внешнего документа
export const downloadExternalDocument = async (req: Request, res: Response): Promise<void> => {
	try {
		const { fileUrl, fileName } = req.body;
		if (!fileUrl || !fileName) {
			res.status(400).json({ message: 'fileUrl and fileName are required' });
			return;
		}

		await ensureDirectoryExists(TEMP_DIR_PATH);

		const safeFileName = `${Date.now()}-${path.basename(fileName).replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
		const outputPath = path.join(TEMP_DIR_PATH, safeFileName);

		console.log(`Downloading from ${fileUrl} to ${outputPath}`);
		await downloadFile(fileUrl, outputPath);
		console.log(`Successfully downloaded ${fileUrl}`);

		res.status(200).json({
			message: 'Document downloaded successfully',
			filePath: path.join(TEMP_DIR_NAME, safeFileName),
			absolutePath: outputPath,
		});
	} catch (error) {
		console.error('Error downloading external document:', error);
		res.status(500).json({ message: 'Failed to download document', details: error instanceof Error ? error.message : String(error) });
	}
};

// Контроллер для проверки существования файла
export const checkFile = async (req: Request, res: Response): Promise<void> => {
	try {
		const { relativeFilePath } = req.body;
		if (!relativeFilePath) {
			res.status(400).json({ message: 'relativeFilePath is required' });
			return;
		}
		// Важно: path.basename() используется для безопасности, чтобы предотвратить выход за пределы TEMP_DIR_PATH
		const absoluteFilePath = path.join(TEMP_DIR_PATH, path.basename(relativeFilePath));

		await fsPromises.access(absoluteFilePath);
		res.status(200).json({ exists: true, filePath: relativeFilePath, message: 'File exists' });
	} catch (error) {
		res.status(200).json({ exists: false, filePath: req.body.relativeFilePath, message: 'File not found or not accessible' });
	}
};

// Контроллер для удаления файла
export const deleteTempFile = async (req: Request, res: Response): Promise<void> => {
	try {
		const { relativeFilePath } = req.body;
		if (!relativeFilePath) {
			res.status(400).json({ message: 'relativeFilePath is required' });
			return;
		}
		const absoluteFilePath = path.join(TEMP_DIR_PATH, path.basename(relativeFilePath));

		try {
			await fsPromises.access(absoluteFilePath);
			await fsPromises.unlink(absoluteFilePath);
			res.status(200).json({ message: 'File deleted successfully', filePath: relativeFilePath });
		} catch (accessError) {
			res.status(200).json({ message: 'File not found or already deleted', filePath: relativeFilePath });
		}
	} catch (error) {
		console.error('Error deleting temp file:', error);
		res.status(500).json({ message: 'Failed to delete file' });
	}
};
