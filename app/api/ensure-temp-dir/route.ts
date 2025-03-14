import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

/**
 * Создает директорию, если она не существует
 */
async function ensureDirectoryExists(dirPath: string) {
  try {
    console.log('Проверяем существование директории:', dirPath);
    await fsPromises.access(dirPath);
    console.log('Директория уже существует:', dirPath);
  } catch (error) {
    // Директория не существует, создаем её
    console.log('Директория не существует, создаем:', dirPath);
    await fsPromises.mkdir(dirPath, { recursive: true });
    console.log('Директория успешно создана:', dirPath);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Создаем директорию temp, если она не существует
    const tempDir = path.join(process.cwd(), 'temp');
    console.log('Запрос на создание директории temp:', tempDir);
    
    await ensureDirectoryExists(tempDir);
    
    // Проверяем, что директория действительно создана
    try {
      await fsPromises.access(tempDir);
      console.log('Подтверждено существование директории:', tempDir);
    } catch (accessError) {
      console.error('Директория не была создана:', accessError);
      throw new Error('Не удалось создать директорию temp');
    }
    
    return NextResponse.json({ 
      success: true, 
      tempDir,
      message: 'Директория temp создана или уже существует'
    });
  } catch (error) {
    console.error('Ошибка при создании директории temp:', error);
    return NextResponse.json({ 
      error: 'Не удалось создать директорию temp', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 