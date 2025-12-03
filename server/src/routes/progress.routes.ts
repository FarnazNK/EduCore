// server/src/routes/progress.routes.ts

import { Router } from 'express';
import { progressController } from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/progress/overall:
 *   get:
 *     summary: Get user's overall progress statistics
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overall progress statistics
 */
router.get('/overall', progressController.getOverallProgress);

/**
 * @swagger
 * /api/progress/lesson/{lessonId}:
 *   get:
 *     summary: Get lesson progress
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson progress
 */
router.get('/lesson/:lessonId', progressController.getLessonProgress);

/**
 * @swagger
 * /api/progress/lesson/{lessonId}:
 *   post:
 *     summary: Update lesson progress
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completed:
 *                 type: boolean
 *               watchTime:
 *                 type: number
 *     responses:
 *       200:
 *         description: Progress updated
 */
router.post('/lesson/:lessonId', progressController.updateProgress);

/**
 * @swagger
 * /api/progress/course/{courseId}:
 *   get:
 *     summary: Get course progress
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course progress with module breakdown
 */
router.get('/course/:courseId', progressController.getCourseProgress);

export default router;
