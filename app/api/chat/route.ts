import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { analyzeDocumentsWithClaude } from '@/lib/claude-api';

// Chat message types matching Anthropic API requirements
type MessageRole = 'user' | 'assistant';
interface ChatMessage {
	role: MessageRole;
	content: string;
}

// Chat request structure
interface ChatRequestBody {
	message: string;
	documentIds: string[];
	chatHistory?: ChatMessage[];
}

// Document model without content field
interface ProcessedDocument {
	id: string;
	title: string;
	url: string;
	createdAt: string;
	updatedAt: string;
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

	if (!Array.isArray(body.documentIds) || body.documentIds.length === 0) {
		return { valid: false, error: 'Missing or invalid documentIds' };
	}

	if (body.chatHistory && !Array.isArray(body.chatHistory)) {
		return { valid: false, error: 'Invalid chatHistory format' };
	}

	return { valid: true };
}

/**
 * Get document information with URLs for AI
 */
async function getDocumentsInfo(documentIds: string[]): Promise<{ urls: string[]; titles: string[] }> {
	try {
		// Fetch the documents from the API
		// Get the API URL from environment or use a default
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

		// Create the fetch URL with appropriate origin
		const fetchUrl = `${apiUrl}/api/documents?ids=${documentIds.join(',')}`;

		console.log(`Fetching documents from: ${fetchUrl}`);

		const response = await fetch(fetchUrl, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
			// Add this to ensure fetch works correctly on both client and server
			next: { revalidate: 0 },
		});

		if (!response.ok) {
			throw new Error(`Не удалось получить документы (${response.status})`);
		}

		const documents = (await response.json()) as ProcessedDocument[];
		if (!documents || documents.length === 0) {
			throw new Error('Не удалось получить URL документов');
		}

		// Get document URLs and titles
		const documentUrls = documents.map((doc) => doc.url);
		const documentTitles = documents.map((doc) => doc.title);

		return {
			urls: documentUrls,
			titles: documentTitles,
		};
	} catch (error) {
		console.error('Error processing document information:', error);
		throw error; // Rethrow to handle in the main function
	}
}

export async function POST(request: NextRequest) {
	// Set timeout to prevent hanging requests
	const requestStartTime = Date.now();
	const MAX_REQUEST_TIME = 55000; // 55 seconds (for Vercel's 60s limit)

	try {
		// Parse and validate request
		const body = (await request.json()) as ChatRequestBody;
		const validation = validateRequest(body);
		if (!validation.valid) {
			return NextResponse.json({ error: validation.error }, { status: 400 });
		}

		const { message, documentIds, chatHistory = [] } = body;

		try {
			// Check for timeout
			if (Date.now() - requestStartTime > MAX_REQUEST_TIME * 0.5) {
				throw new Error('Обработка заняла слишком много времени');
			}

			// Get document URLs and titles
			const { urls: documentUrls, titles: documentTitles } = await getDocumentsInfo(documentIds);

			if (documentUrls.length === 0) {
				throw new Error('Не удалось получить URL документов');
			}

			// Choose Claude model based on environment or default to Haiku
			const claudeModel = process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307';

			// Log chat history for debugging
			console.log(`Processing chat with ${chatHistory.length} previous messages`);

			// Process document with Claude API including chat history
			const analysisResult = await analyzeDocumentsWithClaude(documentUrls, documentTitles, message, chatHistory, claudeModel);

			return NextResponse.json({
				response: analysisResult,
				documentIds,
			});
		} catch (apiError) {
			console.error('Error analyzing documents:', apiError);

			// Handle different error types
			let errorMessage = 'Не удалось проанализировать документы';

			if (apiError instanceof Error) {
				const errorString = apiError.toString().toLowerCase();

				if (errorString.includes('timeout') || Date.now() - requestStartTime > MAX_REQUEST_TIME * 0.9) {
					errorMessage = 'Запрос занял слишком много времени. Попробуйте позже.';
				} else if (errorString.includes('rate limit') || errorString.includes('rate_limit')) {
					errorMessage = 'Превышен лимит запросов. Попробуйте позже.';
				} else if (errorString.includes('api key') || errorString.includes('authentication')) {
					errorMessage = 'Проблема с API ключом. Пожалуйста, проверьте настройки.';
				} else if (errorString.includes('access') || errorString.includes('permission')) {
					errorMessage = 'Не удалось получить доступ к документу. Убедитесь, что документ доступен по ссылке.';
				} else if (errorString.includes('context') || errorString.includes('token')) {
					errorMessage = 'Документ слишком большой для анализа. Попробуйте разделить его на части.';
				} else if (errorString.includes('network') || errorString.includes('fetch')) {
					errorMessage = 'Проблема с сетевым подключением. Проверьте подключение к интернету.';
				} else {
					errorMessage = `Ошибка: ${apiError.message}`;
				}
			}

			return NextResponse.json(
				{
					error: errorMessage,
					details: process.env.NODE_ENV === 'development' ? String(apiError) : undefined,
				},
				{ status: 502 },
			);
		}
	} catch (error) {
		console.error('Error in chat API:', error);
		return NextResponse.json({ error: 'Не удалось обработать запрос чата' }, { status: 500 });
	}
}
