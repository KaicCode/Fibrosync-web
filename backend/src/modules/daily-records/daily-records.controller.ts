import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiConsumes,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { DailyRecordsService } from './daily-records.service';
import { CreateDailyRecordDto } from './dto/create-daily-record.dto';
import { DailyRecordListResponseDto } from './dto/daily-record-list-response.dto';
import { DailyRecordQueryDto } from './dto/daily-record-query.dto';
import { DailyRecordResponseDto } from './dto/daily-record-response.dto';
import { DeleteDailyRecordResponseDto } from './dto/delete-daily-record-response.dto';
import { UpdateDailyRecordDto } from './dto/update-daily-record.dto';
import {
  EXAM_MIME_TYPES,
  MAX_EXAM_BYTES,
  MAX_EXAM_FILES,
} from './exam-attachments';
import type { ExamUploadFile } from './exam-attachments';

const recordValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

@ApiTags('Daily Records')
@ApiBearerAuth('access-token')
@Controller('daily-records')
export class DailyRecordsController {
  constructor(private readonly dailyRecordsService: DailyRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a daily patient record.' })
  @ApiCreatedResponse({ type: DailyRecordResponseDto })
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateDailyRecordDto,
  ): Promise<unknown> {
    return this.dailyRecordsService.create(userId, dto);
  }

  @Post('with-exams')
  @ApiOperation({
    summary: 'Creates a daily record with private exam attachments.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['record', 'exams'],
      properties: {
        record: {
          type: 'string',
          description: 'JSON-encoded CreateDailyRecordDto.',
        },
        exams: {
          type: 'array',
          maxItems: MAX_EXAM_FILES,
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiCreatedResponse({ type: DailyRecordResponseDto })
  @UseInterceptors(
    FilesInterceptor('exams', MAX_EXAM_FILES, {
      limits: {
        fileSize: MAX_EXAM_BYTES,
        files: MAX_EXAM_FILES,
        fields: 1,
        fieldSize: 64 * 1024,
        parts: MAX_EXAM_FILES + 1,
      },
      fileFilter: (_request, file, callback) => {
        if (!EXAM_MIME_TYPES.includes(file.mimetype)) {
          callback(
            new BadRequestException('Envie exames em PDF, JPG ou PNG.'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async createWithExams(
    @CurrentUser('sub') userId: string,
    @Body('record') recordJson: string,
    @UploadedFiles() files: ExamUploadFile[],
  ): Promise<unknown> {
    let input: unknown;
    try {
      input = JSON.parse(recordJson) as unknown;
    } catch {
      throw new BadRequestException('O registro enviado é inválido.');
    }
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw new BadRequestException('O registro enviado é inválido.');
    const dto = (await recordValidationPipe.transform(input, {
      type: 'body',
      metatype: CreateDailyRecordDto,
    })) as CreateDailyRecordDto;
    if (!files?.length)
      throw new BadRequestException('Selecione ao menos um exame.');
    return this.dailyRecordsService.create(userId, dto, files);
  }

  @Get(':id/exams/:examId')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Downloads an exam belonging to the authenticated user.',
  })
  downloadExam(
    @CurrentUser('sub') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('examId', new ParseUUIDPipe()) examId: string,
  ) {
    return this.dailyRecordsService.downloadExam(userId, id, examId);
  }

  @Get()
  @ApiOperation({ summary: 'Lists daily records for the authenticated user.' })
  @ApiOkResponse({ type: DailyRecordListResponseDto })
  list(
    @CurrentUser('sub') userId: string,
    @Query() query: DailyRecordQueryDto,
  ): Promise<unknown> {
    return this.dailyRecordsService.listForUser(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Returns a daily record by id.' })
  @ApiOkResponse({ type: DailyRecordResponseDto })
  @ApiNotFoundResponse({ description: 'Daily record not found.' })
  findOne(
    @CurrentUser('sub') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<unknown> {
    return this.dailyRecordsService.findOneForUser(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a daily record.' })
  @ApiOkResponse({ type: DailyRecordResponseDto })
  @ApiNotFoundResponse({ description: 'Daily record not found.' })
  update(
    @CurrentUser('sub') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDailyRecordDto,
  ): Promise<unknown> {
    return this.dailyRecordsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletes a daily record.' })
  @ApiOkResponse({ type: DeleteDailyRecordResponseDto })
  @ApiNotFoundResponse({ description: 'Daily record not found.' })
  remove(
    @CurrentUser('sub') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<unknown> {
    return this.dailyRecordsService.remove(userId, id);
  }
}
