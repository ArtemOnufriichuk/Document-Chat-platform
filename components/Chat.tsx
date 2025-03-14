'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, FileText, AlertCircle, X, Trash2, Check, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Constants for consistent timestamps
const TIME_FORMAT = { locale: ru, addSuffix: true };

// Define message roles as a union type to match the API
type MessageRole = 'user' | 'assistant';

// Chat message format
interface ChatMessage {
	role: MessageRole;
	content: string;
	timestamp?: Date;
}

// API message format (without timestamp)
interface ApiMessage {
	role: MessageRole;
	content: string;
}

// Convert our UI chat messages to the format expected by the API
const convertToApiMessages = (messages: ChatMessage[]): ApiMessage[] => {
	return messages.map((msg) => ({
		role: msg.role,
		content: msg.content,
	}));
};

// Memo component for message rendering to prevent unnecessary rerenders
const ChatMessageItem = React.memo(
	({ message }: { message: ChatMessage }) => {
		const isUser = message.role === 'user';
		const timestamp = message.timestamp ? formatDistanceToNow(message.timestamp, TIME_FORMAT) : '';

		return (
			<div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
				<div className={`max-w-[80%] rounded-lg p-3 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
					<div className='whitespace-pre-wrap'>{message.content}</div>
					{message.timestamp && <div className='text-xs mt-1 opacity-70'>{timestamp}</div>}
				</div>
			</div>
		);
	},
	(prevProps, nextProps) => {
		// Only rerender if the message content or timestamp changes
		return prevProps.message.content === nextProps.message.content && prevProps.message.timestamp?.getTime() === nextProps.message.timestamp?.getTime();
	},
);

ChatMessageItem.displayName = 'ChatMessageItem';

const Chat2 = () => {
	const [message, setMessage] = useState('');
	const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [documentSelectorOpen, setDocumentSelectorOpen] = useState(false);
	const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadedDocPath, setDownloadedDocPath] = useState<string | null>(null);

	// Get documents from store
	const documents = useAppStore((state) => state.documents);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	/**
	 * Удаляет скачанный документ
	 */
	const deleteDownloadedDocument = useCallback(async () => {
		if (downloadedDocPath) {
			try {
				console.log('Удаляем скачанный документ:', downloadedDocPath);
				
				// Отправляем запрос на сервер для удаления документа
				const response = await fetch('/api/delete-document', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ filePath: downloadedDocPath }),
				});

				if (!response.ok) {
					console.error('Не удалось удалить документ:', await response.text());
				} else {
					const data = await response.json();
					console.log('Ответ от сервера:', data);
					console.log('Документ успешно удален:', downloadedDocPath);
				}

				setDownloadedDocPath(null);
			} catch (error) {
				console.error('Ошибка при удалении документа:', error);
			}
		}
	}, [downloadedDocPath]);

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chatHistory]);

	// Focus input when component mounts
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	// Clean up downloaded document when component unmounts
	useEffect(() => {
		return () => {
			if (downloadedDocPath) {
				// Удаляем скачанный документ при завершении чата
				deleteDownloadedDocument();
			}
		};
	}, [downloadedDocPath, deleteDownloadedDocument]);

	/**
	 * Скачивает документ по Google Drive ID
	 */
	const downloadDocument = async (docId: string) => {
		try {
			console.log('=== НАЧАЛО СКАЧИВАНИЯ ДОКУМЕНТА ===');
			console.log('ID документа для скачивания:', docId);
			
			setIsDownloading(true);
			
			console.log('Начинаем скачивание документа с ID:', docId);
			
			// Формируем URL для скачивания по формату из задания
			const fileUrl = `https://drive.usercontent.google.com/uc?id=${docId}&export=download`;
			console.log('URL для скачивания:', fileUrl);
			
			// Создаем путь для сохранения файла - используем относительный путь
			const outputPath = `temp/${docId}.pdf`;
			console.log('Путь для сохранения файла:', outputPath);
			
			// Проверяем, существует ли директория temp
			console.log('Проверяем существование директории temp...');
			
			// Создаем директорию temp, если она не существует
			// Используем API вместо прямого создания директории
			try {
				console.log('Создаем директорию temp через API...');
				const dirResponse = await fetch('/api/create-temp-dir');
				
				if (!dirResponse.ok) {
					const errorText = await dirResponse.text();
					console.error('Ошибка при создании директории temp:', errorText);
					throw new Error('Не удалось создать директорию temp');
				} else {
					const dirData = await dirResponse.json();
					console.log('Информация о директории:', dirData);
				}
			} catch (error) {
				console.error('Ошибка при создании директории temp:', error);
				// Продолжаем выполнение, возможно директория уже существует
				console.log('Продолжаем скачивание, предполагая, что директория уже существует...');
			}
			
			// Скачиваем документ
			console.log('Отправляем запрос на скачивание документа...');
			const response = await fetch('/api/download-document', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ 
					fileUrl, 
					docId,
					outputPath 
				}),
			});

			console.log('Получен ответ от сервера скачивания, статус:', response.status);
			
			if (!response.ok) {
				const errorText = await response.text();
				console.error('Ошибка при скачивании документа:', errorText);
				throw new Error(`Не удалось скачать документ: ${errorText}`);
			}

			const data = await response.json();
			console.log('Ответ от сервера при скачивании:', data);
			
			let finalPath = '';
			
			// Используем путь, возвращенный сервером
			if (data.filePath) {
				finalPath = data.filePath;
				setDownloadedDocPath(finalPath);
				console.log('Путь к скачанному документу установлен (из ответа сервера):', finalPath);
				
				// Проверяем, что файл действительно существует
				try {
					const checkResponse = await fetch('/api/check-file', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ filePath: finalPath }),
					});
					
					if (checkResponse.ok) {
						const checkData = await checkResponse.json();
						console.log('Проверка файла:', checkData);
					} else {
						console.error('Ошибка при проверке файла, статус:', checkResponse.status);
					}
				} catch (checkError) {
					console.error('Ошибка при проверке файла:', checkError);
				}
			} else {
				// Если сервер не вернул путь, используем локальный
				finalPath = outputPath;
				setDownloadedDocPath(finalPath);
				console.log('Путь к скачанному документу установлен (из запроса):', finalPath);
			}
			
			toast.success('Документ успешно скачан');
			console.log('Возвращаем путь к документу:', finalPath);
			console.log('=== КОНЕЦ СКАЧИВАНИЯ ДОКУМЕНТА ===');
			return finalPath;
		} catch (error) {
			console.error('Ошибка при скачивании документа:', error);
			console.log('=== ОШИБКА ПРИ СКАЧИВАНИИ ДОКУМЕНТА ===');
			toast.error('Не удалось скачать документ');
			throw error;
		} finally {
			setIsDownloading(false);
		}
	};

	/**
	 * Извлекает ID документа из URL Google Drive
	 */
	const extractDocIdFromUrl = (url: string): string | null => {
		if (!url) return null;
		
		console.log('Извлечение ID из URL:', url);
		
		// Проверяем различные форматы URL Google Drive
		
		// Формат 1: https://drive.google.com/file/d/DOCUMENT_ID/view
		let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]{25,})/);
		if (match && match[1]) {
			console.log('Найден ID в формате 1:', match[1]);
			return match[1];
		}
		
		// Формат 2: https://drive.google.com/open?id=DOCUMENT_ID
		match = url.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
		if (match && match[1]) {
			console.log('Найден ID в формате 2:', match[1]);
			return match[1];
		}
		
		// Формат 3: https://docs.google.com/document/d/DOCUMENT_ID/edit
		match = url.match(/\/document\/d\/([a-zA-Z0-9_-]{25,})/);
		if (match && match[1]) {
			console.log('Найден ID в формате 3:', match[1]);
			return match[1];
		}
		
		// Формат 4: https://docs.google.com/spreadsheets/d/DOCUMENT_ID/edit
		match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{25,})/);
		if (match && match[1]) {
			console.log('Найден ID в формате 4:', match[1]);
			return match[1];
		}
		
		// Формат 5: https://docs.google.com/presentation/d/DOCUMENT_ID/edit
		match = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]{25,})/);
		if (match && match[1]) {
			console.log('Найден ID в формате 5:', match[1]);
			return match[1];
		}
		
		// Общий случай: ищем любую строку, похожую на ID Google Drive
		match = url.match(/([a-zA-Z0-9_-]{25,})/);
		if (match && match[1]) {
			console.log('Найден ID в общем формате:', match[1]);
			return match[1];
		}
		
		console.log('ID не найден в URL');
		return null;
	};

	/**
	 * Custom loading message
	 */
	function getLoadingMessage() {
		return (
			<div className='flex items-center gap-2 py-2'>
				<Spinner className='h-4 w-4' />
				<div>
					<p className='text-sm'>Анализирую документы...</p>
					<p className='text-xs text-muted-foreground'>Claude AI обрабатывает ваш запрос</p>
				</div>
			</div>
		);
	}

	/**
	 * Обрабатывает выбор документа
	 */
	const handleSelectDocument = async (doc: any) => {
		try {
			console.log('=== НАЧАЛО ВЫБОРА ДОКУМЕНТА ===');
			console.log('Документ для выбора:', doc);
			
			setDocumentSelectorOpen(false);
			setChatHistory([]);
			setError('');
			
			console.log('Выбран документ:', doc);
			console.log('URL документа:', doc.url);
			
			// Извлекаем ID документа из URL
			const docId = extractDocIdFromUrl(doc.url);
			
			console.log('Извлеченный ID документа:', docId);
			
			if (!docId) {
				console.error('Не удалось извлечь ID документа из URL:', doc.url);
				toast.error('Не удалось извлечь ID документа из URL');
				return;
			}
			
			// Сохраняем документ с ID для последующего скачивания
			const docWithId = {...doc, docId};
			console.log('Документ с добавленным ID:', docWithId);
			setSelectedDocument(docWithId);
			
			console.log('Состояние selectedDocument после установки:', docWithId);
			
			// Сразу скачиваем документ после выбора
			try {
				console.log('Начинаем скачивание документа сразу после выбора...');
				const docPath = await downloadDocument(docId);
				console.log('Документ успешно скачан сразу после выбора, путь:', docPath);
			} catch (downloadError) {
				console.error('Ошибка при скачивании документа после выбора:', downloadError);
				// Не выбрасываем ошибку, чтобы пользователь мог попробовать скачать документ при отправке сообщения
			}
			
			toast.success('Документ выбран');
			console.log('=== КОНЕЦ ВЫБОРА ДОКУМЕНТА ===');
			
		} catch (error) {
			console.error('Ошибка при выборе документа:', error);
			setSelectedDocument(null);
			toast.error('Не удалось подготовить документ для чата');
			console.log('=== ОШИБКА ПРИ ВЫБОРЕ ДОКУМЕНТА ===');
		}
	};

	/**
	 * Handle sending a message to the chatbot
	 */
	const handleSendMessage = useCallback(async () => {
		if (!message.trim() || isLoading) return;

		if (!selectedDocument) {
			toast.error('Пожалуйста, выберите документ для анализа');
			return;
		}

		console.log('=== НАЧАЛО ОТПРАВКИ СООБЩЕНИЯ ===');
		console.log('Выбранный документ:', selectedDocument);
		console.log('ID документа:', selectedDocument.docId);
		console.log('Текущий путь к документу:', downloadedDocPath);

		// Add the user message to chat
		const userMessage: ChatMessage = {
			role: 'user',
			content: message,
			timestamp: new Date(),
		};

		// Update chat history with user message
		setChatHistory((prevHistory) => [...prevHistory, userMessage]);
		setMessage('');
		setIsLoading(true);
		setError('');

		try {
			// Show processing toast for better UX
			const toastId = toast.loading('Документ анализируется...', { duration: 60000 });

			// Скачиваем документ, если он еще не скачан
			let docPath = downloadedDocPath;
			console.log('Текущий путь к документу:', docPath);
			console.log('ID документа:', selectedDocument.docId);
			
			if (!docPath && selectedDocument.docId) {
				try {
					console.log('Скачиваем документ перед отправкой сообщения...');
					docPath = await downloadDocument(selectedDocument.docId);
					console.log('Документ успешно скачан, путь:', docPath);
				} catch (downloadError) {
					console.error('Ошибка при скачивании документа:', downloadError);
					toast.dismiss(toastId);
					throw new Error('Не удалось скачать документ для анализа');
				}
			} else {
				console.log('Документ уже скачан, используем существующий путь:', docPath);
			}
			
			if (!docPath) {
				console.error('Путь к документу отсутствует после попытки скачивания');
				toast.dismiss(toastId);
				throw new Error('Не удалось получить путь к документу');
			}

			// Use the API URL from environment, or default to current origin
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;

			// Get previous messages for context
			// Include all previous messages to maintain context
			const previousMessages = convertToApiMessages(chatHistory);

			// Log chat history size
			console.log(`Отправка сообщения с ${previousMessages.length} предыдущими сообщениями`);
			console.log('Документ для анализа (путь):', docPath);

			// Создаем объект запроса
			const requestBody = {
				message: userMessage.content,
				documentPath: docPath,
				chatHistory: previousMessages,
			};

			console.log('Отправляем запрос на сервер с данными:', JSON.stringify(requestBody));

			const response = await fetch(`${apiUrl}/api/chat`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			// Dismiss the loading toast
			toast.dismiss(toastId);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Ошибка от сервера:', errorData);
				throw new Error(errorData.error || 'Не удалось получить ответ');
			}

			const data = await response.json();
			console.log('Ответ от сервера:', data);

			// Add AI response to chat
			const aiMessage: ChatMessage = {
				role: 'assistant',
				content: data.response,
				timestamp: new Date(),
			};

			// Update chat history with AI response
			setChatHistory((prevHistory) => [...prevHistory, aiMessage]);
			console.log('Ответ добавлен в историю чата');
			console.log('=== КОНЕЦ ОТПРАВКИ СООБЩЕНИЯ ===');
		} catch (err) {
			console.error('Ошибка при отправке сообщения:', err);
			setError(err instanceof Error ? err.message : 'Произошла ошибка при обработке сообщения');
			console.log('=== ОШИБКА ПРИ ОТПРАВКЕ СООБЩЕНИЯ ===');
		} finally {
			setIsLoading(false);
		}
	}, [message, isLoading, selectedDocument, chatHistory, downloadedDocPath, downloadDocument]);

	// Handle pressing Enter to send message
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	// Handle clear chat button
	const handleClearChat = useCallback(() => {
		setChatHistory([]);
		setError('');
	}, []);

	// Сбросить выбранный документ и очистить чат
	const handleResetDocument = useCallback(async () => {
		setSelectedDocument(null);
		setChatHistory([]);
		setError('');
		
		// Удаляем скачанный документ, если он есть
		if (downloadedDocPath) {
			await deleteDownloadedDocument();
		}
	}, [downloadedDocPath, deleteDownloadedDocument]);

	/**
	 * Создает временную директорию
	 */
	const createTempDir = useCallback(async () => {
		try {
			console.log('Создаем временную директорию...');
			const response = await fetch('/api/create-temp-dir');
			
			if (!response.ok) {
				const errorText = await response.text();
				console.error('Ошибка при создании временной директории:', errorText);
				toast.error('Не удалось создать временную директорию');
				return;
			}
			
			const data = await response.json();
			console.log('Ответ от сервера:', data);
			toast.success('Временная директория создана');
		} catch (error) {
			console.error('Ошибка при создании временной директории:', error);
			toast.error('Не удалось создать временную директорию');
		}
	}, []);

	return (
		<Card className='flex flex-col h-[700px] w-full max-w-[1200px] mx-auto'>
			<CardHeader className='px-4 py-3 border-b'>
				<CardTitle className='text-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
					<div className='flex items-center gap-2'>
						<span>Чат с документом</span>
						{selectedDocument && (
							<Badge variant='outline' className='ml-2'>
								Выбран документ
							</Badge>
						)}
					</div>
					<div className='flex flex-wrap items-center gap-2'>
						{selectedDocument ? (
							<div className='flex flex-wrap gap-2'>
								<Badge variant='secondary' className='text-xs flex items-center gap-1'>
									<FileText className='h-3 w-3' />
									<span className='truncate max-w-32'>{selectedDocument.title}</span>
									<Button
										variant='ghost'
										size='icon'
										className='h-4 w-4 ml-1 hover:bg-muted rounded-full p-0'
										onClick={handleResetDocument}>
										<X className='h-3 w-3' />
										<span className='sr-only'>Удалить документ</span>
									</Button>
								</Badge>
							</div>
						) : (
							<>
								<Popover open={documentSelectorOpen} onOpenChange={setDocumentSelectorOpen}>
									<PopoverTrigger asChild>
										<Button variant='outline' size='sm' className='h-8'>
											Выбрать документ
										</Button>
									</PopoverTrigger>
									<PopoverContent className='w-[300px] p-0' align='end'>
										<Command>
											<CommandInput placeholder='Поиск документов...' />
											<CommandList>
												<CommandEmpty>Документы не найдены</CommandEmpty>
												<CommandGroup>
													{documents.map((doc) => (
														<CommandItem
															key={doc.id}
															onSelect={() => handleSelectDocument(doc)}>
															<div className='flex items-center gap-2 w-full'>
																<FileText className='h-4 w-4' />
																<span className='flex-1 truncate'>{doc.title}</span>
																{selectedDocument && selectedDocument.id === doc.id && <Check className='h-4 w-4' />}
															</div>
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
								<Button variant='outline' size='sm' className='h-8' onClick={createTempDir}>
									Создать temp директорию
								</Button>
							</>
						)}

						{/* Clear chat button - always visible if there's chat history */}
						{chatHistory.length > 0 && (
							<Button variant='ghost' size='sm' onClick={handleClearChat}>
								<Trash2 className='h-4 w-4 mr-2' />
								Очистить чат
							</Button>
						)}
					</div>
				</CardTitle>
			</CardHeader>

			{/* Chat messages content */}
			<CardContent className='flex-1 overflow-y-auto p-4'>
				{chatHistory.length === 0 ? (
					<div className='flex flex-col items-center justify-center h-full'>
						<FileText className='h-12 w-12 text-muted-foreground mb-4' />
						<h3 className='text-lg font-medium mb-2'>Начните диалог с выбранным документом</h3>
						<p className='text-sm text-muted-foreground text-center max-w-md'>
							Выберите документ и задайте вопрос для начала общения с AI-ассистентом на базе Claude. 
							Ассистент проанализирует PDF и ответит на ваши вопросы по содержанию документа.
						</p>
					</div>
				) : (
					<div className='space-y-4'>
						{chatHistory.map((msg, index) => (
							<ChatMessageItem key={index} message={msg} />
						))}

						{isLoading && (
							<div className='flex flex-col items-start'>
								<div className='max-w-[85%] px-4 py-2 rounded-lg bg-muted'>{getLoadingMessage()}</div>
							</div>
						)}

						{error && (
							<div className='flex flex-col items-start'>
								<div className='max-w-[85%] p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20'>
									<div className='flex items-start'>
										<AlertCircle className='h-5 w-5 mr-2 flex-shrink-0 mt-0.5' />
										<div>
											<p className='font-medium'>Ошибка при обработке запроса</p>
											<p className='text-sm mt-1'>{error}</p>
										</div>
									</div>
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>
				)}
			</CardContent>

			{/* Chat input footer */}
			<CardFooter className='p-4 border-t'>
				<div className='flex items-center w-full gap-2'>
					<Input
						ref={inputRef}
						placeholder={!selectedDocument ? 'Выберите документ для начала диалога...' : 'Введите ваш вопрос...'}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={isLoading || !selectedDocument || isDownloading}
						className='flex-1'
					/>
					<Button 
						onClick={handleSendMessage} 
						disabled={isLoading || !selectedDocument || !message.trim() || isDownloading}
					>
						{isLoading ? <Spinner className='h-4 w-4' /> : <Send className='h-4 w-4' />}
						<span className='sr-only'>Отправить</span>
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
};

export default Chat2; 