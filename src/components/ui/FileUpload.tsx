// ──────────────────────────────────────────────────
// Golden Leaf Finance — File Upload Component
// ──────────────────────────────────────────────────

import React, { useCallback, useState, useRef } from 'react';
import { clsx } from 'clsx';
import { Upload, X, FileImage, AlertCircle } from 'lucide-react';

export interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  onChange: (file: File | null) => void;
  error?: string;
  value?: File | null;
  preview?: string | null;
  cameraOnly?: boolean;  // For selfie capture — prevents gallery upload
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = 'image/*',
  maxSizeMB = 5,
  onChange,
  error,
  value,
  preview,
  cameraOnly = false,
  className,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(preview || null);
  const [dragOver, setDragOver] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | null) => {
      setSizeError(null);
      if (file) {
        // Size validation
        if (file.size > maxSizeMB * 1024 * 1024) {
          setSizeError(`File size must be less than ${maxSizeMB}MB`);
          return;
        }
        // Type validation
        if (accept && !file.type.match(accept.replace('*', '.*'))) {
          setSizeError('Invalid file type');
          return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
      onChange(file);
    },
    [accept, maxSizeMB, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setPreviewUrl(null);
    setSizeError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [onChange]);

  const displayError = error || sizeError;

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-rich-charcoal font-body">{label}</label>
      )}

      {previewUrl || value ? (
        // Preview
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-surface-muted bg-surface-cream">
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          )}
          {!previewUrl && value && (
            <div className="w-full h-full flex items-center justify-center">
              <FileImage size={32} className="text-gold-400" />
              <span className="ml-2 text-sm text-rich-silver">{value.name}</span>
            </div>
          )}
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-rich-black/60 text-white hover:bg-rich-black/80 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        // Upload area
        <div
          className={clsx(
            'w-full h-40 rounded-xl border-2 border-dashed',
            'flex flex-col items-center justify-center gap-2 cursor-pointer',
            'transition-all duration-250',
            dragOver
              ? 'border-gold-500 bg-gold-50'
              : 'border-rich-light/50 bg-surface-cream hover:border-gold-400 hover:bg-gold-50/50',
            displayError && 'border-status-error'
          )}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={24} className="text-gold-400" />
          <p className="text-sm text-rich-silver font-body">
            {cameraOnly ? 'Tap to capture' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-rich-light font-body">Max {maxSizeMB}MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={cameraOnly ? 'user' : undefined}
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
        className="hidden"
      />

      {displayError && (
        <p className="flex items-center gap-1 text-xs text-status-error font-body">
          <AlertCircle size={12} />
          {displayError}
        </p>
      )}
    </div>
  );
};
