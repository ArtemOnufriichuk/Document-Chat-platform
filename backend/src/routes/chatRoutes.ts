import { Router } from 'express';
import * as chatController from '../controllers/chatController';

const router = Router();

// Основной маршрут для обработки чат-запросов
router.post('/', chatController.handleChat);

export default router;
