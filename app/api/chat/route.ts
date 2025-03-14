import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { analyzeDocumentsWithClaude } from '@/lib/claude-api';

import path from 'path';
import { promises as fsPromises } from 'fs';

// Chat message types matching Anthropic API requirements
type MessageRole = 'user' | 'assistant';
interface ChatMessage {
	role: MessageRole;
	content: string;
}

// Chat request structure
interface ChatRequestBody {
	message: string;
	documentPath: string;
	chatHistory?: ChatMessage[];
}

/**
 * Validates the request body
 */
function validateRequest(body: any): { valid: boolean; error?: string } {
	if (!body) {
		return { valid: false, error: 'Missing request body' };
	}

	if (!body.message || typeof body.message !== 'string') {
		return { valid: false, error: 'Missing or invalid message' };
	}

	// Более гибкая проверка documentPath
	if (!body.documentPath) {
		console.warn('Отсутствует путь к документу в запросе, будем искать в директории temp');
		// Не возвращаем ошибку, попробуем найти документ в директории temp
	}

	if (body.chatHistory && !Array.isArray(body.chatHistory)) {
		return { valid: false, error: 'Invalid chatHistory format' };
	}

	return { valid: true };
}

/**
 * Проверяет существование файла
 */
async function checkFileExists(filePath: string): Promise<boolean> {
	try {
		console.log('Проверяем существование файла:', filePath);
		await fsPromises.access(filePath);
		console.log('Файл существует');
		return true;
	} catch (error) {
		console.error('Ошибка при проверке файла:', error);
		return false;
	}
}

/**
 * Ищет PDF файлы в директории temp
 */
async function findPdfInTempDir(): Promise<string | null> {
	try {
		const tempDir = path.join(process.cwd(), 'temp');
		console.log('Ищем PDF файлы в директории:', tempDir);
		
		const files = await fsPromises.readdir(tempDir);
		console.log('Найденные файлы в директории temp:', files);
		
		// Ищем первый PDF файл
		const pdfFile = files.find(file => file.toLowerCase().endsWith('.pdf'));
		
		if (pdfFile) {
			const filePath = path.join(tempDir, pdfFile);
			console.log('Найден PDF файл:', filePath);
			return filePath;
		}
		
		console.log('PDF файлы не найдены в директории temp');
		return null;
	} catch (error) {
		console.error('Ошибка при поиске PDF файлов:', error);
		return null;
	}
}

/**
 * Читает файл и кодирует его в base64
 */
async function readFileAsBase64(filePath: string): Promise<string> {
	try {
		console.log('Читаем файл для кодирования в base64:', filePath);
		const fileData = await fsPromises.readFile(filePath);
		const base64Data = fileData.toString('base64');
		console.log('Файл успешно прочитан и закодирован в base64');
		return base64Data;
	} catch (error) {
		console.error('Ошибка при чтении файла:', error);
		throw error;
	}
}

