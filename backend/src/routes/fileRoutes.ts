import { Router } from 'express';
import * as fileController from '../controllers/fileController';

const router = Router();

// Маршрут для проверки и создания temp директории (можно вызывать при старте приложения или по необходимости)
router.post('/ensure-temp-dir', fileController.ensureTempDir);

// Маршрут для скачивания внешнего документа и сохранения его в temp
router.post('/download-external', fileController.downloadExternalDocument);

// Маршрут для проверки существования файла в temp
router.post('/check', fileController.checkFile);

// Маршрут для удаления файла из temp
// Используем POST для передачи relativeFilePath в теле, либо можно использовать DELETE с query параметром
router.post('/delete', fileController.deleteTempFile);
// Примечание: для DELETE /api/files/:filename потребовалась бы передача имени файла в URL,
// что может быть менее удобно, если имя файла содержит спецсимволы или очень длинное.
// POST с телом здесь более гибкий.

export default router;
