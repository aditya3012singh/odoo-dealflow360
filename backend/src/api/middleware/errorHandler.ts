import { Response, NextFunction } from 'express';
import structuredLogger from '../../core/logger/structuredLogger.js';
import { TracedRequest } from './traceId.middleware.js';

export function errorHandler(err: any, req: TracedRequest, res: Response, next: NextFunction): void {
    const statusCode = err.statusCode || (err.status || 500);
    let message = err.message || 'Internal server error';

    // Detect raw database/Prisma exceptions or query engine errors
    const isInternalDb = /prisma|prismaclient|invocation|constraint failed|database|syntaxerror|prepared statement|foreign key/i.test(
        String(err.name || '') + ' ' + String(err.message || '')
    );

    if (isInternalDb) {
        message = 'Internal server error';
    }

    // Log complete error with trace ID on the backend server for developers
    structuredLogger.logError(req.traceId, err.message || 'Error', err, {
        path: req.path,
        method: req.method,
        statusCode
    });

    res.status(statusCode).json({
        success: false,
        message,
    });
}