export async function POST(request: NextRequest) {
	// Set timeout to prevent hanging requests
	const requestStartTime = Date.now();
	const MAX_REQUEST_TIME = 55000; // 55 seconds (for Vercel's 60s limit)

	try {
		console.log('=== НАЧАЛО ОБРАБОТКИ ЗАПРОСА В API CHAT ===');
		
		// Parse and validate request
		const requestText = await request.text();
		console.log('Полученный текст запроса:', requestText);
		
		let body;
		try {
			body = JSON.parse(requestText) as ChatRequestBody;
		} catch (parseError) {
			console.error('Ошибка при парсинге JSON:', parseError);
			return NextResponse.json({ error: 'Некорректный формат JSON' }, { status: 400 });
		}
		
		console.log('Получен запрос:', { 
			message: body.message, 
			documentPath: body.documentPath, 
			chatHistoryLength: body.chatHistory?.length 
		});
		
		const validation = validateRequest(body);
		if (!validation.valid) {
			console.error('Ошибка валидации:', validation.error);
			return NextResponse.json({ error: validation.error }, { status: 400 });
		}

		let { message, documentPath, chatHistory = [] } = body;
		console.log('Путь к документу после деструктуризации:', documentPath);
		console.log('Тип documentPath:', typeof documentPath);

		try {
			// Check for timeout
			if (Date.now() - requestStartTime > MAX_REQUEST_TIME * 0.5) {
				throw new Error('Обработка заняла слишком много времени');
			}

			// Если путь к документу не указан, попробуем найти PDF в директории temp
			if (!documentPath) {
				console.log('Путь к документу не указан, ищем PDF в директории temp');
				const foundPdfPath = await findPdfInTempDir();
				
				if (foundPdfPath) {
					documentPath = foundPdfPath;
					console.log('Используем найденный PDF файл:', documentPath);
				} else {
					throw new Error('Документ не найден в директории temp');
				}
			}

			// Формируем абсолютный путь, если передан относительный
			const absoluteDocumentPath = path.isAbsolute(documentPath) 
				? documentPath 
				: path.join(process.cwd(), documentPath);
				
			console.log('Абсолютный путь к документу:', absoluteDocumentPath);
			console.log('Текущая директория:', process.cwd());

			// Проверяем существование файла
			const fileExists = await checkFileExists(absoluteDocumentPath);
			console.log('Файл существует:', fileExists);
			
			if (!fileExists) {
				console.error('Документ не найден по пути:', absoluteDocumentPath);
				console.error('Текущая директория:', process.cwd());
				
				// Попробуем проверить содержимое директории temp
				try {
					const tempDir = path.join(process.cwd(), 'temp');
					const files = await fsPromises.readdir(tempDir);
					console.log('Содержимое директории temp:', files);
				} catch (readError) {
					console.error('Ошибка при чтении директории temp:', readError);
				}
				
				throw new Error('Документ не найден или был удален');
			}

			// Получаем имя файла для отображения
			const fileName = path.basename(absoluteDocumentPath);
			console.log('Имя файла:', fileName);
			
			// Читаем файл и кодируем его в base64
			console.log('Кодируем файл в base64 для отправки в Claude API...');
			const base64Data = await readFileAsBase64(absoluteDocumentPath);
			
			// Создаем заголовок документа
			const documentTitle = `Документ ${fileName}`;
			console.log('Заголовок документа:', documentTitle);

			// Choose Claude model based on environment or default to Haiku
			const claudeModel = process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307';
			console.log('Используемая модель Claude:', claudeModel);

			// Log chat history for debugging
			console.log(`Обработка чата с ${chatHistory.length} предыдущими сообщениями`);

			// Process document with Claude API including chat history
			console.log('Отправляем запрос к Claude API с закодированным документом...');
			const analysisResult = await analyzeDocumentsWithClaude(
				base64Data,
				documentTitle, 
				message, 
				chatHistory, 
				claudeModel
			);
			console.log('Получен ответ от Claude API');
			console.log('=== КОНЕЦ ОБРАБОТКИ ЗАПРОСА В API CHAT ===');

			return NextResponse.json({
				response: analysisResult,
				documentPath,
			});
		} catch (apiError) {
			console.error('Ошибка при анализе документа:', apiError);

			// Handle different error types
			let errorMessage = 'Не удалось проанализировать документ';

			if (apiError instanceof Error) {
				const errorString = apiError.toString().toLowerCase();
				console.error('Текст ошибки:', errorString);

				if (errorString.includes('timeout') || Date.now() - requestStartTime > MAX_REQUEST_TIME * 0.9) {
					errorMessage = 'Запрос занял слишком много времени. Попробуйте позже.';
				} else if (errorString.includes('rate limit') || errorString.includes('rate_limit')) {
					errorMessage = 'Превышен лимит запросов. Попробуйте позже.';
				} else if (errorString.includes('api key') || errorString.includes('authentication')) {
					errorMessage = 'Проблема с API ключом. Пожалуйста, проверьте настройки.';
				} else if (errorString.includes('access') || errorString.includes('permission')) {
					errorMessage = 'Не удалось получить доступ к документу. Убедитесь, что документ доступен.';
				} else if (errorString.includes('context') || errorString.includes('token')) {
					errorMessage = 'Документ слишком большой для анализа. Попробуйте разделить его на части.';
				} else if (errorString.includes('network') || errorString.includes('fetch')) {
					errorMessage = 'Проблема с сетевым подключением. Проверьте подключение к интернету.';
				} else if (errorString.includes('не найден') || errorString.includes('not found')) {
					errorMessage = 'Документ не найден или был удален. Пожалуйста, выберите документ заново.';
				} else {
					errorMessage = `Ошибка: ${apiError.message}`;
				}
			}
			
			console.log('=== ОШИБКА ПРИ ОБРАБОТКЕ ЗАПРОСА В API CHAT ===');

			return NextResponse.json(
				{
					error: errorMessage,
					details: process.env.NODE_ENV === 'development' ? String(apiError) : undefined,
				},
				{ status: 502 },
			);
		}
	} catch (error) {
		console.error('Ошибка в API чата:', error);
		console.log('=== КРИТИЧЕСКАЯ ОШИБКА В API CHAT ===');
		return NextResponse.json({ error: 'Не удалось обработать запрос чата' }, { status: 500 });
	}
}
