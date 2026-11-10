// ──────────────────────────────────────────────────
// Golden Leaf Finance — Cloudinary Image Upload Service
// Handles all image uploads via unsigned upload preset
// ──────────────────────────────────────────────────

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  original_filename: string;
}

/**
 * Compress an image file before upload using HTML5 Canvas.
 */
async function compressImage(file: File | Blob | string, maxWidth = 1200, quality = 0.8): Promise<File | Blob | string> {
  if (typeof file === 'string') {
    return file;
  }
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            resolve(new File([blob], (file as File).name || 'upload.jpg', { type: 'image/jpeg', lastModified: Date.now() }));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Upload an image to Cloudinary using unsigned upload preset.
 * Automatically compresses large images client-side before sending.
 * @param file - File, Blob or DataURL string to upload
 * @param folder - Cloudinary folder path (e.g., 'customers', 'kyc', 'attendance')
 * @returns The upload result containing secure_url and public_id
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadImage(
  file: File | Blob | string,
  folder?: string
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary configuration missing. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env'
    );
  }

  // If already an uploaded remote URL, return immediately without re-uploading
  if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://'))) {
    return {
      secure_url: file,
      public_id: file.split('/').pop()?.split('.')[0] || 'existing_asset',
      width: 0,
      height: 0,
      format: 'jpg',
      bytes: 0,
      original_filename: 'existing',
    };
  }

  // Security & Stability Validation for File objects
  if (file instanceof File) {
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      throw new Error(`Unsupported file type: ${file.type || 'unknown'}. Allowed formats: JPG, PNG, WEBP.`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum 5MB limit.`);
    }
  }

  const payload = await compressImage(file);

  const formData = new FormData();
  formData.append('file', payload as any);
  formData.append('upload_preset', UPLOAD_PRESET);
  if (folder) {
    formData.append('folder', `golden-leaf/${folder}`);
  }

  let response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  // Resilient Fallback: If preset restricts or overrides folder, retry without the folder parameter
  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    const errMsg = errorJson?.error?.message || response.statusText || '';
    if (errMsg.toLowerCase().includes('folder')) {
      const retryFormData = new FormData();
      retryFormData.append('file', payload as any);
      retryFormData.append('upload_preset', UPLOAD_PRESET);
      response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: retryFormData,
      });
      if (!response.ok) {
        const retryErr = await response.json().catch(() => null);
        throw new Error(`Cloudinary upload failed: ${retryErr?.error?.message || response.statusText}`);
      }
      return response.json();
    }
    throw new Error(`Cloudinary upload failed: ${errMsg}`);
  }

  return response.json();
}

// ─── Domain-Specific Upload Helpers ───

/**
 * Upload a customer profile photo.
 */
export async function uploadCustomerPhoto(
  file: File,
  customerId: string
): Promise<string> {
  const result = await uploadImage(file, `customers/${customerId}`);
  return result.secure_url;
}

/**
 * Upload a KYC document (Aadhaar front/back, PAN, etc.)
 */
export async function uploadKYCDocument(
  file: File,
  customerId: string,
  documentType: 'aadhaar_front' | 'aadhaar_back' | 'pan' | 'voter_id'
): Promise<string> {
  const result = await uploadImage(file, `kyc/${customerId}/${documentType}`);
  return result.secure_url;
}

/**
 * Upload an attendance selfie for check-in.
 */
export async function uploadAttendanceSelfie(
  file: File,
  employeeId: string
): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const result = await uploadImage(file, `attendance/${employeeId}/${dateStr}`);
  return result.secure_url;
}

/**
 * Upload a Non-Collection (NC) photo proof.
 */
export async function uploadNCProof(
  file: File,
  collectionId: string
): Promise<string> {
  const result = await uploadImage(file, `collections/nc/${collectionId}`);
  return result.secure_url;
}

/**
 * Upload an employee profile photo.
 */
export async function uploadEmployeePhoto(
  file: File,
  employeeId: string
): Promise<string> {
  const result = await uploadImage(file, `employees/${employeeId}`);
  return result.secure_url;
}

/**
 * Upload an employee ID proof document.
 */
export async function uploadEmployeeIdProof(
  file: File,
  employeeId: string
): Promise<string> {
  const result = await uploadImage(file, `employees/${employeeId}/id-proof`);
  return result.secure_url;
}

/**
 * Upload a nominee photo.
 */
export async function uploadNomineePhoto(
  file: File,
  customerId: string
): Promise<string> {
  const result = await uploadImage(file, `customers/${customerId}/nominee`);
  return result.secure_url;
}

// ─── Image Delivery & Concurrency Optimizations ───

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'limit' | 'fit' | 'thumb' | 'scale';
  quality?: 'auto' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  format?: 'auto' | 'webp' | 'png' | 'jpg';
}

/**
 * Transform a Cloudinary image URL to apply auto-format, auto-quality,
 * dynamic resizing, and smart cropping to minimize bandwidth and accelerate render times.
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: ImageTransformOptions = {}
): string {
  if (!url || typeof url !== 'string') return '';
  if (!url.includes('cloudinary.com')) return url;

  const {
    width,
    height,
    crop = 'limit',
    quality = 'auto',
    format = 'auto',
  } = options;

  const transformations: string[] = [];

  if (format) transformations.push(`f_${format}`);
  if (quality) transformations.push(`q_${quality}`);
  if (crop) transformations.push(`c_${crop}`);
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);

  const transformString = transformations.join(',');

  const uploadIndex = url.indexOf('/image/upload/');
  if (uploadIndex === -1) return url;

  const prefix = url.substring(0, uploadIndex + '/image/upload/'.length);
  const suffix = url.substring(uploadIndex + '/image/upload/'.length);

  // Prevent duplicate transformations if already transformed
  if (suffix.startsWith('f_auto') || suffix.startsWith('c_')) {
    return url;
  }

  return `${prefix}${transformString}/${suffix}`;
}

export interface BatchUploadItem {
  file: File;
  folder: string;
}

/**
 * Upload multiple images with a concurrency pool limiter (default max 3 simultaneous requests).
 * Prevents request storms and connection pool exhaustion when multiple documents are uploaded.
 */
export async function uploadMultipleImages(
  items: BatchUploadItem[],
  maxConcurrent = 3,
  onProgress?: (completed: number, total: number) => void
): Promise<CloudinaryUploadResult[]> {
  if (!items || items.length === 0) return [];

  const results: CloudinaryUploadResult[] = new Array(items.length);
  let executingIndex = 0;
  let completedCount = 0;

  async function worker() {
    while (executingIndex < items.length) {
      const currentIndex = executingIndex++;
      const item = items[currentIndex];
      results[currentIndex] = await uploadImage(item.file, item.folder);
      completedCount++;
      if (onProgress) {
        onProgress(completedCount, items.length);
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrent, items.length) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

