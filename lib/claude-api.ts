/**
 * Claude API integration for document analysis
 */
import Anthropic from '@anthropic-ai/sdk';

// Типы для работы с документами в новом формате API
interface DocumentSource {
	type: 'base64';
	media_type: 'application/pdf';
	data: string;
}

interface DocumentContent {
	type: 'document';
	source: DocumentSource;
}

interface TextContent {
	type: 'text';
	text: string;
}

type ContentItem = DocumentContent | TextContent;

// Chat message types matching Anthropic API requirements
type MessageRole = 'user' | 'assistant';
interface ChatMessage {
	role: MessageRole;
	content: string;
}

// Расширенный интерфейс для сообщений с поддержкой документов
interface MessageWithContent {
	role: MessageRole;
	content: string | ContentItem[];
}

/**
 * Analyze documents using Claude API
 * @param documentData Base64-encoded PDF data or array of document URLs
 * @param documentTitle Title of the document or array of document titles
 * @param question The question to ask about the documents
 * @param previousMessages Previous messages in the conversation
 * @param model The Claude model to use (defaults to claude-3-haiku-20240307)
 * @returns The analysis result as a string
 */
export async function analyzeDocumentsWithClaude(
	documentData: string | string[],
	documentTitle: string | string[],
	question: string,
	previousMessages: ChatMessage[] = [],
	model: string = 'claude-3-haiku-20240307',
): Promise<string> {
	try {
		// Check if API key is available
		const apiKey = process.env.CLAUDE_API_KEY;
		if (!apiKey) {
			throw new Error('Claude API key not found in environment variables');
		}

		// Initialize the Anthropic client
		const anthropic = new Anthropic({
			apiKey,
		});

		// Handle both base64-encoded PDF and URL-based documents
		if (typeof documentData === 'string' && typeof documentTitle === 'string') {
			// Base64-encoded PDF
			console.log('Используем base64-кодированный PDF документ');
			
			// Prepare document content for the API
			const userContent: ContentItem[] = [
				{
					type: 'document',
					source: {
						type: 'base64',
						media_type: 'application/pdf',
						data: documentData
					}
				},
				{
					type: 'text',
					text: question
				}
			];
			
			// Log the previous messages for debugging
			console.log(`Processing conversation with ${previousMessages.length} previous messages`);
			
			// Prepare messages array with previous messages
			const messages: MessageWithContent[] = previousMessages.map(msg => ({
				role: msg.role,
				content: msg.content
			}));
			
			// Add the current user message with document
			messages.push({
				role: 'user',
				content: userContent
			});
			
			// Create a system prompt for PDF analysis
			const systemPrompt = `Вы помогаете анализировать документы и отвечать на вопросы о них на русском языке. 
Внимательно изучите предоставленный PDF-документ, обращая внимание на текст, таблицы, графики и изображения.
Ваши ответы должны быть подробными, точными и основанными исключительно на содержимом предоставленного документа.`;

			// Call Claude API using the SDK with proper typing
			const response = await anthropic.messages.create({
				model,
				max_tokens: 4000,
				temperature: 0.3,
				system: systemPrompt,
				messages: messages as any, // Используем any для обхода проблем с типизацией SDK
			});

			// Keep this log for API usage monitoring
			console.log(`Claude API usage: ${response.usage.input_tokens} input tokens, ${response.usage.output_tokens} output tokens`);

			// Extract the text response
			const textResponse = response.content
				.filter((item) => item.type === 'text')
				.map((item) => (item.type === 'text' ? item.text : ''))
				.join('\n');

			return textResponse;
			
		} else if (Array.isArray(documentData) && Array.isArray(documentTitle)) {
			// URL-based documents (legacy support)
			console.log('Используем URL-документы (устаревший метод)');
			
			// Create system prompt
			let systemPrompt;

			// If this is a new conversation, use a detailed system prompt
			if (previousMessages.length === 0) {
				systemPrompt = `# Анализ документов и ответ на вопросы

## Документы для анализа:
${documentData.map((url, i) => `${i + 1}. **${documentTitle[i]}**: ${url}`).join('\n')}

## Инструкции по анализу:
1. Внимательно изучите все предоставленные документы, обращая внимание на текст, таблицы, графики и изображения.
2. Проанализируйте содержимое каждого документа, выделяя ключевые факты, данные и информацию, относящуюся к вопросам.
3. Если в документах содержится противоречивая информация, укажите это и объясните различия.
4. Если вопрос требует сравнения информации из разных документов, выполните такое сравнение.
5. Если в документах недостаточно информации для полного ответа, честно укажите это.

## Правила ответа:
- Начинайте с краткого резюме (2-3 предложения)
- Структурируйте ответы с использованием подзаголовков для лучшей читаемости
- Используйте маркированные списки для перечисления ключевых пунктов
- При цитировании конкретных данных указывайте источник (номер документа)
- Завершайте ответ кратким заключением

Ваши ответы должны быть подробными, точными и основанными исключительно на содержимом предоставленных документов. Отвечайте на русском языке.`;
			} else {
				// For continued conversations, use a shorter system prompt
				systemPrompt = `Вы помогаете анализировать документы и отвечать на вопросы о них на русском языке. Документы: ${documentData
					.map((url, i) => `${i + 1}. ${documentTitle[i]}: ${url}`)
					.join(', ')}.`;
			}
			
			// Log the previous messages for debugging
			console.log(`Processing conversation with ${previousMessages.length} previous messages`);

			// Call Claude API using the SDK with proper typing
			const response = await anthropic.messages.create({
				model,
				max_tokens: 4000,
				temperature: 0.3,
				system: systemPrompt,
				messages: [...previousMessages, { role: 'user' as const, content: question }],
			});

			// Keep this log for API usage monitoring
			console.log(`Claude API usage: ${response.usage.input_tokens} input tokens, ${response.usage.output_tokens} output tokens`);

			// Extract the text response
			const textResponse = response.content
				.filter((item) => item.type === 'text')
				.map((item) => (item.type === 'text' ? item.text : ''))
				.join('\n');

			return textResponse;
		} else {
			throw new Error('Несовместимые типы параметров documentData и documentTitle');
		}
	} catch (error) {
		console.error('Error analyzing documents with Claude:', error);
		throw error; // Rethrow to allow proper handling by the API route
	}
}
