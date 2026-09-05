import api from './api';

export interface CloudinarySignData {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
}

export interface UploadProgressCallback {
  (percent: number): void;
}

export const uploadService = {
  /**
   * Fetches signed parameters from backend to allow the browser
   * to upload directly to Cloudinary without exposing API secrets.
   */
  async getSignature(folder = 'dealflow_products'): Promise<CloudinarySignData> {
    const res = await api.get<CloudinarySignData>('/upload/cloudinary-sign', {
      params: { folder },
    });
    return res.data;
  },

  /**
   * Directly uploads an image file from the browser to Cloudinary.
   * Runs asynchronously ("on another thread" via browser XHR) with live progress tracking.
   * Automatically falls back to backend stream upload if client-side direct upload is blocked.
   */
  async uploadImage(file: File, onProgress?: UploadProgressCallback): Promise<string> {
    // 1. Validate file format and size (< 10MB)
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file (PNG, JPG, WebP, GIF, SVG).');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Image size must be under 10MB.');
    }

    try {
      // 2. Obtain signature from backend
      const signData = await this.getSignature('dealflow_products');

      // 3. Direct browser-to-Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', String(signData.timestamp));
      formData.append('folder', signData.folder);
      formData.append('signature', signData.signature);

      const secureUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', signData.uploadUrl, true);

        if (onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const pct = Math.round((event.loaded / event.total) * 100);
              onProgress(pct);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resp = JSON.parse(xhr.responseText);
              if (resp.secure_url) {
                resolve(resp.secure_url);
              } else {
                reject(new Error('Cloudinary did not return a secure URL.'));
              }
            } catch (err) {
              reject(err);
            }
          } else {
            let errorMsg = `Upload failed with status ${xhr.status}`;
            try {
              const errResp = JSON.parse(xhr.responseText);
              if (errResp.error?.message) {
                errorMsg = errResp.error.message;
              }
            } catch (_) {}
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during direct Cloudinary upload'));
        xhr.send(formData);
      });

      return secureUrl;
    } catch (directErr: any) {
      console.warn('Direct Cloudinary upload encountered an issue, falling back to server relay:', directErr);

      // Fallback: Upload via backend stream
      const fallbackFormData = new FormData();
      fallbackFormData.append('file', file);
      fallbackFormData.append('folder', 'dealflow_products');

      const fallbackRes = await api.post('/upload/image', fallbackFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            onProgress(pct);
          }
        },
      });

      if (!fallbackRes.data?.url) {
        throw new Error(fallbackRes.data?.message || 'Server upload failed to return URL');
      }

      return fallbackRes.data.url;
    }
  },
};
