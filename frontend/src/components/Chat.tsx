import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/ToastContext';
import { chatApi, filesApi } from '../lib/api';

interface ChatProps {
	documentId: string;
	documentPath?: string;
}

interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp?: Date;
}

export default function Chat({ documentId, documentPath }: ChatProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [userInput, setUserInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [downloadedDocPath, setDownloadedDocPath] = useState<string | null>(null);
	const [isDownloading, setIsDownloading] = useState(false);
	const { showToast } = useToast();
	const { documents } = useAppStore();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Прокрутка к последнему сообщению
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// Фокус на поле ввода при монтировании
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	// Очистка скачанного документа при размонтировании
	useEffect(() => {
		return () => {
			if (downloadedDocPath) {
				deleteDownloadedDocument();
			}
		};
	}, [downloadedDocPath]);

	// Извлечение ID документа из URL
	const extractDocIdFromUrl = (url: string): string | null => {
		if (!url) return null;

		// Формат 1: https://drive.google.com/file/d/DOCUMENT_ID/view
		let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]{25,})/);
		if (match && match[1]) {
			return match[1];
		}

		// Формат 2: https://drive.google.com/open?id=DOCUMENT_ID
		match = url.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
		if (match && match[1]) {
			return match[1];
		}

		// Формат 3: https://docs.google.com/document/d/DOCUMENT_ID/edit
		match = url.match(/\/document\/d\/([a-zA-Z0-9_-]{25,})/);
		if (match && match[1]) {
			return match[1];
		}

		// Формат 4: https://docs.google.com/spreadsheets/d/DOCUMENT_ID/edit
		match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{25,})/);
		if (match && match[1]) {
			return match[1];
		}

		// Формат 5: https://docs.google.com/presentation/d/DOCUMENT_ID/edit
		match = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]{25,})/);
		if (match && match[1]) {
			return match[1];
		}

		return null;
	};

	// Удаление скачанного документа
	const deleteDownloadedDocument = useCallback(async () => {
		if (downloadedDocPath) {
			try {
				await filesApi.deleteFile(downloadedDocPath);
				setDownloadedDocPath(null);
			} catch (error) {
				console.error('Ошибка при удалении документа:', error);
			}
		}
	}, [downloadedDocPath]);

	// Скачивание документа
	const downloadDocument = async (docId: string) => {
		try {
			setIsDownloading(true);

			// Проверяем/создаем временную директорию
			await filesApi.ensureTempDir();

			// Формируем URL и путь для файла
			const fileName = `${docId}.pdf`;
			const fileUrl = `https://drive.usercontent.google.com/uc?id=${docId}&export=download`;

			// Скачиваем файл
			const response = await filesApi.downloadExternal(fileUrl, fileName);

			if (response && response.filePath) {
				setDownloadedDocPath(response.filePath);
				showToast({
					title: 'Документ скачан',
					description: 'Документ успешно загружен',
					type: 'success',
				});
				return response.filePath;
			}

			throw new Error('Не удалось получить путь к документу');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Ошибка при скачивании документа';
			showToast({
				title: 'Ошибка',
				description: errorMessage,
				type: 'error',
			});
			throw error;
		} finally {
			setIsDownloading(false);
		}
	};

	// Отправка сообщения
	const sendMessage = async () => {
		if (!userInput.trim() || !documentPath) return;

		// Добавляем сообщение пользователя
		const userMessage: ChatMessage = {
			role: 'user',
			content: userInput,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);

		// Сохраняем и очищаем ввод пользователя
		const messageText = userInput;
		setUserInput('');

		try {
			setIsLoading(true);
			setError(null);

			// Показать уведомление о начале обработки запроса
			showToast({
				title: 'Обработка',
				description: 'Ваше сообщение обрабатывается...',
				type: 'info',
				duration: 2000,
			});

			// Подготовка пути к документу
			let docPath = downloadedDocPath;

			// Если путь пустой, но есть документ с ID - скачать
			if (!docPath && documentId) {
				const selectedDoc = documents.find((doc) => doc.id === documentId);
				if (selectedDoc) {
					const docId = extractDocIdFromUrl(selectedDoc.url);
					if (docId) {
						docPath = await downloadDocument(docId);
					}
				}
			}

			// Финальная проверка пути
			const finalPath = docPath || documentPath;
			if (!finalPath) {
				throw new Error('Не удалось получить путь к документу');
			}

			// Преобразуем сообщения в формат API
			const apiMessages = messages.map((msg) => ({
				role: msg.role,
				content: msg.content,
			}));

			// Отправляем запрос к API
			const response = await chatApi.sendMessage(finalPath, messageText, apiMessages);

			// Добавляем ответ ассистента
			if (response && response.response) {
				const assistantMessage: ChatMessage = {
					role: 'assistant',
					content: response.response,
					timestamp: new Date(),
				};

				setMessages((prev) => [...prev, assistantMessage]);

				showToast({
					title: 'Ответ получен',
					description: 'Ассистент ответил на ваш вопрос',
					type: 'success',
				});
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Ошибка при отправке сообщения';
			setError(errorMessage);

			showToast({
				title: 'Ошибка',
				description: errorMessage,
				type: 'error',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Обработка нажатия Enter
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	// Очистка чата
	const clearChat = () => {
		setMessages([]);
		setError(null);
	};

	return (
		<Card className='flex flex-col h-[500px] max-h-[70vh]'>
			<CardHeader className='p-4 border-b'>
				<CardTitle className='text-xl flex justify-between items-center'>
					<span>Чат с документом</span>
					{messages.length > 0 && (
						<Button variant='ghost' onClick={clearChat} className='text-sm'>
							Очистить чат
						</Button>
					)}
				</CardTitle>
			</CardHeader>

			{/* Область сообщений */}
			<CardContent className='flex-grow overflow-y-auto p-4'>
				{messages.length === 0 ? (
					<div className='flex h-full items-center justify-center text-gray-400'>
						<p>Задайте вопрос о документе...</p>
					</div>
				) : (
					<div className='space-y-4'>
						{messages.map((msg, index) => (
							<div key={index} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 ml-10' : 'bg-gray-50 mr-10'}`}>
								<div className='font-semibold mb-1'>{msg.role === 'user' ? 'Вы:' : 'Ассистент:'}</div>
								<div className='whitespace-pre-wrap'>{msg.content}</div>
								{msg.timestamp && <div className='text-xs text-gray-500 mt-1'>{msg.timestamp.toLocaleTimeString()}</div>}
							</div>
						))}
						<div ref={messagesEndRef} />
					</div>
				)}

				{isLoading && (
					<div className='flex justify-center my-2'>
						<div className='animate-pulse text-gray-500'>Анализирую документ...</div>
					</div>
				)}

				{error && <div className='bg-red-50 p-3 rounded-md border border-red-200 text-red-600 my-2'>{error}</div>}
			</CardContent>

			{/* Область ввода */}
			<CardFooter className='border-t p-4'>
				<div className='flex w-full'>
					<Input
						ref={inputRef}
						value={userInput}
						onChange={(e) => setUserInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder='Введите вопрос...'
						disabled={isLoading || !documentPath || isDownloading}
						className='flex-grow mr-2'
					/>
					<Button onClick={sendMessage} disabled={isLoading || !userInput.trim() || !documentPath || isDownloading}>
						{isLoading ? 'Отправка...' : 'Отправить'}
					</Button>
				</div>
				{!documentPath && <p className='text-orange-500 text-xs mt-2'>Выберите документ для начала чата</p>}
				{isDownloading && <p className='text-blue-500 text-xs mt-2'>Загрузка документа...</p>}
			</CardFooter>
		</Card>
	);
}
