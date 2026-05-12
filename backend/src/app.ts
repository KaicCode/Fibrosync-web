import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import routes from './modules/modules.routes';
import { errorHandler } from '@middlewares/error-handler.middleware';
import { requestLogger } from '@middlewares/request-logger.middleware';
import Logger from '@utils/logger';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerOptions from '@config/swagger';

const app = express();

const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  Logger.info(`Server is running on port ${PORT}`);
});

export default app;
