import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import env from '../../core/config/env.js';
import logger from '../../core/logger/structuredLogger.js';

// Configure Cloudinary instance
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || 'dhndy2wl7',
  api_key: env.CLOUDINARY_API_KEY || '734245242986747',
  api_secret: env.CLOUDINARY_API_SECRET || 'zI-kFwIqQcYhhoSRvyMTY85HOHs',
  secure: true,
});

export interface CloudinarySignResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
}

export class UploadService {
  /**
   * Generates a secure timestamped signature for direct client-side (frontend) upload.
   * This offloads the multi-megabyte image binary upload completely from the backend server.
   */
  static getCloudinarySignature(folder = 'dealflow_products'): CloudinarySignResponse {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const cloudName = env.CLOUDINARY_CLOUD_NAME || 'dhndy2wl7';
    const apiKey = env.CLOUDINARY_API_KEY || '734245242986747';
    const apiSecret = env.CLOUDINARY_API_SECRET || 'zI-kFwIqQcYhhoSRvyMTY85HOHs';

    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    };
  }

  /**
   * Fallback server-side upload via stream.
   * If a client browser has strict adblock/firewall rules blocking api.cloudinary.com,
   * the backend can upload the buffered image directly.
   */
  static async uploadImageBuffer(
    buffer: Buffer,
    filename?: string,
    folder = 'dealflow_products'
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          public_id: filename ? filename.replace(/\.[^/.]+$/, '') : undefined,
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary stream upload error:', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary upload returned empty response'));
          }
          resolve(result);
        }
      );

      uploadStream.end(buffer);
    });
  }
}
