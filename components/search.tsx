'use client';

import type React from 'react';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon, X } from 'lucide-react';

const Search = () => {
	const { searchDocuments, searchTerm: globalSearchTerm } = useAppStore();
	const [searchTerm, setSearchTerm] = useState(globalSearchTerm || '');
	const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

	// Update local state when global state changes
	useEffect(() => {
		setSearchTerm(globalSearchTerm || '');
	}, [globalSearchTerm]);

	// Debounce search term to avoid excessive updates
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedTerm(searchTerm);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	// Apply search when debounced term changes
	useEffect(() => {
		searchDocuments(debouncedTerm);
	}, [debouncedTerm, searchDocuments]);

	// Handle form submission
	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			searchDocuments(searchTerm);
		},
		[searchTerm, searchDocuments],
	);

	// Clear search input and results
	const clearSearch = useCallback(() => {
		setSearchTerm('');
		searchDocuments('');
	}, [searchDocuments]);

	return (
		<form onSubmit={handleSearch} className='flex gap-2 mb-4'>
			<div className='relative flex-grow'>
				<SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
				<Input type='text' placeholder='Поиск документов...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-9 pr-9' />
				{searchTerm && (
					<Button type='button' variant='ghost' size='icon' className='absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7' onClick={clearSearch}>
						<X className='h-4 w-4' />
						<span className='sr-only'>Очистить</span>
					</Button>
				)}
			</div>
			<Button type='submit'>Поиск</Button>
		</form>
	);
};

export default Search;
