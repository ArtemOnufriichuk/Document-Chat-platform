'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileText, Check } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Check if the URL is for a supported document type
 */
const isSupportedDocumentUrl = (url: string): { isValid: boolean; message?: string } => {
	// Google Drive document formats
	if (
		url.includes('drive.google.com/file/d/') ||
		url.includes('docs.google.com/document/d/') ||
		url.includes('docs.google.com/spreadsheets/d/') ||
		url.includes('docs.google.com/presentation/d/')
	) {
		return { isValid: true };
	}

	// URL is technically valid but not a recognized document format
	return {
		isValid: true,
		message: 'URL допустим, но формат может не поддерживаться. Рекомендуется использовать PDF Google Drive документы.',
	};
};

const AddDocumentForm = () => {
	const { addDocument, documents, fetchDocuments } = useAppStore();

	// Form states
	const [title, setTitle] = useState('');
	const [url, setUrl] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [isValidUrl, setIsValidUrl] = useState(false);

	/**
	 * Reset form to initial state
	 */
	const resetForm = () => {
		setTitle('');
		setUrl('');
		setError('');
		setIsValidUrl(false);
	};

	/**
	 * Check if the URL is valid when URL changes
	 */
	useEffect(() => {
		const newUrl = url.trim();
		setError('');

		try {
			// Basic URL validation
			if (newUrl.length > 0) {
				new URL(newUrl);

				// Additional document type validation
				const validationResult = isSupportedDocumentUrl(newUrl);
				setIsValidUrl(validationResult.isValid);

				if (validationResult.message) {
					setError(validationResult.message);
				}
			} else {
				setIsValidUrl(false);
			}
		} catch {
			setIsValidUrl(false);
			if (newUrl.length > 0) {
				setError('Некорректный URL. Пожалуйста, введите полный URL, включая http:// или https://');
			}
		}
	}, [url]);

	/**
	 * Handle form submission
	 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		// Validate inputs
		if (!title.trim() || !url.trim()) {
			setError('Пожалуйста, заполните все поля');
			return;
		}

		// Check for duplicate URLs
		if (documents.some((doc) => doc.url === url.trim())) {
			setError('Документ с таким URL уже существует');
			return;
		}

		setIsLoading(true);

		try {
			await addDocument({
				title: title.trim(),
				url: url.trim(),
			});

			await fetchDocuments();
			toast.success('Документ успешно добавлен');
			resetForm();
		} catch (err) {
			console.error('Error adding document:', err);
			setError('Не удалось добавить документ. Попробуйте еще раз.');
			toast.error('Ошибка при добавлении документа');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className='mb-8'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>Добавить новый документ</CardTitle>
				<CardDescription>Укажите ссылку на документ для анализа</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='title'>Название документа</Label>
						<Input id='title' placeholder='Введите название документа' value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLoading} />
					</div>

					<div className='space-y-2'>
						<Label htmlFor='url'>URL документа</Label>
						<div className='relative'>
							<Input
								id='url'
								placeholder='https://example.com/document'
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								disabled={isLoading}
								className={isValidUrl ? 'border-green-600 focus-visible:ring-green-600' : ''}
							/>
							{isValidUrl && (
								<div className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 flex items-center'>
									<Check className='h-3 w-3 mr-1' /> Валидный URL
								</div>
							)}
						</div>
						<p className='text-xs text-muted-foreground'>Вставьте ссылку на документ для анализа (PDF, DOC, веб-страница)</p>
					</div>
					{error && <p className='text-sm text-destructive'>{error}</p>}
				</form>
			</CardContent>
			<CardFooter className='flex justify-between'>
				<Button variant='outline' onClick={resetForm} disabled={isLoading}>
					Очистить
				</Button>
				<Button onClick={handleSubmit} disabled={isLoading || !title || !url || !isValidUrl}>
					<FileText className='h-4 w-4 mr-2' />
					Добавить документ
				</Button>
			</CardFooter>
		</Card>
	);
};

export default AddDocumentForm;
