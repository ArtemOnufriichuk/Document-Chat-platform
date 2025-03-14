import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import ThemeProvider from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
	title: 'Document Chat',
	description: 'Chat with your PDF documents using AI',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<html lang='ru'>
			<head>
				<link rel='preload' href='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js' as='script' />
			</head>
			<body className={inter.className}>
				<ThemeProvider defaultTheme='dark'>{children}</ThemeProvider>
			</body>
		</html>
	);
};

export default RootLayout;
