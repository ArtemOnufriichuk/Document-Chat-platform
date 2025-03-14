'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileEdit, Trash2, Eye, ExternalLink, Calendar, Clock, FileText, FileIcon, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Document } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { formatDate, getEmbedUrl } from '@/utils/document-list';

// Local interface for documents with preview content
interface PreviewDocument extends Document {
	content?: string;
}

export default function DocumentList() {
	const documents = useAppStore((state) => state.documents);
	const removeDocument = useAppStore((state) => state.removeDocument);
	const updateDocument = useAppStore((state) => state.updateDocument);
	const currentUser = useAppStore((state) => state.currentUser);

	// Check if user is admin
	const isAdmin = currentUser?.isAdmin === true;

	// Edit and preview dialogs states
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
	const [editDocument, setEditDocument] = useState<Document | null>(null);
	const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null);
	const [editTitle, setEditTitle] = useState('');
	const [editUrl, setEditUrl] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [previewError, setPreviewError] = useState(false);

	// Handle opening the edit dialog
	const handleOpenEditDialog = (document: Document) => {
		setEditDocument(document);
		setEditTitle(document.title);
		setEditUrl(document.url);
		setIsEditDialogOpen(true);
	};

	// Handle opening the preview dialog
	const handleOpenPreviewDialog = async (document: Document) => {
		setPreviewDocument(document);
		setPreviewError(false);
		setIsPreviewDialogOpen(true);
	};

	// Handle saving edited document
	const handleSaveEdit = async () => {
		if (!editDocument) return;

		try {
			setIsLoading(true);
			await updateDocument(editDocument.id, { title: editTitle, url: editUrl });
			setIsEditDialogOpen(false);
			toast.success('Документ успешно обновлен');
		} catch (error) {
			console.error('Error updating document:', error);
			toast.error('Не удалось обновить документ');
		} finally {
			setIsLoading(false);
		}
	};

	// Handle removing document
	const handleRemoveDocument = async (id: string) => {
		setDocumentToDelete(id);
		setIsDeleteDialogOpen(true);
	};

	// Confirm document deletion
	const confirmDeleteDocument = async () => {
		if (!documentToDelete) return;

		try {
			setIsLoading(true);
			await removeDocument(documentToDelete);
			setIsDeleteDialogOpen(false);
			setDocumentToDelete(null);
			toast.success('Документ успешно удален');
		} catch (error) {
			console.error('Error removing document:', error);
			toast.error('Не удалось удалить документ');
		} finally {
			setIsLoading(false);
		}
	};

	// Handle iframe load error
	const handlePreviewError = useCallback(() => {
		setPreviewError(true);
	}, []);

	return (
		<Card>
			<CardHeader className='pb-3'>
				<CardTitle>Документы</CardTitle>
			</CardHeader>
			<CardContent>
				{documents.length === 0 ? (
					<div className='text-center p-8'>
						<FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
						<h3 className='text-lg font-medium mb-2'>Нет документов</h3>
						<p className='text-sm text-muted-foreground mb-4'>Документы будут отображаться здесь после добавления.</p>
					</div>
				) : (
					<div className='overflow-x-auto'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Название</TableHead>
									<TableHead>URL</TableHead>
									<TableHead>Добавлен</TableHead>
									<TableHead>Последнее обновление</TableHead>
									<TableHead className='text-right'>Действия</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{documents.map((document) => (
									<TableRow key={document.id}>
										<TableCell className='font-medium'>
											<div className='flex items-center gap-2'>
												<FileText className='h-4 w-4 text-orange-500' />
												<span className='line-clamp-1'>{document.title}</span>
											</div>
										</TableCell>
										<TableCell className='max-w-[200px]'>
											<div className='flex items-center truncate'>
												<ExternalLink className='h-4 w-4 mr-1 flex-shrink-0 text-muted-foreground' />
												<span className='truncate text-xs text-muted-foreground'>{document.url}</span>
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center text-xs text-muted-foreground'>
												<Calendar className='h-3 w-3 mr-1' />
												{formatDate(document.createdAt)}
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center text-xs text-muted-foreground'>
												<Clock className='h-3 w-3 mr-1' />
												{formatDate(document.updatedAt)}
											</div>
										</TableCell>
										<TableCell className='text-right'>
											<div className='flex justify-end gap-2'>
												<Button variant='outline' size='icon' onClick={() => handleOpenPreviewDialog(document)}>
													<Eye className='h-4 w-4' />
													<span className='sr-only'>Просмотр</span>
												</Button>
												{isAdmin && (
													<>
														<Button variant='outline' size='icon' onClick={() => handleOpenEditDialog(document)}>
															<FileEdit className='h-4 w-4' />
															<span className='sr-only'>Редактировать</span>
														</Button>
														<Button variant='outline' size='icon' onClick={() => handleRemoveDocument(document.id)}>
															<Trash2 className='h-4 w-4' />
															<span className='sr-only'>Удалить</span>
														</Button>
													</>
												)}
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}

				{/* Delete Document Dialog */}
				<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
					<DialogContent className='sm:max-w-[425px]'>
						<DialogHeader>
							<DialogTitle>Удаление документа</DialogTitle>
							<DialogDescription>Вы уверены, что хотите удалить этот документ? Это действие нельзя отменить.</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
								Отмена
							</Button>
							<Button variant='destructive' onClick={confirmDeleteDocument} disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Удаление...
									</>
								) : (
									'Удалить'
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Edit Document Dialog */}
				<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Редактировать документ</DialogTitle>
							<DialogDescription>Обновите информацию о документе.</DialogDescription>
						</DialogHeader>
						<div className='grid gap-4 py-4'>
							<div className='grid gap-2'>
								<Label htmlFor='edit-title'>Название</Label>
								<Input id='edit-title' value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='edit-url'>URL</Label>
								<Input id='edit-url' value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
							</div>
						</div>
						<DialogFooter>
							<Button variant='outline' onClick={() => setIsEditDialogOpen(false)}>
								Отмена
							</Button>
							<Button onClick={handleSaveEdit} disabled={isLoading}>
								Сохранить
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Preview Document Dialog */}
				<Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
					<DialogContent className='sm:max-w-[800px]'>
						<DialogHeader>
							<DialogTitle>{previewDocument?.title}</DialogTitle>
							<DialogDescription>URL: {previewDocument?.url}</DialogDescription>
						</DialogHeader>

						{previewError && (
							<div className='text-center p-8'>
								<AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
								<h3 className='text-lg font-medium mb-2'>Не удалось загрузить документ</h3>
								<p className='text-sm text-muted-foreground mb-4'>Попробуйте позже или проверьте URL.</p>
							</div>
						)}

						{!previewError && previewDocument && (
							<div className='aspect-video bg-muted rounded-md overflow-hidden '>
								<iframe
									id='preview-iframe'
									src={getEmbedUrl(previewDocument.url)}
									className='w-full h-full'
									title={previewDocument?.title}
									sandbox='allow-scripts allow-same-origin'
									loading='lazy'
									referrerPolicy='no-referrer'
									onError={handlePreviewError}
									onLoad={() => setPreviewError(false)}
								/>
							</div>
						)}

						<div className='flex justify-center mt-2'>
							<Button asChild variant='default'>
								<a href={previewDocument?.url || ''} target='_blank' rel='noopener noreferrer'>
									<ExternalLink className='h-4 w-4 mr-2' />
									Открыть в новой вкладке
								</a>
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</CardContent>
		</Card>
	);
}
