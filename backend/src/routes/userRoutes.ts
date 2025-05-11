import { Router } from 'express';
import * as userController from '../controllers/userController';

const router = Router();

// Маршрут для получения всех пользователей
router.get('/', userController.getAllUsers);

// Маршрут для создания нового пользователя
router.post('/', userController.createUser);

// Маршрут для входа пользователя (аутентификации)
router.post('/login', userController.loginUser);

// Другие маршруты, связанные с пользователями (например, обновление, удаление), можно добавить здесь

export default router;
