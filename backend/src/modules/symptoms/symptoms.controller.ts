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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { DeleteSymptomResponseDto } from './dto/delete-symptom-response.dto';
import { SymptomListResponseDto } from './dto/symptom-list-response.dto';
import { SymptomResponseDto } from './dto/symptom-response.dto';
import { SymptomQueryDto } from './dto/symptom-query.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { SymptomsService } from './symptoms.service';

@ApiTags('Symptoms')
@ApiBearerAuth('access-token')
@Controller('symptoms')
export class SymptomsController {
  constructor(private readonly symptomsService: SymptomsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Creates an indirect symptom signal record for the authenticated user.',
  })
  @ApiCreatedResponse({ type: SymptomResponseDto })
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSymptomDto,
  ): Promise<SymptomResponseDto> {
    return this.symptomsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Lists indirect symptom signal records for the authenticated user.',
  })
  @ApiOkResponse({ type: SymptomListResponseDto })
  list(
    @CurrentUser('sub') userId: string,
    @Query() query: SymptomQueryDto,
  ): Promise<SymptomListResponseDto> {
    return this.symptomsService.listForUser(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Returns an indirect symptom signal record by id.' })
  @ApiOkResponse({ type: SymptomResponseDto })
  @ApiNotFoundResponse({ description: 'Symptoms record not found.' })
  findOne(
    @CurrentUser('sub') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SymptomResponseDto> {
    return this.symptomsService.findOneForUser(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates an indirect symptom signal record.' })
  @ApiOkResponse({ type: SymptomResponseDto })
  @ApiNotFoundResponse({ description: 'Symptoms record not found.' })
  update(
    @CurrentUser('sub') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSymptomDto,
  ): Promise<SymptomResponseDto> {
    return this.symptomsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletes an indirect symptom signal record.' })
  @ApiOkResponse({ type: DeleteSymptomResponseDto })
  @ApiNotFoundResponse({ description: 'Symptoms record not found.' })
  remove(
    @CurrentUser('sub') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<DeleteSymptomResponseDto> {
    return this.symptomsService.remove(userId, id);
  }
}
