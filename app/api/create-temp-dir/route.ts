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
    return true;
  } catch (error) {
    // Директория не существует, создаем её
    console.log('Директория не существует, создаем:', dirPath);
    try {
      await fsPromises.mkdir(dirPath, { recursive: true });
      console.log('Директория успешно создана:', dirPath);
      return true;
    } catch (mkdirError) {
      console.error('Ошибка при создании директории:', mkdirError);
      return false;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Создаем директорию temp в корне проекта
    const tempDir = path.join(process.cwd(), 'temp');
    console.log('Создаем директорию temp:', tempDir);
    
    const created = await ensureDirectoryExists(tempDir);
    
    if (!created) {
      return NextResponse.json({ 
        error: 'Не удалось создать директорию temp' 
      }, { status: 500 });
    }
    
    // Проверяем, что директория действительно создана
    try {
      await fsPromises.access(tempDir);
      console.log('Подтверждено существование директории:', tempDir);
      
      // Создаем тестовый файл для проверки прав доступа
      const testFilePath = path.join(tempDir, 'test.txt');
      await fsPromises.writeFile(testFilePath, 'Тестовый файл');
      console.log('Тестовый файл создан:', testFilePath);
      
      // Читаем содержимое директории
      const files = await fsPromises.readdir(tempDir);
      console.log('Содержимое директории temp:', files);
      
      return NextResponse.json({ 
        success: true, 
        tempDir,
        files,
        message: 'Директория temp создана и проверена'
      });
    } catch (accessError) {
      console.error('Ошибка при проверке директории:', accessError);
      return NextResponse.json({ 
        error: 'Директория создана, но не удалось получить к ней доступ',
        details: String(accessError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Ошибка при создании директории temp:', error);
    return NextResponse.json({ 
      error: 'Не удалось создать директорию temp', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 