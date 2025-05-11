import { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, ToastContainer } from '../components/ui/Toast';
import { nanoid } from 'nanoid';

// Тип для тоста
interface ToastItem {
	id: string;
	title?: string;
	description?: string;
	type?: 'success' | 'error' | 'info' | 'warning';
	duration?: number;
}

// Интерфейс контекста
interface ToastContextType {
	toasts: ToastItem[];
	showToast: (toast: Omit<ToastItem, 'id'>) => void;
	hideToast: (id: string) => void;
}

// Создаем контекст с дефолтными значениями
const ToastContext = createContext<ToastContextType>({
	toasts: [],
	showToast: () => {},
	hideToast: () => {},
});

// Хук для использования контекста
export const useToast = () => useContext(ToastContext);

// Провайдер контекста
export const ToastProvider = ({ children }: { children: ReactNode }) => {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	// Показать тост
	const showToast = (toast: Omit<ToastItem, 'id'>) => {
		const id = nanoid();
		setToasts((prev) => [...prev, { ...toast, id }]);

		// Автоматически удаляем тост после указанного времени
		const duration = toast.duration || 5000;
		setTimeout(() => {
			hideToast(id);
		}, duration);
	};

	// Скрыть тост
	const hideToast = (id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	};

	return (
		<ToastContext.Provider value={{ toasts, showToast, hideToast }}>
			{children}
			<ToastContainer>
				{toasts.map((toast) => (
					<Toast
						key={toast.id}
						id={toast.id}
						title={toast.title}
						description={toast.description}
						type={toast.type}
						onClose={hideToast}
						duration={toast.duration}
					/>
				))}
			</ToastContainer>
		</ToastContext.Provider>
	);
};
