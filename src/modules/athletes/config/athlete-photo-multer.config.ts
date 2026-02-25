import { mkdirSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

const UPLOADS_ATHLETES = '/uploads/athletes';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

function ensureUploadsAthletesDir(): string {
  if (!existsSync(UPLOADS_ATHLETES)) {
    mkdirSync(UPLOADS_ATHLETES, { recursive: true });
  }
  return UPLOADS_ATHLETES;
}

export const athletePhotoMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination(_req, _file, cb) {
      const dir = ensureUploadsAthletesDir();
      cb(null, dir);
    },
    filename(_req, file, cb) {
      const ext = extname(file.originalname) || '.jpg';
      const filename = `${randomUUID()}${ext}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter(_req, file, cb) {
    const allowed = ALLOWED_MIME_TYPES.includes(file.mimetype);
    if (allowed) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        ),
        false,
      );
    }
  },
};
