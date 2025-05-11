import Anthropic from '@anthropic-ai/sdk';

// Типы, специфичные для Claude API
interface DocumentSource {
	type: 'base64';
	media_type: 'application/pdf'; // Пока поддерживаем только PDF
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

export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

interface MessageWithContent {
	role: 'user' | 'assistant';
	content: string | ContentItem[];
}

/**
 * Анализирует документ (PDF в Base64) с использованием Claude API.
 * @param base64PdfData Base64-кодированные данные PDF.
 * @param question Вопрос к документу.
 * @param previousMessages Предыдущие сообщения в беседе.
 * @param model Модель Claude для использования.
 * @returns Ответ от Claude API.
 */
export async function analyzePdfWithClaude(
	base64PdfData: string,
	question: string,
	previousMessages: ChatMessage[] = [],
	model: string = process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
): Promise<string> {
	try {
		const apiKey = process.env.CLAUDE_API_KEY;
		if (!apiKey) {
			console.error('CLAUDE_API_KEY not found in environment variables');
			throw new Error('Claude API key not configured');
		}

		const anthropic = new Anthropic({ apiKey });

		const userContent: ContentItem[] = [
			{
				type: 'document',
				source: {
					type: 'base64',
					media_type: 'application/pdf',
					data: base64PdfData,
				},
			},
			{
				type: 'text',
				text: question,
			},
		];

		const messages: MessageWithContent[] = previousMessages.map((msg) => ({
			role: msg.role,
			content: msg.content,
		}));

		messages.push({
			role: 'user',
			content: userContent,
		});

		const systemPrompt = `Вы внимательный ИИ-ассистент, отвечающий на вопросы по предоставленному PDF-документу. Ваши ответы должны быть точными, подробными и основываться исключительно на содержимом документа. Отвечайте на русском языке.`;

		console.log(`Sending ${messages.length} messages to Claude model: ${model}`);

		const response = await anthropic.messages.create({
			model,
			max_tokens: 4000,
			temperature: 0.3,
			system: systemPrompt,
			messages: messages as any, // Используем any из-за возможных нюансов с типизацией SDK для сложных content структур
		});

		console.log(`Claude API usage: ${response.usage.input_tokens} input, ${response.usage.output_tokens} output tokens.`);

		const textResponse = response.content
			.filter((item) => item.type === 'text')
			.map((item) => (item.type === 'text' ? item.text : ''))
			.join('\n');

		return textResponse;
	} catch (error) {
		console.error('Error analyzing PDF with Claude:', error);
		// Преобразуем ошибку в более информативный вид, если это ошибка Anthropic API
		if (error instanceof Anthropic.APIError) {
			throw new Error(`Claude API Error: ${error.status} ${error.name} - ${error.message}`);
		}
		throw error; // Перебрасываем оригинальную ошибку, если это не ошибка API
	}
}

// Если в будущем понадобится поддержка анализа по URL напрямую через Claude (устаревший метод из старого кода),
// можно будет добавить сюда адаптированную функцию, но текущий фокус на Base64 PDF.
