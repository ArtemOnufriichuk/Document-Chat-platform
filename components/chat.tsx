'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, FileText, AlertCircle, X, Trash2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Document } from '@/types';
import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

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

const Chat = () => {
	const [message, setMessage] = useState('');
	const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [documentSelectorOpen, setDocumentSelectorOpen] = useState(false);

	// Get documents from store
	const documents = useAppStore((state) => state.documents);
	const selectedDocumentIds = useAppStore((state) => state.selectedDocumentIds);
	const toggleDocumentSelection = useAppStore((state) => state.toggleDocumentSelection);
	const clearDocumentSelection = useAppStore((state) => state.clearDocumentSelection);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Memoize selected documents to prevent unnecessary recomputation
	const selectedDocuments = useMemo(() => documents.filter((doc) => selectedDocumentIds.includes(doc.id)), [documents, selectedDocumentIds]);

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chatHistory]);

	// Focus input when component mounts
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	// When selected documents change, clear the chat history
	useEffect(() => {
		setChatHistory([]);
		setError('');
	}, [selectedDocumentIds]);

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
	 * Handle sending a message to the chatbot
	 */
	const handleSendMessage = useCallback(async () => {
		if (!message.trim() || isLoading) return;

		if (selectedDocumentIds.length === 0) {
			toast.error('Пожалуйста, выберите документ для анализа');
			return;
		}

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
			const toastId = toast.loading('Документы анализируются...', { duration: 60000 });

			// Use the API URL from environment, or default to current origin
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;

			// Get previous messages for context
			// Include all previous messages to maintain context
			const previousMessages = convertToApiMessages(chatHistory);

			// Log chat history size
			console.log(`Sending chat with ${previousMessages.length} previous messages`);

			const response = await fetch(`${apiUrl}/api/chat`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message,
					documentIds: selectedDocumentIds,
					chatHistory: previousMessages,
				}),
			});

			// Dismiss the loading toast
			toast.dismiss(toastId);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Не удалось получить ответ');
			}

			const data = await response.json();

			// Add AI response to chat
			const aiMessage: ChatMessage = {
				role: 'assistant',
				content: data.response,
				timestamp: new Date(),
			};

			// Update chat history with AI response
			setChatHistory((prevHistory) => [...prevHistory, aiMessage]);
		} catch (err) {
			console.error('Error sending message:', err);
			setError(err instanceof Error ? err.message : 'Произошла ошибка при обработке сообщения');
		} finally {
			setIsLoading(false);
		}
	}, [message, isLoading, selectedDocumentIds, chatHistory]);

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

	return (
		<Card className='flex flex-col h-[700px] w-full max-w-[1200px] mx-auto'>
			<CardHeader className='px-4 py-3 border-b'>
				<CardTitle className='text-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
					<div className='flex items-center gap-2'>
						<span>Чат с документом</span>
						{selectedDocuments.length > 0 && (
							<Badge variant='outline' className='ml-2'>
								Выбрано: {selectedDocuments.length}
							</Badge>
						)}
					</div>
					<div className='flex flex-wrap items-center gap-2'>
						{selectedDocuments.length > 0 ? (
							<div className='flex flex-wrap gap-2'>
								{selectedDocuments.map((doc) => (
									<Badge key={doc.id} variant='secondary' className='text-xs flex items-center gap-1'>
										<FileText className='h-3 w-3' />
										<span className='truncate max-w-32'>{doc.title}</span>
										<Button
											variant='ghost'
											size='icon'
											className='h-4 w-4 ml-1 hover:bg-muted rounded-full p-0'
											onClick={() => toggleDocumentSelection(doc.id)}>
											<X className='h-3 w-3' />
											<span className='sr-only'>Удалить документ</span>
										</Button>
									</Badge>
								))}
								<Button variant='outline' size='sm' className='h-6 text-xs' onClick={clearDocumentSelection}>
									Очистить
								</Button>
							</div>
						) : (
							<Popover open={documentSelectorOpen} onOpenChange={setDocumentSelectorOpen}>
								<PopoverTrigger asChild>
									<Button variant='outline' size='sm' className='h-8'>
										Выбрать документы
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
														onSelect={() => {
															toggleDocumentSelection(doc.id);
															setDocumentSelectorOpen(false);
														}}>
														<div className='flex items-center gap-2 w-full'>
															<FileText className='h-4 w-4' />
															<span className='flex-1 truncate'>{doc.title}</span>
															{selectedDocumentIds.includes(doc.id) && <Check className='h-4 w-4' />}
														</div>
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						)}

						{selectedDocuments.length > 0 && (
							<Popover>
								<PopoverTrigger asChild>
									<Button variant='outline' size='sm' className='h-8'>
										Добавить документы
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-[300px] p-0' align='end'>
									<Command>
										<CommandInput placeholder='Поиск документов...' />
										<CommandList>
											<CommandEmpty>Документы не найдены</CommandEmpty>
											<CommandGroup>
												{documents
													.filter((doc) => !selectedDocumentIds.includes(doc.id))
													.map((doc) => (
														<CommandItem key={doc.id} onSelect={() => toggleDocumentSelection(doc.id)}>
															<div className='flex items-center gap-2 w-full'>
																<FileText className='h-4 w-4' />
																<span className='flex-1 truncate'>{doc.title}</span>
															</div>
														</CommandItem>
													))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
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
						<h3 className='text-lg font-medium mb-2'>Начните диалог с выбранными документами</h3>
						<p className='text-sm text-muted-foreground text-center max-w-md'>
							Выберите документы и задайте вопрос для начала общения с AI-ассистентом на базе Claude. Ассистент проанализирует PDF и другие документы напрямую
							по URL-ссылкам, включая текст, изображения, таблицы и схемы.
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
						placeholder={selectedDocumentIds.length === 0 ? 'Выберите документы для начала диалога...' : 'Введите ваш вопрос...'}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={isLoading || selectedDocumentIds.length === 0}
						className='flex-1'
					/>
					<Button onClick={handleSendMessage} disabled={isLoading || selectedDocumentIds.length === 0 || !message.trim()}>
						{isLoading ? <Spinner className='h-4 w-4' /> : <Send className='h-4 w-4' />}
						<span className='sr-only'>Отправить</span>
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
};

export default Chat;
