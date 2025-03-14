import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Интерфейс для запроса на скачивание документа
interface DownloadDocumentRequest {
  fileUrl: string;
  docId: string;
  outputPath: string;
}

/**
 * Создает директорию, если она не существует
 */
async function ensureDirectoryExists(dirPath: string) {
  try {
    await fsPromises.access(dirPath);
  } catch (error) {
    // Директория не существует, создаем её
    await fsPromises.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Скачивает файл по URL и сохраняет его в указанный путь
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Не удалось скачать файл: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    await fsPromises.writeFile(outputPath, Buffer.from(buffer));
  } catch (error) {
    console.error('Ошибка при скачивании файла:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Парсим тело запроса
    const body = await request.json() as DownloadDocumentRequest;
    const { fileUrl, docId, outputPath } = body;
    
    console.log('Получен запрос на скачивание документа:', { fileUrl, docId, outputPath });
    
    if (!fileUrl || !docId || !outputPath) {
      return NextResponse.json({ error: 'Отсутствует URL файла, ID документа или путь для сохранения' }, { status: 400 });
    }
    
    // Создаем директорию temp, если она не существует
    const tempDir = path.join(process.cwd(), 'temp');
    console.log('Создаем директорию:', tempDir);
    await ensureDirectoryExists(tempDir);
    
    // Формируем абсолютный путь для сохранения файла
    const absoluteOutputPath = path.join(process.cwd(), outputPath);
    console.log('Абсолютный путь для сохранения файла:', absoluteOutputPath);
    
    // Скачиваем файл
    await downloadFile(fileUrl, absoluteOutputPath);
    console.log('Файл успешно скачан');
    
    // Проверяем, что файл действительно существует
    try {
      await fsPromises.access(absoluteOutputPath);
      console.log('Подтверждено существование файла:', absoluteOutputPath);
    } catch (accessError) {
      console.error('Файл не был создан:', accessError);
      throw new Error('Не удалось создать файл');
    }
    
    // Возвращаем путь к скачанному файлу
    return NextResponse.json({ 
      success: true, 
      filePath: outputPath, // Возвращаем относительный путь для использования на клиенте
      absolutePath: absoluteOutputPath, // Для отладки
      message: 'Документ успешно скачан'
    });
  } catch (error) {
    console.error('Ошибка при обработке запроса на скачивание документа:', error);
    return NextResponse.json({ 
      error: 'Не удалось скачать документ', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 