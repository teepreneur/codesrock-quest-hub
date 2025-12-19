import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

// Create storage configuration for resources
export const resourceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req: Express.Request, file: Express.Multer.File) => {
    let folder = 'codesrock/resources';
    let resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto';

    // Determine folder and resource type based on file type
    if (file.mimetype.includes('pdf')) {
      folder = 'codesrock/resources/pdfs';
      resourceType = 'raw';
    } else if (file.mimetype.includes('image')) {
      folder = 'codesrock/resources/images';
      resourceType = 'image';
    } else if (
      file.mimetype.includes('document') ||
      file.mimetype.includes('msword') ||
      file.mimetype.includes('officedocument')
    ) {
      folder = 'codesrock/resources/documents';
      resourceType = 'raw';
    } else if (file.mimetype.includes('zip') || file.mimetype.includes('compressed')) {
      folder = 'codesrock/resources/archives';
      resourceType = 'raw';
    } else if (file.mimetype.includes('presentation') || file.mimetype.includes('powerpoint')) {
      folder = 'codesrock/resources/presentations';
      resourceType = 'raw';
    }

    // Clean filename
    const filename = file.originalname.replace(/\.[^/.]+$/, '');
    const cleanFilename = filename.replace(/[^a-zA-Z0-9]/g, '_');

    return {
      folder: folder,
      resource_type: resourceType,
      public_id: `${Date.now()}-${cleanFilename}`,
      allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'jpg', 'jpeg', 'png'],
    };
  },
});

// Create multer upload instance for resources
export const uploadResource = multer({
  storage: resourceStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Accept only specific file types
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-zip-compressed',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: PDF, DOC, DOCX, PPT, PPTX, ZIP, JPG, PNG`));
    }
  },
});

/**
 * Delete a file from Cloudinary by public ID
 */
export const deleteCloudinaryFile = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

/**
 * Get file info from Cloudinary
 */
export const getCloudinaryFileInfo = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'raw',
    });
    return result;
  } catch (error) {
    console.error('Error getting file info from Cloudinary:', error);
    throw error;
  }
};

export { cloudinary };
