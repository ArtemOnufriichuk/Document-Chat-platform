import { create } from 'zustand';
import { documentsApi, authApi } from './api';

// Интерфейсы для типов данных
export interface User {
	id: string;
	login: string;
	isAdmin: boolean;
	email: string;
	fullName?: string;
	createdAt: string;
	lastLogin: string;
}

export interface Document {
	id: string;
	title: string;
	url: string;
	createdAt: string;
	updatedAt: string;
}

export interface Settings {
	theme?: 'light' | 'dark' | 'system';
}

export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

// Интерфейс для состояния приложения
interface AppStore {
	// Аутентификация
	currentUser: User | null;
	users: User[];
	login: (username: string, password: string) => Promise<boolean>;
	logout: () => void;

	// Управление пользователями
	addUser: (user: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) => Promise<void>;
	updateUser: (id: string, user: Partial<User>) => Promise<void>;
	deleteUser: (id: string) => Promise<void>;
	changeUserPermissions: (id: string, isAdmin: boolean) => Promise<void>;

	// Документы
	documents: Document[];
	addDocument: (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
	updateDocument: (id: string, document: Partial<Document>) => Promise<void>;
	removeDocument: (id: string) => Promise<void>;
	setDocuments: (documents: Document[]) => void;

	// Выбор документа для чата
	selectedDocumentIds: string[];
	setSelectedDocumentIds: (ids: string[] | ((prev: string[]) => string[])) => void;
	toggleDocumentSelection: (id: string) => void;
	clearDocumentSelection: () => void;

	// Загрузка данных
	fetchUsers: () => Promise<void>;
	fetchDocuments: () => Promise<void>;

	// Настройки
	settings: Settings;
	initializeSettings: () => void;
	updateSettings: (settings: Partial<Settings>) => Promise<void>;

	// Поиск
	searchTerm: string;
	searchDocuments: (term: string) => void;

	// Индикатор загрузки
	isLoading: boolean;
	setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
	// Аутентификация
	currentUser: null,
	users: [],
	login: async (username, password) => {
		try {
			set({ isLoading: true });
			const response = await authApi.login(username, password);
			if (response && response.user) {
				set({ currentUser: response.user });
				return true;
			}
			return false;
		} catch (error) {
			console.error('Error logging in:', error);
			return false;
		} finally {
			set({ isLoading: false });
		}
	},
	logout: () => set({ currentUser: null }),

	// Управление пользователями
	addUser: async (user) => {
		try {
			set({ isLoading: true });
			// Додобавляем поле password, т.к. оно требуется в API
			const userData = {
				login: user.login,
				email: user.email,
				password: '', // Это значение должно быть передано при вызове
				fullName: user.fullName,
				isAdmin: user.isAdmin,
			};

			if ('password' in user) {
				userData.password = (user as any).password;
			}

			await authApi.createUser(userData);
			await get().fetchUsers();
		} catch (error) {
			console.error('Error adding user:', error);
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},
	updateUser: async (id, updatedUser) => {
		try {
			set({ isLoading: true });
			// Оптимистичное обновление
			set((state) => ({
				users: state.users.map((user) => (user.id === id ? { ...user, ...updatedUser } : user)),
			}));
			// В будущем можно добавить API call для обновления на сервере
		} catch (error) {
			console.error('Error updating user:', error);
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},
	deleteUser: async (id) => {
		try {
			set({ isLoading: true });
			// Оптимистичное обновление
			set((state) => ({
				users: state.users.filter((user) => user.id !== id),
			}));
			// В будущем можно добавить API call для удаления на сервере
		} catch (error) {
			console.error('Error deleting user:', error);
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},
	changeUserPermissions: async (id, isAdmin) => {
		try {
			set({ isLoading: true });
			// Оптимистичное обновление
			set((state) => ({
				users: state.users.map((user) => (user.id === id ? { ...user, isAdmin } : user)),
			}));
			// В будущем можно добавить API call для обновления на сервере
		} catch (error) {
			console.error('Error changing user permissions:', error);
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	// Документы
	documents: [],
	addDocument: async (document) => {
		try {
			set({ isLoading: true });
			// Создаем запись о документе
			const newDocument = await documentsApi.createDocument(document.title, document.url);

			// Обновляем список документов
			set((state) => ({
				documents: [...state.documents, newDocument],
			}));

			// Возвращаем void вместо document, чтобы соответствовать типу
		} catch (error) {
			console.error('Error adding document:', error);
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},
	updateDocument: async (id, updatedDocument) => {
		try {
			set({ isLoading: true });
			// Оптимистичное обновление
			set((state) => ({
				documents: state.documents.map((doc) => (doc.id === id ? { ...doc, ...updatedDocument, updatedAt: new Date().toISOString() } : doc)),
			}));

			// Обновление на сервере
			await documentsApi.updateDocument(id, updatedDocument);
		} catch (error) {
			console.error('Error updating document:', error);
			// В случае ошибки, отменяем оптимистичное обновление
			await get().fetchDocuments();
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},
	removeDocument: async (id) => {
		try {
			set({ isLoading: true });
			// Оптимистичное обновление
			set((state) => ({
				documents: state.documents.filter((doc) => doc.id !== id),
				// Также удаляем из выбранных документов, если он там был
				selectedDocumentIds: state.selectedDocumentIds.filter((docId) => docId !== id),
			}));

			// Удаление на сервере
			await documentsApi.deleteDocument(id);
		} catch (error) {
			console.error('Error removing document:', error);
			// В случае ошибки, отменяем оптимистичное обновление
			await get().fetchDocuments();
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},
	setDocuments: (documents) => {
		set({ documents });
	},

	// Выбор документа для чата
	selectedDocumentIds: [],
	setSelectedDocumentIds: (idsOrFunction) => {
		if (typeof idsOrFunction === 'function') {
			set((state) => ({
				selectedDocumentIds: idsOrFunction(state.selectedDocumentIds),
			}));
		} else {
			set({ selectedDocumentIds: idsOrFunction });
		}
	},
	toggleDocumentSelection: (id) => {
		set((state) => {
			if (state.selectedDocumentIds.includes(id)) {
				return {
					selectedDocumentIds: state.selectedDocumentIds.filter((docId) => docId !== id),
				};
			} else {
				return {
					selectedDocumentIds: [...state.selectedDocumentIds, id],
				};
			}
		});
	},
	clearDocumentSelection: () => {
		set({ selectedDocumentIds: [] });
	},

	// Загрузка данных
	fetchUsers: async () => {
		try {
			set({ isLoading: true });
			const users = await authApi.getAllUsers();
			set({ users });
		} catch (error) {
			console.error('Error fetching users:', error);
		} finally {
			set({ isLoading: false });
		}
	},
	fetchDocuments: async () => {
		try {
			set({ isLoading: true });
			const documents = await documentsApi.getAllDocuments();
			set({ documents: documents as Document[] });
		} catch (error) {
			console.error('Error fetching documents:', error);
		} finally {
			set({ isLoading: false });
		}
	},

	// Настройки
	settings: { theme: 'system' },
	initializeSettings: () => {
		const storedSettings = localStorage.getItem('app-settings');
		if (storedSettings) {
			try {
				const parsedSettings = JSON.parse(storedSettings) as Settings;
				set({ settings: { ...get().settings, ...parsedSettings } });
			} catch (e) {
				console.error('Failed to parse settings from localStorage', e);
				// Fallback to default if parsing fails or structure is unexpected
				const defaultTheme = 'system';
				localStorage.setItem('app-settings', JSON.stringify({ theme: defaultTheme }));
				set({ settings: { theme: defaultTheme } });
			}
		} else {
			// If no settings in localStorage, save default (system)
			const defaultTheme = 'system';
			localStorage.setItem('app-settings', JSON.stringify({ theme: defaultTheme }));
			set({ settings: { theme: defaultTheme } });
		}
	},
	updateSettings: async (newSettings) => {
		try {
			set({ isLoading: true });
			const currentSettings = get().settings;
			const updatedSettings = { ...currentSettings, ...newSettings };
			set({ settings: updatedSettings });
			localStorage.setItem('app-settings', JSON.stringify(updatedSettings));
			// В будущем можно добавить API call для сохранения настроек на сервере
		} catch (error) {
			console.error('Error updating settings:', error);
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	// Поиск
	searchTerm: '',
	searchDocuments: (term) => {
		set({ searchTerm: term });
	},

	// Индикатор загрузки
	isLoading: false,
	setIsLoading: (loading) => set({ isLoading: loading }),
}));

// Initialize settings when the store is created/loaded
// This is a common pattern but might need adjustment based on how Zustand initializes
// A more robust way is to call initializeSettings from a top-level component like App.tsx
// For now, let's assume it's called. If not, we'll adjust.
// useAppStore.getState().initializeSettings(); // Removed as it's now called in App.tsx useEffect
