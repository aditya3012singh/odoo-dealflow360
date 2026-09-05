import { Request, Response, NextFunction } from 'express';
import { UploadService } from './upload.service.js';

export class UploadController {
  /**
   * GET /api/upload/cloudinary-sign
   * Returns signed parameters for direct-from-browser Cloudinary upload
   */
  static getSignature(req: Request, res: Response, next: NextFunction) {
    try {
      const folder = (req.query.folder as string) || 'dealflow_products';
      const signData = UploadService.getCloudinarySignature(folder);
      res.status(200).json(signData);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/upload/image
   * Fallback server-side upload endpoint
   */
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No image file provided in request' });
        return;
      }

      const folder = (req.body.folder as string) || 'dealflow_products';
      const result = await UploadService.uploadImageBuffer(
        req.file.buffer,
        req.file.originalname,
        folder
      );

      res.status(200).json({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      });
    } catch (err) {
      next(err);
    }
  }
}
