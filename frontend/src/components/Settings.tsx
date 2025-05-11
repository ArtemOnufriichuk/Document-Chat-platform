import { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/ToastContext';
import { Card } from './ui/Card';
import { Label } from './ui/Label';
import { Button } from './ui/Button';

interface ThemeOption {
	value: 'light' | 'dark' | 'system';
	label: string;
}

const themeOptions: ThemeOption[] = [
	{ value: 'light', label: 'Светлая' },
	{ value: 'dark', label: 'Темная' },
	{ value: 'system', label: 'Системная' },
];

export default function Settings() {
	const { settings, updateSettings } = useAppStore();
	const { showToast } = useToast();
	const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(settings?.theme || 'light');
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

	// Обновляем локальное состояние при изменении настроек в хранилище
	useEffect(() => {
		if (settings?.theme) {
			setSelectedTheme(settings.theme);
		}
	}, [settings]);

	// Обработчик изменения темы
	const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
		setSelectedTheme(theme);
	};

	// Сохранение настроек
	const handleSaveSettings = async () => {
		try {
			setIsSaving(true);
			setSaveStatus('idle');

			await updateSettings({ theme: selectedTheme });

			setSaveStatus('success');

			// Показать уведомление об успешном сохранении
			showToast({
				title: 'Настройки сохранены',
				description: `Тема оформления изменена на ${themeOptions.find((opt) => opt.value === selectedTheme)?.label.toLowerCase()}.`,
				type: 'success',
			});
		} catch (error) {
			console.error('Error saving settings:', error);
			setSaveStatus('error');

			// Показать уведомление об ошибке
			showToast({
				title: 'Ошибка',
				description: 'Не удалось сохранить настройки',
				type: 'error',
			});
		} finally {
			setIsSaving(false);

			// Сбрасываем статус через 3 секунды
			setTimeout(() => {
				setSaveStatus('idle');
			}, 3000);
		}
	};

	return (
		<Card className='w-full max-w-2xl mx-auto'>
			<div className='p-6'>
				<h2 className='text-2xl font-bold mb-6'>Настройки</h2>

				<div className='space-y-6'>
					{/* Настройки темы */}
					<div>
						<h3 className='text-lg font-medium mb-3'>Тема оформления</h3>
						<div className='grid grid-cols-3 gap-4'>
							{themeOptions.map((option) => (
								<div
									key={option.value}
									className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${selectedTheme === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                  `}
									onClick={() => handleThemeChange(option.value)}>
									<Label className='cursor-pointer'>
										<div className='flex items-center justify-center mb-2'>
											<div
												className={`w-6 h-6 rounded-full ${
													option.value === 'light' ? 'bg-yellow-400' : option.value === 'dark' ? 'bg-gray-800' : 'bg-gradient-to-r from-yellow-400 to-gray-800'
												}`}
											/>
										</div>
										<div className='text-center'>{option.label}</div>
									</Label>
								</div>
							))}
						</div>
					</div>

					{/* Кнопка сохранения */}
					<div className='pt-4'>
						<Button onClick={handleSaveSettings} disabled={isSaving} className='w-full'>
							{isSaving ? 'Сохранение...' : 'Сохранить настройки'}
						</Button>

						{saveStatus === 'success' && <p className='text-green-600 mt-2 text-center'>Настройки успешно сохранены</p>}

						{saveStatus === 'error' && <p className='text-red-600 mt-2 text-center'>Ошибка при сохранении настроек</p>}
					</div>
				</div>
			</div>
		</Card>
	);
}
