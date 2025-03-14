import { create } from 'zustand';
import type { User, Document, Settings } from '@/types';

interface AppStore {
	// Auth
	currentUser: User | null;
	users: User[];
	login: (username: string, password: string) => boolean;
	logout: () => void;

	// User Management
	addUser: (user: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) => Promise<void>;
	updateUser: (id: string, user: Partial<User>) => Promise<void>;
	deleteUser: (id: string) => Promise<void>;
	changeUserPermissions: (id: string, isAdmin: boolean) => Promise<void>;

	// Documents
	documents: Document[];
	addDocument: (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
	updateDocument: (id: string, document: Partial<Document>) => Promise<void>;
	removeDocument: (id: string) => Promise<void>;
	setDocuments: (documents: Document[]) => void;

	// Document selection for chat
	selectedDocumentIds: string[];
	setSelectedDocumentIds: (ids: string[] | ((prev: string[]) => string[])) => void;
	toggleDocumentSelection: (id: string) => void;
	clearDocumentSelection: () => void;

	// Data fetching
	fetchUsers: () => Promise<void>;
	fetchDocuments: () => Promise<void>;

	// Settings
	settings: Settings | null;
	updateSettings: (settings: Partial<Settings>) => Promise<void>;

	// Search
	searchTerm: string;
	searchDocuments: (term: string) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
	// Auth
	currentUser: null,
	users: [],
	login: (username, password) => {
		const user = get().users.find((u) => u.login === username && u.password === password);
		if (user) {
			set({ currentUser: user });
			return true;
		}
		return false;
	},
	logout: () => set({ currentUser: null }),

	// User Management
	addUser: async (user) => {
		try {
			const response = await fetch('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(user),
			});
			if (response.ok) {
				await get().fetchUsers();
			} else {
				throw new Error('Failed to add user');
			}
		} catch (error) {
			console.error('Error adding user:', error);
			throw error;
		}
	},
	updateUser: async (id, updatedUser) => {
		try {
			// Optimistic update
			set((state) => ({
				users: state.users.map((user) => (user.id === id ? { ...user, ...updatedUser } : user)),
			}));
		} catch (error) {
			console.error('Error updating user:', error);
			throw error;
		}
	},
	deleteUser: async (id) => {
		try {
			// Optimistic update
			set((state) => ({
				users: state.users.filter((user) => user.id !== id),
			}));
		} catch (error) {
			console.error('Error deleting user:', error);
			throw error;
		}
	},
	changeUserPermissions: async (id, isAdmin) => {
		try {
			// Optimistic update
			set((state) => ({
				users: state.users.map((user) => (user.id === id ? { ...user, isAdmin } : user)),
			}));
		} catch (error) {
			console.error('Error changing user permissions:', error);
			throw error;
		}
	},

	// Documents
	documents: [],
	addDocument: async (document) => {
		try {
			// Make API request to add document
			const response = await fetch('/api/documents', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(document),
			});

			if (!response.ok) {
				throw new Error('Failed to add document');
			}

			// Get the newly added document with proper ID and timestamps
			const newDocument = await response.json();

			// Update the documents state with the new document
			set((state) => ({
				documents: [...state.documents, newDocument],
			}));

			// Also fetch fresh documents to ensure we have the latest state
			await get().fetchDocuments();

			return newDocument;
		} catch (error) {
			console.error('Error adding document:', error);
			throw error;
		}
	},
	updateDocument: async (id, updatedDocument) => {
		try {
			// Optimistic update
			set((state) => ({
				documents: state.documents.map((doc) => (doc.id === id ? { ...doc, ...updatedDocument, updatedAt: new Date().toISOString() } : doc)),
			}));

			// Persist changes to the database
			const response = await fetch(`/api/documents?id=${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedDocument),
			});

			if (!response.ok) {
				// Revert optimistic update on error
				await get().fetchDocuments();
				throw new Error('Failed to update document');
			}
		} catch (error) {
			console.error('Error updating document:', error);
			throw error;
		}
	},
	removeDocument: async (id) => {
		try {
			// Optimistic update
			set((state) => ({
				documents: state.documents.filter((doc) => doc.id !== id),
				// Also remove from selected documents if present
				selectedDocumentIds: state.selectedDocumentIds.filter((docId) => docId !== id),
			}));

			// Persist changes to the database
			const response = await fetch(`/api/documents?id=${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				// Revert optimistic update on error
				await get().fetchDocuments();
				throw new Error('Failed to delete document');
			}
		} catch (error) {
			console.error('Error removing document:', error);
			throw error;
		}
	},
	setDocuments: (documents) => {
		set({ documents });
	},

	// Document selection for chat
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

	// Data fetching - improved with caching logic
	fetchUsers: async () => {
		try {
			const response = await fetch('/api/users');
			if (response.ok) {
				const users = await response.json();
				// Only update if different to prevent unnecessary re-renders
				const currentUsers = get().users;
				if (JSON.stringify(currentUsers) !== JSON.stringify(users)) {
					set({ users });
				}
			}
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	},
	fetchDocuments: async () => {
		try {
			const response = await fetch('/api/documents');
			if (response.ok) {
				const documents = await response.json();
				// Only update if different to prevent unnecessary re-renders
				const currentDocuments = get().documents;
				if (JSON.stringify(currentDocuments) !== JSON.stringify(documents)) {
					set({ documents });
				}
			}
		} catch (error) {
			console.error('Error fetching documents:', error);
		}
	},

	// Settings
	settings: null,
	updateSettings: async (newSettings) => {
		try {
			set((state) => ({
				settings: { ...(state.settings || {}), ...newSettings },
			}));
		} catch (error) {
			console.error('Error updating settings:', error);
			throw error;
		}
	},

	// Search
	searchTerm: '',
	searchDocuments: (term) => {
		set({ searchTerm: term });
	},
}));

// Initialize with hardcoded users if running in browser
// if (typeof window !== 'undefined') {
// 	// Check if users are already initialized
// 	const currentUsers = useAppStore.getState().users;
// 	if (!currentUsers || currentUsers.length === 0) {
// 		const hardcodedUsers = [
// 			{
// 				id: '1',
// 				login: 'admin',
// 				password: 'admin123',
// 				isAdmin: true,
// 				email: 'admin@example.com',
// 				fullName: 'Admin User',
// 				createdAt: '2023-01-01T00:00:00.000Z',
// 				lastLogin: '2023-01-01T00:00:00.000Z',
// 			},
// 			{
// 				id: '2',
// 				login: 'user',
// 				password: 'user123',
// 				isAdmin: false,
// 				email: 'user@example.com',
// 				fullName: 'Regular User',
// 				createdAt: '2023-01-01T00:00:00.000Z',
// 				lastLogin: '2023-01-01T00:00:00.000Z',
// 			},
// 		];
// 		useAppStore.setState({ users: hardcodedUsers });
// 	}
// }
