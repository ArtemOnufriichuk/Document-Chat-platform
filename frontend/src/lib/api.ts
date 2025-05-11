// Базовый URL API
const API_BASE_URL = '/api';

// Импортируем типы из backend
import { User, Document } from './store';

// Типы ответов API
interface DownloadResponse {
	filePath: string;
	success: boolean;
}

interface ChatResponse {
	response: string;
	success: boolean;
}

interface LoginResponse {
	user: User;
	token?: string;
}

// Вспомогательная функция для упрощения fetch запросов
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...(options.headers || {}),
			},
		});

		// Для ответа 204 No Content нет JSON содержимого
		if (response.status === 204) {
			return {} as T;
		}

		// Пытаемся распарсить JSON ответ
		const data = await response.json();

		// Если запрос неуспешен, бросаем ошибку с данными от сервера
		if (!response.ok) {
			throw new Error(data.message || 'Что-то пошло не так');
		}

		return data as T;
	} catch (error) {
		console.error('API Error:', error);
		throw error;
	}
}

// Типы для документов
type DocumentResponse = Document[];
type SingleDocumentResponse = Document;

// API для работы с документами
export const documentsApi = {
	getAllDocuments: async (): Promise<DocumentResponse> => fetchApi('/documents'),

	createDocument: async (title: string, url: string): Promise<SingleDocumentResponse> =>
		fetchApi('/documents', {
			method: 'POST',
			body: JSON.stringify({ title, url }),
		}),

	updateDocument: async (id: string, data: { title?: string; url?: string }): Promise<SingleDocumentResponse> =>
		fetchApi(`/documents/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		}),

	deleteDocument: async (id: string): Promise<void> =>
		fetchApi(`/documents/${id}`, {
			method: 'DELETE',
		}),
};

// API для управления файлами
export const filesApi = {
	downloadExternal: async (fileUrl: string, fileName: string): Promise<DownloadResponse> =>
		fetchApi('/files/download-external', {
			method: 'POST',
			body: JSON.stringify({ fileUrl, fileName }),
		}),

	checkFile: async (relativeFilePath: string) =>
		fetchApi('/files/check', {
			method: 'POST',
			body: JSON.stringify({ relativeFilePath }),
		}),

	deleteFile: async (relativeFilePath: string) =>
		fetchApi('/files/delete', {
			method: 'POST',
			body: JSON.stringify({ relativeFilePath }),
		}),

	ensureTempDir: async () =>
		fetchApi('/files/ensure-temp-dir', {
			method: 'POST',
		}),
};

// Типы для пользователей
type UserResponse = User[];

// Тип для создания пользователя
interface CreateUserData {
	login: string;
	password: string;
	email: string;
	fullName?: string;
	isAdmin?: boolean;
}

// API для аутентификации и пользователей
export const authApi = {
	login: async (login: string, password: string): Promise<LoginResponse> =>
		fetchApi('/users/login', {
			method: 'POST',
			body: JSON.stringify({ login, password }),
		}),

	getAllUsers: async (): Promise<UserResponse> => fetchApi('/users'),

	createUser: async (userData: CreateUserData): Promise<User> =>
		fetchApi('/users', {
			method: 'POST',
			body: JSON.stringify(userData),
		}),
};

// API для чата
export const chatApi = {
	sendMessage: async (
		relativeDocumentPath: string,
		message: string,
		chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
		model?: string,
	): Promise<ChatResponse> =>
		fetchApi('/chat', {
			method: 'POST',
			body: JSON.stringify({
				relativeDocumentPath,
				message,
				chatHistory,
				model,
			}),
		}),
};
