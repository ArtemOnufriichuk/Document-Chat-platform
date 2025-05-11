import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAppStore } from './lib/store';
import { ToastProvider } from './lib/ToastContext';
import './App.css';

// Компоненты
import LoginPage from './components/LoginPage';
import Loading from './components/Loading';
import DocumentList from './components/DocumentList';
import AddDocumentForm from './components/AddDocumentForm';
import Chat from './components/Chat';
import Settings from './components/Settings';
import UserManagement from './components/UserManagement';
import { Button } from './components/ui/Button';

// Защищенный маршрут
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const { currentUser, isLoading } = useAppStore();

	if (isLoading) {
		return <Loading fullScreen />;
	}

	if (!currentUser) {
		return <Navigate to='/login' replace />;
	}

	return <>{children}</>;
};

// Защищенный маршрут только для администраторов
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
	const { currentUser, isLoading } = useAppStore();

	if (isLoading) {
		return <Loading fullScreen />;
	}

	if (!currentUser) {
		return <Navigate to='/login' replace />;
	}

	if (!currentUser.isAdmin) {
		return <Navigate to='/' replace />;
	}

	return <>{children}</>;
};

// Компонент навигации
const Navigation = () => {
	const { currentUser, logout } = useAppStore();
	const isAdmin = currentUser?.isAdmin === true;

	return (
		<nav className='bg-white shadow-sm mb-6 p-4'>
			<div className='container mx-auto flex justify-between items-center'>
				<Link to='/' className='text-xl font-bold'>
					Document Chat
				</Link>

				<div className='flex space-x-4'>
					<Link to='/'>
						<Button variant='ghost'>Главная</Button>
					</Link>
					<Link to='/documents'>
						<Button variant='ghost'>Документы</Button>
					</Link>
					<Link to='/chat'>
						<Button variant='ghost'>Чат</Button>
					</Link>
					{isAdmin && (
						<Link to='/users'>
							<Button variant='ghost'>Пользователи</Button>
						</Link>
					)}
					<Link to='/settings'>
						<Button variant='ghost'>Настройки</Button>
					</Link>
					<Button variant='ghost' onClick={() => logout()}>
						Выйти
					</Button>
				</div>
			</div>
		</nav>
	);
};

// Главный компонент приложения
function App() {
	const { fetchDocuments, isLoading, currentUser, settings, initializeSettings } = useAppStore();
	const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

	// Инициализация настроек и загрузка данных при инициализации
	useEffect(() => {
		initializeSettings();
		fetchDocuments();
	}, [fetchDocuments, initializeSettings]);

	// Применение темы и отслеживание системных предпочтений
	useEffect(() => {
		const applyTheme = (themeToApply: 'light' | 'dark' | 'system') => {
			const htmlElement = document.documentElement;
			htmlElement.classList.remove('light', 'dark');

			if (themeToApply === 'system') {
				const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				if (systemPrefersDark) {
					htmlElement.classList.add('dark');
				} else {
					htmlElement.classList.add('light');
				}
			} else {
				htmlElement.classList.add(themeToApply);
			}
		};

		if (settings?.theme) {
			applyTheme(settings.theme);
		}

		const mediaQueryListener = (e: MediaQueryListEvent) => {
			if (settings?.theme === 'system') {
				applyTheme('system');
			}
		};

		const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		darkModeMediaQuery.addEventListener('change', mediaQueryListener);

		return () => {
			darkModeMediaQuery.removeEventListener('change', mediaQueryListener);
		};
	}, [settings]);

	return (
		<ToastProvider>
			<Router>
				{isLoading && <Loading fullScreen />}
				<Routes>
					<Route path='/login' element={currentUser ? <Navigate to='/' replace /> : <LoginPage />} />

					<Route
						path='/'
						element={
							<ProtectedRoute>
								<div className='min-h-screen bg-gray-50'>
									<Navigation />
									<div className='container mx-auto px-4'>
										<div className='bg-white p-8 rounded-lg shadow-md'>
											<h1 className='text-3xl font-bold text-center mb-6'>Document Chat</h1>
											<p className='text-gray-600 mb-6 text-center'>Система для анализа документов и чата с ними.</p>

											<div className='grid grid-cols-2 gap-6 mt-8'>
												<Link to='/documents' className='bg-blue-50 p-6 rounded-lg hover:bg-blue-100 transition-colors'>
													<h2 className='text-xl font-semibold mb-2'>Управление документами</h2>
													<p className='text-gray-600'>Добавляйте, редактируйте и удаляйте документы для анализа.</p>
												</Link>

												<Link to='/chat' className='bg-green-50 p-6 rounded-lg hover:bg-green-100 transition-colors'>
													<h2 className='text-xl font-semibold mb-2'>Чат с документами</h2>
													<p className='text-gray-600'>Задавайте вопросы и получайте ответы на основе загруженных документов.</p>
												</Link>
											</div>
										</div>
									</div>
								</div>
							</ProtectedRoute>
						}
					/>

					<Route
						path='/documents'
						element={
							<ProtectedRoute>
								<div className='min-h-screen bg-gray-50'>
									<Navigation />
									<div className='container mx-auto px-4'>
										<div className='grid md:grid-cols-3 gap-6'>
											<div className='md:col-span-2'>
												<DocumentList onSelectDocument={(id) => setSelectedDocument(id)} />
											</div>
											<div>
												<AddDocumentForm />
											</div>
										</div>
									</div>
								</div>
							</ProtectedRoute>
						}
					/>

					<Route
						path='/chat'
						element={
							<ProtectedRoute>
								<div className='min-h-screen bg-gray-50'>
									<Navigation />
									<div className='container mx-auto px-4'>
										<div className='grid md:grid-cols-3 gap-6'>
											<div className='md:col-span-2'>
												<Chat documentId={selectedDocument || ''} documentPath={selectedDocument ? `documents/${selectedDocument}` : undefined} />
											</div>
											<div>
												<DocumentList onSelectDocument={(id) => setSelectedDocument(id)} />
											</div>
										</div>
									</div>
								</div>
							</ProtectedRoute>
						}
					/>

					<Route
						path='/settings'
						element={
							<ProtectedRoute>
								<div className='min-h-screen bg-gray-50'>
									<Navigation />
									<div className='container mx-auto px-4'>
										<Settings />
									</div>
								</div>
							</ProtectedRoute>
						}
					/>

					<Route
						path='/users'
						element={
							<AdminRoute>
								<div className='min-h-screen bg-gray-50'>
									<Navigation />
									<div className='container mx-auto px-4'>
										<UserManagement />
									</div>
								</div>
							</AdminRoute>
						}
					/>

					{/* Перенаправление на главную для всех неизвестных маршрутов */}
					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</Router>
		</ToastProvider>
	);
}

export default App;
