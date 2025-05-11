import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Объединяет классы с помощью clsx и оптимизирует их с tailwind-merge
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
