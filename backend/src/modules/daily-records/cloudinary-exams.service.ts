import { createHash, randomUUID } from 'node:crypto';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAX_EXAM_FILES, validateExamFile } from './exam-attachments';
import type { ExamUploadFile, StoredExamAttachment } from './exam-attachments';

@Injectable()
export class CloudinaryExamsService {
  private readonly logger = new Logger(CloudinaryExamsService.name);

  constructor(private readonly config: ConfigService) {}

  private credentials() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'O envio de exames ainda não está configurado.',
      );
    }
    return {
      baseUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}`,
      apiKey,
      apiSecret,
    };
  }

  private signedParameters(
    parameters: Record<string, string | number | boolean>,
  ) {
    const { apiKey, apiSecret } = this.credentials();
    const values = { ...parameters, timestamp: Math.floor(Date.now() / 1000) };
    const payload = Object.entries(values)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return {
      ...values,
      api_key: apiKey,
      signature: createHash('sha1')
        .update(payload + apiSecret)
        .digest('hex'),
    };
  }

  async uploadMany(files: ExamUploadFile[]): Promise<StoredExamAttachment[]> {
    if (!files.length || files.length > MAX_EXAM_FILES) {
      throw new BadRequestException('Selecione de 1 a 5 exames.');
    }
    files.forEach(validateExamFile);
    this.credentials();
    const results = await Promise.allSettled(
      files.map((file) => this.upload(file)),
    );
    const uploaded = results.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );
    if (results.some((result) => result.status === 'rejected')) {
      await this.removeMany(uploaded);
      throw new BadGatewayException(
        'Não foi possível enviar os exames. Tente novamente.',
      );
    }
    return uploaded;
  }

  private async upload(file: ExamUploadFile): Promise<StoredExamAttachment> {
    const id = randomUUID();
    const extension =
      file.mimetype === 'application/pdf'
        ? 'pdf'
        : file.mimetype === 'image/png'
          ? 'png'
          : 'jpg';
    const publicId = `fibrosync/exams/${id}.${extension}`;
    const form = new FormData();
    for (const [key, value] of Object.entries(
      this.signedParameters({
        public_id: publicId,
        type: 'authenticated',
        overwrite: false,
      }),
    )) {
      form.append(key, String(value));
    }
    form.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      `exam.${extension}`,
    );
    try {
      const response = await fetch(`${this.credentials().baseUrl}/raw/upload`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(30000),
      });
      const result = (await response.json()) as {
        public_id?: string;
        asset_id?: string;
        bytes?: number;
        resource_type?: string;
        type?: string;
      };
      if (
        !response.ok ||
        result.public_id !== publicId ||
        !result.asset_id ||
        result.bytes !== file.size ||
        result.resource_type !== 'raw' ||
        result.type !== 'authenticated'
      ) {
        throw new Error('Cloudinary did not confirm the exam upload.');
      }
      const decodedName = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );
      const name = decodedName.includes('\ufffd')
        ? file.originalname
        : decodedName;
      return {
        id,
        publicId,
        assetId: result.asset_id,
        name:
          name.replace(/[\p{Cc}/\\]/gu, '_').slice(0, 180) ||
          `exame.${extension}`,
        contentType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };
    } catch {
      // A timed out upload may still have reached Cloudinary; remove its unique ID too.
      await this.removeMany([{ publicId }]);
      throw new BadGatewayException(
        'Não foi possível enviar o exame. Tente novamente.',
      );
    }
  }

  async download(exam: StoredExamAttachment): Promise<Buffer> {
    const parameters = this.signedParameters({
      asset_id: exam.assetId,
      expires_at: Math.floor(Date.now() / 1000) + 60,
    });
    const query = new URLSearchParams(
      Object.entries(parameters).map(([key, value]) => [key, String(value)]),
    );
    try {
      const response = await fetch(
        `${this.credentials().baseUrl}/asset/download?${query}`,
        { signal: AbortSignal.timeout(30000) },
      );
      if (!response.ok) throw new Error('Exam download failed.');
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length !== exam.size)
        throw new Error('Exam download size mismatch.');
      return buffer;
    } catch {
      throw new BadGatewayException(
        'Não foi possível baixar o exame. Tente novamente.',
      );
    }
  }

  async removeMany(
    exams: Array<Pick<StoredExamAttachment, 'publicId'>>,
  ): Promise<void> {
    await Promise.all(
      exams.map(async (exam) => {
        try {
          const form = new FormData();
          for (const [key, value] of Object.entries(
            this.signedParameters({
              public_id: exam.publicId,
              type: 'authenticated',
              invalidate: true,
            }),
          )) {
            form.append(key, String(value));
          }
          const response = await fetch(
            `${this.credentials().baseUrl}/raw/destroy`,
            { method: 'POST', body: form, signal: AbortSignal.timeout(15000) },
          );
          const result = (await response.json()) as { result?: string };
          if (
            !response.ok ||
            !['ok', 'not found'].includes(result.result ?? '')
          )
            throw new Error('Exam cleanup failed.');
        } catch {
          this.logger.error(
            `Não foi possível remover o exame ${exam.publicId} do Cloudinary.`,
          );
        }
      }),
    );
  }
}
