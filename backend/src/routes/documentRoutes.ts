import { Router } from 'express';
import * as documentController from '../controllers/documentController';

const router = Router();

// Маршрут для получения всех документов
router.get('/', documentController.getAllDocuments);

// Маршрут для создания нового документа
router.post('/', documentController.createDocument);

// Маршрут для обновления документа по ID
router.put('/:id', documentController.updateDocument);

// Маршрут для удаления документа по ID
router.delete('/:id', documentController.deleteDocument);

export default router;
