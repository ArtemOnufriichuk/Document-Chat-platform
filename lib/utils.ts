import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => {
	return twMerge(clsx(inputs));
};

/**
 * Format a date in a consistent way for both server and client
 * to avoid hydration mismatches
 */
export const formatDate = (date: Date | string): string => {
	const d = typeof date === 'string' ? new Date(date) : date;

	// Use fixed ISO string format rather than locale-dependent formats
	// which can cause hydration mismatches
	return d.toISOString().split('T')[0];
};

/**
 * Format a datetime in a consistent way for both server and client
 * to avoid hydration mismatches
 */
export const formatDateTime = (date: Date | string): string => {
	const d = typeof date === 'string' ? new Date(date) : date;

	// Use fixed ISO string format rather than locale-dependent formats
	// which can cause hydration mismatches
	const isoString = d.toISOString();
	const datePart = isoString.split('T')[0];
	const timePart = isoString.split('T')[1].substring(0, 5);

	return `${datePart} ${timePart}`;
};
