import { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/ToastContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';

/**
 * Проверка, является ли URL поддерживаемым типом документа
 */
const isSupportedDocumentUrl = (url: string): { isValid: boolean; message?: string } => {
	// Google Drive форматы документов
	if (
		url.includes('drive.google.com/file/d/') ||
		url.includes('docs.google.com/document/d/') ||
		url.includes('docs.google.com/spreadsheets/d/') ||
		url.includes('docs.google.com/presentation/d/')
	) {
		return { isValid: true };
	}

	// URL технически валиден, но не распознан как поддерживаемый формат
	return {
		isValid: true,
		message: 'URL допустим, но формат может не поддерживаться. Рекомендуется использовать PDF Google Drive документы.',
	};
};

export default function AddDocumentForm() {
	const { addDocument, documents, fetchDocuments } = useAppStore();
	const { showToast } = useToast();

	// Состояния формы
	const [title, setTitle] = useState('');
	const [url, setUrl] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isValidUrl, setIsValidUrl] = useState(false);

	/**
	 * Сброс формы до начального состояния
	 */
	const resetForm = () => {
		setTitle('');
		setUrl('');
		setError(null);
		setIsValidUrl(false);
	};

	/**
	 * Проверка, является ли URL валидным при изменении поля
	 */
	useEffect(() => {
		const newUrl = url.trim();
		setError(null);

		try {
			// Базовая валидация URL
			if (newUrl.length > 0) {
				new URL(newUrl);

				// Дополнительная валидация типа документа
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
	 * Обработка отправки формы
	 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Валидация входных данных
		if (!title.trim() || !url.trim()) {
			setError('Пожалуйста, заполните все поля');
			return;
		}

		// Проверка на дубликаты URL
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

			showToast({
				title: 'Документ добавлен',
				description: `Документ "${title}" успешно добавлен`,
				type: 'success',
			});

			resetForm();
		} catch (err) {
			console.error('Error adding document:', err);
			setError('Не удалось добавить документ. Попробуйте еще раз.');

			showToast({
				title: 'Ошибка',
				description: 'Не удалось добавить документ',
				type: 'error',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className='w-full'>
			<CardHeader className='p-4 border-b'>
				<CardTitle className='text-xl'>Добавить новый документ</CardTitle>
				<p className='text-sm text-gray-500'>Укажите ссылку на документ для анализа</p>
			</CardHeader>

			<CardContent className='p-4'>
				<form onSubmit={handleSubmit} className='space-y-4'>
					{error && <div className='bg-red-50 p-3 rounded-md border border-red-200 text-red-600'>{error}</div>}

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
								className={isValidUrl ? 'border-green-500' : ''}
							/>
							{isValidUrl && <div className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 flex items-center'>✓ Валидный URL</div>}
						</div>
						<p className='text-xs text-gray-500'>Вставьте ссылку на документ для анализа (PDF, DOC, веб-страница)</p>
					</div>
				</form>
			</CardContent>

			<CardFooter className='p-4 border-t'>
				<div className='flex justify-between w-full'>
					<Button variant='outline' onClick={resetForm} disabled={isLoading}>
						Очистить
					</Button>
					<Button onClick={handleSubmit} disabled={isLoading || !title || !url || !isValidUrl}>
						{isLoading ? 'Добавление...' : 'Добавить документ'}
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
