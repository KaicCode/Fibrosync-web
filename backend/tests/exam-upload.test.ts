import assert from 'node:assert/strict';
import test from 'node:test';
import { ConfigService } from '@nestjs/config';
import { CloudinaryExamsService } from '../src/modules/daily-records/cloudinary-exams.service';
import { DailyRecordsController } from '../src/modules/daily-records/daily-records.controller';
import { DailyRecordsService } from '../src/modules/daily-records/daily-records.service';
import { MAX_EXAM_BYTES, parseStoredExams, toExamAttachment, validateExamFile } from '../src/modules/daily-records/exam-attachments';
import type { ExamUploadFile, StoredExamAttachment } from '../src/modules/daily-records/exam-attachments';
import type { PrismaService } from '../src/database/prisma.service';
import type { CrisisPredictionService } from '../src/modules/crisis-prediction/crisis-prediction.service';
import type { WeatherService } from '../src/modules/weather/weather.service';

const file: ExamUploadFile = { originalname: 'exame.pdf', mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nsynthetic exam'), size: 23 };
file.size = file.buffer.length;
const exam: StoredExamAttachment = { id: 'exam-id', name: 'exame.pdf', contentType: file.mimetype, size: file.size, uploadedAt: new Date().toISOString(), publicId: 'fibrosync/exams/test.pdf', assetId: 'asset-id' };
const dto = { recordDate: '2026-10-07', fatigueLevel: 3, stressLevel: 3, moodLevel: 6, sleepQuality: 6 };

function cloudinaryService() {
  return new CloudinaryExamsService(new ConfigService({ CLOUDINARY_CLOUD_NAME: 'test-cloud', CLOUDINARY_API_KEY: 'test-key', CLOUDINARY_API_SECRET: 'test-secret' }));
}

test('rejects a renamed executable, empty document, or oversized exam', () => {
  assert.throws(() => validateExamFile({ ...file, buffer: Buffer.from('MZhello'), size: 7 }), /conteúdo/);
  assert.throws(() => validateExamFile({ ...file, buffer: Buffer.alloc(0), size: 0 }), /vazio/);
  assert.throws(() => validateExamFile({ ...file, size: MAX_EXAM_BYTES + 1 }), /10 MB/);
  assert.throws(() => validateExamFile({ ...file, mimetype: 'application/octet-stream' }), /PDF, JPG ou PNG/);
});

test('rejects too many files before making external requests', async () => {
  await assert.rejects(() => cloudinaryService().uploadMany(Array.from({ length: 6 }, () => file)), /1 a 5/);
});

test('cleans up successful uploads if another file in the batch fails', async (context) => {
  const destroyed: string[] = [];
  let uploadCount = 0;
  context.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    const form = options.body as FormData;
    assert.equal(form.get('type'), 'authenticated');
    if (String(url).endsWith('/raw/destroy')) {
      destroyed.push(String(form.get('public_id')));
      return new Response(JSON.stringify({ result: 'ok' }), { status: 200 });
    }
    uploadCount += 1;
    if (uploadCount === 2) return new Response('{}', { status: 500 });
    return new Response(JSON.stringify({ public_id: form.get('public_id'), asset_id: 'asset-id', bytes: file.size, resource_type: 'raw', type: 'authenticated' }), { status: 200 });
  });
  await assert.rejects(() => cloudinaryService().uploadMany([file, file]), /enviar os exames/);
  assert.equal(uploadCount, 2);
  assert.equal(destroyed.length, 2);
  assert.equal(new Set(destroyed).size, 2);
});

test('does not upload when the record JSON or nested symptoms are invalid', async () => {
  let called = false;
  const controller = new DailyRecordsController({ create: () => { called = true; } } as unknown as DailyRecordsService);
  await assert.rejects(() => controller.createWithExams('user-id', '{', [file]), /inválido/);
  await assert.rejects(() => controller.createWithExams('user-id', JSON.stringify({ ...dto, unexpected: true }), [file]));
  await assert.rejects(() => controller.createWithExams('user-id', JSON.stringify({ ...dto, symptomSignal: { stiffness: 99 } }), [file]));
  assert.equal(called, false);
});

test('removes uploaded files if persisting the daily record fails', async () => {
  const removed: StoredExamAttachment[][] = [];
  const service = new DailyRecordsService(
    { $transaction: async () => { throw new Error('database unavailable'); } } as unknown as PrismaService,
    {} as CrisisPredictionService,
    { findLatestSnapshotForUserDate: async () => null } as unknown as WeatherService,
    { uploadMany: async () => [exam], removeMany: async (exams: StoredExamAttachment[]) => { removed.push(exams); } } as unknown as CloudinaryExamsService,
  );
  await assert.rejects(() => service.create('user-id', dto, [file]), /database unavailable/);
  assert.deepEqual(removed, [[exam]]);
});

test('refuses another user access to an exam without requesting Cloudinary', async () => {
  let queried: unknown;
  let downloaded = false;
  const service = new DailyRecordsService(
    { dailyRecord: { findFirst: async (query: unknown) => { queried = query; return null; } } } as unknown as PrismaService,
    {} as CrisisPredictionService,
    {} as WeatherService,
    { download: () => { downloaded = true; } } as unknown as CloudinaryExamsService,
  );
  await assert.rejects(() => service.downloadExam('other-user', 'record-id', exam.id), /not found/);
  assert.deepEqual(queried, { where: { id: 'record-id', userId: 'other-user' }, select: { metadata: true } });
  assert.equal(downloaded, false);
});

test('exposes attachment details without Cloudinary identifiers', () => {
  assert.deepEqual(parseStoredExams(null), []);
  assert.deepEqual(parseStoredExams({ exams: [{ name: 'invalid' }] }), []);
  const result = parseStoredExams({ exams: [exam] }).map(toExamAttachment);
  assert.equal(result[0]?.name, exam.name);
  assert.equal('publicId' in result[0]!, false);
  assert.equal('assetId' in result[0]!, false);
});
