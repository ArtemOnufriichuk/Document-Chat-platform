import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes'; // Импорт маршрутов пользователей
import documentRoutes from './routes/documentRoutes'; // Импорт маршрутов документов
import fileRoutes from './routes/fileRoutes'; // Импорт маршрутов для файлов
import chatRoutes from './routes/chatRoutes'; // Импорт маршрутов для чата

// Загрузка переменных окружения из .env файла
dotenv.config();

const app: Express = express();
// Используем process.env.PORT из .env файла, если он там определен
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Увеличиваем лимит для JSON, если Base64 PDF будет большим
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Для URL-encoded данных, если понадобятся

app.get('/', (req: Request, res: Response) => {
	res.send('Backend server is running!'); // Можно оставить простое сообщение
});

// Подключаем маршруты для пользователей
app.use('/api/users', userRoutes);
// Для аутентификации можно использовать /api/auth или оставить в /api/users/login
// Для единообразия с существующим API, оставим /api/users/login, но в будущем /api/auth/login было бы лучше

// Подключаем маршруты для документов
app.use('/api/documents', documentRoutes);

// Подключаем маршруты для файлов
app.use('/api/files', fileRoutes);

// Подключаем маршруты для чата
app.use('/api/chat', chatRoutes);

// Простой обработчик ошибок (можно улучшить)
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
	console.error('Unhandled error:', err.stack);
	res.status(500).send('Something broke!');
});

app.listen(port, () => {
	console.log(`[server]: Server is running at http://localhost:${port}`);
});
