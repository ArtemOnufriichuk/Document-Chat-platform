'use server';

import fs from 'fs';
import path from 'path';
import { mockDB } from './mock-data';

// Get database path
const dbPath = path.join(process.cwd(), 'database.json');

/**
 * Initialize the database with mock data if it doesn't exist
 */
export async function initializeStore() {
	try {
		// Check if database file exists
		if (!fs.existsSync(dbPath)) {
			// Create new database with mock data
			const jsonData = JSON.stringify(mockDB, null, 2);
			fs.writeFileSync(dbPath, jsonData);
			console.log('Database initialized with mock data');
		}
	} catch (error) {
		console.error('Error initializing store:', error);
	}
}

/**
 * Get users from database
 */
export async function getDbUsers() {
	try {
		if (fs.existsSync(dbPath)) {
			const data = fs.readFileSync(dbPath, 'utf8');
			const db = JSON.parse(data);
			return db.users || [];
		}
		return mockDB.users;
	} catch (error) {
		console.error('Error getting users:', error);
		return mockDB.users;
	}
}

/**
 * Get documents from database
 */
export async function getDbDocuments() {
	try {
		if (fs.existsSync(dbPath)) {
			const data = fs.readFileSync(dbPath, 'utf8');
			const db = JSON.parse(data);
			return db.documents || [];
		}
		return mockDB.documents;
	} catch (error) {
		console.error('Error getting documents:', error);
		return mockDB.documents;
	}
}

/**
 * Get settings from database
 */
export async function getDbSettings() {
	try {
		if (fs.existsSync(dbPath)) {
			const data = fs.readFileSync(dbPath, 'utf8');
			const db = JSON.parse(data);
			return db.settings || {};
		}
		return mockDB.settings;
	} catch (error) {
		console.error('Error getting settings:', error);
		return mockDB.settings;
	}
}
