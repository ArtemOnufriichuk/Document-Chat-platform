import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Интерфейс для запроса на проверку файла
interface CheckFileRequest {
  filePath: string;
}

/**
 * Проверяет существование файла
 */
async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    console.log('Проверяем существование файла:', filePath);
    await fsPromises.access(filePath);
    console.log('Файл существует');
    return true;
  } catch (error) {
    console.error('Ошибка при проверке файла:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Парсим тело запроса
    const body = await request.json() as CheckFileRequest;
    const { filePath } = body;
    
    console.log('Получен запрос на проверку файла:', { filePath });
    
    if (!filePath) {
      return NextResponse.json({ error: 'Отсутствует путь к файлу' }, { status: 400 });
    }
    
    // Проверяем существование файла
    const fileExists = await checkFileExists(filePath);
    
    return NextResponse.json({ 
      exists: fileExists,
      filePath,
      message: fileExists ? 'Файл существует' : 'Файл не найден'
    });
  } catch (error) {
    console.error('Ошибка при проверке файла:', error);
    return NextResponse.json({ 
      error: 'Не удалось проверить файл', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 