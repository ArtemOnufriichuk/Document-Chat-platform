/**
 * Форматирует дату в локальный формат
 * @param dateString ISO строка даты
 * @returns Отформатированная дата
 */
export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/**
 * Получает URL для встраивания документа
 * (обрабатывает Google Docs, PDF и другие типы)
 * @param url URL документа
 * @returns URL для встраивания
 */
export function getEmbedUrl(url: string): string {
	// Google Docs
	if (url.includes('docs.google.com/document')) {
		// Преобразуем URL для встраивания
		return url.replace('/edit', '/preview').replace('/view', '/preview');
	}

	// Google Sheets
	if (url.includes('docs.google.com/spreadsheets')) {
		return url.replace('/edit', '/preview').replace('/view', '/preview');
	}

	// Google Slides
	if (url.includes('docs.google.com/presentation')) {
		return url.replace('/edit', '/preview').replace('/view', '/preview');
	}

	// PDF файлы (если они хранятся на Google Drive)
	if (url.includes('drive.google.com') && url.includes('pdf')) {
		return `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(url)}`;
	}

	// Для остальных URL возвращаем как есть
	return url;
}
