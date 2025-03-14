import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Интерфейс для запроса на удаление документа
interface DeleteDocumentRequest {
  filePath: string;
}

/**
 * Проверяет существование файла
 */
async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    console.log('Проверяем существование файла для удаления:', filePath);
    await fsPromises.access(filePath);
    console.log('Файл существует');
    return true;
  } catch (error) {
    console.error('Ошибка при проверке файла:', error);
    return false;
  }
}

/**
 * Удаляет файл
 */
async function deleteFile(filePath: string): Promise<void> {
  try {
    console.log('Удаляем файл:', filePath);
    await fsPromises.unlink(filePath);
    console.log('Файл успешно удален');
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Парсим тело запроса
    const body = await request.json() as DeleteDocumentRequest;
    const { filePath } = body;
    
    console.log('Получен запрос на удаление документа:', { filePath });
    
    if (!filePath) {
      return NextResponse.json({ error: 'Отсутствует путь к файлу' }, { status: 400 });
    }
    
    // Проверяем существование файла
    const fileExists = await checkFileExists(filePath);
    
    if (!fileExists) {
      return NextResponse.json({ 
        success: true, 
        message: 'Файл уже удален или не существует'
      });
    }
    
    // Удаляем файл
    await deleteFile(filePath);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Документ успешно удален'
    });
  } catch (error) {
    console.error('Ошибка при удалении документа:', error);
    return NextResponse.json({ 
      error: 'Не удалось удалить документ', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 