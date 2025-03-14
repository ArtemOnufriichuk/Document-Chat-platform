'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Settings() {
	const { theme, setTheme } = useTheme();

	const handleThemeChange = (value: string) => {
		setTheme(value as 'light' | 'dark' | 'system');
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Настройки приложения</CardTitle>
				<CardDescription>Управление настройками приложения</CardDescription>
			</CardHeader>
			<CardContent className='space-y-6'>
				<div className='space-y-2'>
					<Label htmlFor='theme'>Тема</Label>
					<Select value={theme} onValueChange={handleThemeChange}>
						<SelectTrigger id='theme'>
							<SelectValue placeholder='Выберите тему' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='light'>Светлая</SelectItem>
							<SelectItem value='dark'>Темная</SelectItem>
							<SelectItem value='system'>Системная</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardContent>
		</Card>
	);
}
