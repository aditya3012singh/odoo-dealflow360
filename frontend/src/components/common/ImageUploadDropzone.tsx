import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Loader2,
  Link2,
  FileText,
} from 'lucide-react';
import { uploadService } from '../../services/upload.service';

interface ImageUploadDropzoneProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  value,
  onChange,
  label = 'Product Image',
  helperText = 'Upload a high-res image (PNG, JPG, WebP) or paste an external image link.',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview when parent value changes
  React.useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  const handleFile = async (file: File) => {
    setError(null);

    // Instant local preview for zero perceptual lag
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);
    setProgress(10);

    try {
      // Async upload in background thread to Cloudinary
      const cdnUrl = await uploadService.uploadImage(file, (pct) => {
        setProgress(Math.max(15, pct));
      });

      setPreviewUrl(cdnUrl);
      onChange(cdnUrl);
      setProgress(100);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setError(err.message || 'Failed to upload image. Please try again or paste a link.');
      setPreviewUrl(value || null);
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    onChange('');
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isCloudinary = value && value.includes('cloudinary.com');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <Link2 className="w-3 h-3" />
          {isUrlMode ? 'Switch to file upload' : 'Enter external URL'}
        </button>
      </div>

      {isUrlMode ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://example.com/product-image.jpg"
              value={value || ''}
              onChange={(e) => {
                onChange(e.target.value);
                setPreviewUrl(e.target.value);
                setError(null);
              }}
              className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 dark:border-zinc-800 transition"
                title="Clear"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={onFileChange}
            className="hidden"
          />

          {!previewUrl && !uploading ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 bg-slate-50/50 dark:bg-zinc-950/40'
              }`}
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                PNG, JPG, WebP up to 10MB (Uploaded directly to Cloudinary CDN)
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-3 bg-slate-50/70 dark:bg-zinc-950/60 flex items-center gap-3.5">
              {/* Thumbnail preview */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 shrink-0 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Uploaded preview"
                    className="w-full h-full object-cover"
                    onError={() => setError('Could not load preview image.')}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center text-white">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Status / Metadata */}
              <div className="flex-1 min-w-0">
                {uploading ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        Uploading to Cloudinary...
                      </span>
                      <span className="font-mono text-slate-500 text-[10px]">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Image Ready
                      {isCloudinary && (
                        <span className="text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded-full">
                          Cloudinary CDN
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate max-w-[260px] mt-0.5">
                      {value || previewUrl}
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!uploading && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-[11px] font-medium transition cursor-pointer"
                    title="Replace Image"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-[10px] text-slate-400 dark:text-zinc-500">
        {helperText}
      </p>
    </div>
  );
};
