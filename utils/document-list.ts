/**
 * Format a date string to a human-readable format
 * @param dateString - The date string to format
 * @returns The formatted date string
 */
export const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat('ru-RU', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
};

/**
 * Get the embed URL for a Google document
 * @param url - The URL of the document
 * @returns The embed URL for the document
 */
export const getEmbedUrl = (url: string): string => {
	try {
		if (!url.includes('drive.google.com') && !url.includes('docs.google.com')) {
			return url;
		}

		const fileId = url.match(/\/d\/([^/]+)/)?.[1];

		if (!fileId) {
			return url;
		}

		// Handle Google Drive URLs
		if (url.includes('drive.google.com/file/d/')) {
			return `https://drive.google.com/file/d/${fileId}/preview`;
		}

		// Handle Google Docs URLs
		if (url.includes('docs.google.com/document/d/')) {
			return `https://docs.google.com/document/d/${fileId}/preview`;
		}

		// Handle Google Sheets URLs
		if (url.includes('docs.google.com/spreadsheets/d/')) {
			return `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
		}

		// Handle Google Slides URLs
		if (url.includes('docs.google.com/presentation/d/')) {
			return `https://docs.google.com/presentation/d/${fileId}/preview`;
		}

		// Default fallback - return the original URL
		return url;
	} catch (error) {
		console.error('Error formatting embed URL:', error);
		return url;
	}
};
