import { BadRequestException } from '@nestjs/common';

export const MAX_EXAM_FILES = 5;
export const MAX_EXAM_BYTES = 10 * 1024 * 1024;
export const EXAM_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export interface ExamUploadFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface ExamAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface StoredExamAttachment extends ExamAttachment {
  publicId: string;
  assetId: string;
}

export function validateExamFile(file: ExamUploadFile): void {
  if (!EXAM_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestException('Envie exames em PDF, JPG ou PNG.');
  }
  if (
    !file.size ||
    file.size > MAX_EXAM_BYTES ||
    file.buffer.length !== file.size
  ) {
    throw new BadRequestException(
      'Cada exame deve ter no máximo 10 MB e não pode estar vazio.',
    );
  }

  const matchesContent =
    (file.mimetype === 'application/pdf' &&
      file.buffer.subarray(0, 5).toString() === '%PDF-') ||
    (file.mimetype === 'image/jpeg' &&
      file.buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) ||
    (file.mimetype === 'image/png' &&
      file.buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])));

  if (!matchesContent) {
    throw new BadRequestException(
      'O conteúdo do exame não corresponde ao formato informado.',
    );
  }
}

export function parseStoredExams(metadata: unknown): StoredExamAttachment[] {
  if (
    !metadata ||
    typeof metadata !== 'object' ||
    !('exams' in metadata) ||
    !Array.isArray(metadata.exams)
  ) {
    return [];
  }
  return metadata.exams.filter(
    (exam: unknown): exam is StoredExamAttachment => {
      if (!exam || typeof exam !== 'object') return false;
      const candidate = exam as Partial<StoredExamAttachment>;
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.name === 'string' &&
        typeof candidate.publicId === 'string' &&
        typeof candidate.assetId === 'string' &&
        typeof candidate.contentType === 'string' &&
        typeof candidate.size === 'number' &&
        typeof candidate.uploadedAt === 'string'
      );
    },
  );
}

export function toExamAttachment(exam: StoredExamAttachment): ExamAttachment {
  return {
    id: exam.id,
    name: exam.name,
    contentType: exam.contentType,
    size: exam.size,
    uploadedAt: exam.uploadedAt,
  };
}
