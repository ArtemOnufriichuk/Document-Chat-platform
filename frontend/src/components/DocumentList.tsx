import { useState, useCallback } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/ToastContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

// Функция для форматирования даты
const formatDate = (dateString: string) => {
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	} catch {
		return 'Неизвестно';
	}
};

// Функция для получения URL для встраивания документа
const getEmbedUrl = (url: string) => {
	if (url.includes('drive.google.com/file/d/')) {
		// Преобразование обычной ссылки Google Drive в встраиваемую
		const fileId = url.match(/\/file\/d\/([^\/]+)/)?.[1];
		if (fileId) {
			return `https://drive.google.com/file/d/${fileId}/preview`;
		}
	}
	return url;
};

interface DocumentListProps {
	onSelectDocument?: (documentId: string) => void;
}

export default function DocumentList({ onSelectDocument }: DocumentListProps) {
	const { documents, removeDocument, updateDocument } = useAppStore();
	const { showToast } = useToast();
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
	const [currentDocument, setCurrentDocument] = useState<{ id: string; title: string; url: string } | null>(null);
	const [editTitle, setEditTitle] = useState('');
	const [editUrl, setEditUrl] = useState('');
	const [previewError, setPreviewError] = useState(false);

	// Открыть диалог редактирования документа
	const handleEditClick = (doc: { id: string; title: string; url: string }) => {
		setCurrentDocument(doc);
		setEditTitle(doc.title);
		setEditUrl(doc.url);
		setEditDialogOpen(true);
	};

	// Открыть диалог удаления документа
	const handleDeleteClick = (doc: { id: string; title: string; url: string }) => {
		setCurrentDocument(doc);
		setDeleteDialogOpen(true);
	};

	// Открыть диалог предпросмотра документа
	const handlePreviewClick = (doc: { id: string; title: string; url: string }) => {
		setCurrentDocument(doc);
		setPreviewError(false);
		setPreviewDialogOpen(true);
	};

	// Сохранить изменения документа
	const handleSaveEdit = async () => {
		if (currentDocument) {
			try {
				await updateDocument(currentDocument.id, { title: editTitle, url: editUrl });
				setEditDialogOpen(false);

				// Показать уведомление об успешном редактировании
				showToast({
					title: 'Документ обновлен',
					description: `Документ "${editTitle}" успешно обновлен`,
					type: 'success',
				});
			} catch (error) {
				// Показать уведомление об ошибке
				showToast({
					title: 'Ошибка',
					description: 'Не удалось обновить документ',
					type: 'error',
				});
			}
		}
	};

	// Удалить документ
	const handleConfirmDelete = async () => {
		if (currentDocument) {
			try {
				await removeDocument(currentDocument.id);
				setDeleteDialogOpen(false);

				// Показать уведомление об успешном удалении
				showToast({
					title: 'Документ удален',
					description: `Документ "${currentDocument.title}" успешно удален`,
					type: 'success',
				});
			} catch (error) {
				// Показать уведомление об ошибке
				showToast({
					title: 'Ошибка',
					description: 'Не удалось удалить документ',
					type: 'error',
				});
			}
		}
	};

	// Обработчик выбора документа
	const handleDocumentSelect = (docId: string) => {
		if (onSelectDocument) {
			onSelectDocument(docId);

			// Показать уведомление о выборе документа
			const selectedDoc = documents.find((doc) => doc.id === docId);
			if (selectedDoc) {
				showToast({
					title: 'Документ выбран',
					description: `Документ "${selectedDoc.title}" выбран для чата`,
					type: 'info',
					duration: 3000, // Короткая длительность для информационного сообщения
				});
			}
		}
	};

	// Обработчик ошибки загрузки iframe
	const handlePreviewError = useCallback(() => {
		setPreviewError(true);
	}, []);

	return (
		<Card className='w-full'>
			<CardHeader className='p-4 border-b'>
				<CardTitle className='text-xl'>Документы</CardTitle>
			</CardHeader>
			<CardContent className='p-4'>
				{documents.length === 0 ? (
					<div className='text-center py-8 bg-gray-50 rounded-lg'>
						<p className='text-gray-500'>Нет документов. Добавьте новый документ.</p>
					</div>
				) : (
					<div className='overflow-x-auto'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Название</TableHead>
									<TableHead>URL</TableHead>
									<TableHead>Дата создания</TableHead>
									<TableHead>Обновлен</TableHead>
									<TableHead>Действия</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{documents.map((doc) => (
									<TableRow key={doc.id}>
										<TableCell className='font-medium'>
											<button className='text-left hover:text-blue-600' onClick={() => handleDocumentSelect(doc.id)}>
												<div className='flex items-center'>
													<span className='mr-2'>📄</span>
													{doc.title}
												</div>
											</button>
										</TableCell>
										<TableCell className='truncate max-w-[200px]'>
											<div className='flex items-center truncate'>
												<span className='mr-1'>🔗</span>
												<span className='truncate text-xs text-gray-500'>{doc.url}</span>
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center text-xs text-gray-500'>
												<span className='mr-1'>📅</span>
												{formatDate(doc.createdAt)}
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center text-xs text-gray-500'>
												<span className='mr-1'>🕓</span>
												{formatDate(doc.updatedAt)}
											</div>
										</TableCell>
										<TableCell>
											<div className='flex gap-2'>
												<Button size='sm' variant='outline' onClick={() => handlePreviewClick(doc)}>
													👁️ Просмотр
												</Button>
												<Button size='sm' variant='outline' onClick={() => handleEditClick(doc)}>
													✏️ Изменить
												</Button>
												<Button size='sm' variant='primary' onClick={() => handleDeleteClick(doc)}>
													🗑️ Удалить
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}

				{/* Диалог редактирования документа */}
				<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Редактировать документ</DialogTitle>
							<DialogDescription>Внесите изменения в документ и нажмите Сохранить.</DialogDescription>
						</DialogHeader>
						<div className='grid gap-4 py-4'>
							<div className='grid gap-2'>
								<Label htmlFor='title'>Название</Label>
								<Input id='title' value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='url'>URL</Label>
								<Input id='url' value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
							</div>
						</div>
						<DialogFooter>
							<Button variant='outline' onClick={() => setEditDialogOpen(false)}>
								Отмена
							</Button>
							<Button onClick={handleSaveEdit}>Сохранить</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Диалог подтверждения удаления */}
				<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Подтверждение удаления</DialogTitle>
							<DialogDescription>Вы уверены, что хотите удалить документ "{currentDocument?.title}"? Это действие нельзя отменить.</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
								Отмена
							</Button>
							<Button variant='primary' onClick={handleConfirmDelete}>
								Удалить
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Диалог предпросмотра документа */}
				<Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
					<DialogContent className='max-w-[800px]'>
						<DialogHeader>
							<DialogTitle>Просмотр документа: {currentDocument?.title}</DialogTitle>
							<DialogDescription>URL: {currentDocument?.url}</DialogDescription>
						</DialogHeader>
						{previewError ? (
							<div className='text-center p-8'>
								<p className='text-red-500 mb-2'>⚠️ Ошибка загрузки документа</p>
								<p className='text-sm text-gray-500'>Не удалось загрузить предпросмотр документа. Попробуйте открыть его напрямую.</p>
							</div>
						) : (
							<div className='aspect-video bg-gray-100 rounded-md overflow-hidden'>
								{currentDocument && (
									<iframe
										src={getEmbedUrl(currentDocument.url)}
										className='w-full h-full'
										title={currentDocument.title}
										sandbox='allow-scripts allow-same-origin'
										loading='lazy'
										referrerPolicy='no-referrer'
										onError={handlePreviewError}
									/>
								)}
							</div>
						)}
						<div className='flex justify-center mt-2'>
							<a
								href={currentDocument?.url || ''}
								target='_blank'
								rel='noopener noreferrer'
								className='bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded inline-flex items-center'>
								🔗 Открыть в новой вкладке
							</a>
						</div>
					</DialogContent>
				</Dialog>
			</CardContent>
		</Card>
	);
}
