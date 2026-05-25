import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { DailyRecordsService } from './daily-records.service';
import { CreateDailyRecordDto } from './dto/create-daily-record.dto';
import { DailyRecordListResponseDto } from './dto/daily-record-list-response.dto';
import { DailyRecordQueryDto } from './dto/daily-record-query.dto';
import { DailyRecordResponseDto } from './dto/daily-record-response.dto';
import { DeleteDailyRecordResponseDto } from './dto/delete-daily-record-response.dto';
import { UpdateDailyRecordDto } from './dto/update-daily-record.dto';

@ApiTags('Daily Records')
@ApiBearerAuth('access-token')
@Controller('daily-records')
export class DailyRecordsController {
  constructor(private readonly dailyRecordsService: DailyRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a daily patient record.' })
  @ApiCreatedResponse({ type: DailyRecordResponseDto })
  @ApiConflictResponse({
    description: 'A daily record for this date already exists.',
  })
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateDailyRecordDto,
  ): Promise<unknown> {
    return this.dailyRecordsService.create(userId, dto);
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
