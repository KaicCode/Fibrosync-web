import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '@middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 */
router.post('/register', (req, res, next) => authController.register(req, res, next));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autentica um usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 */
router.post('/login', (req, res, next) => authController.login(req, res, next));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Retorna o perfil do usuário logado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

export default router;
