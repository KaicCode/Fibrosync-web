import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PredictionQueryDto } from './dto/prediction-query.dto';
import { CrisisPredictionService } from './crisis-prediction.service';

@ApiTags('Crisis Prediction')
@ApiBearerAuth('access-token')
@Controller('crisis-predictions')
export class CrisisPredictionController {
  constructor(
    private readonly crisisPredictionService: CrisisPredictionService,
  ) {}

  @Get('latest')
  @ApiOperation({
    summary: 'Returns the latest crisis prediction for the authenticated user.',
  })
  latest(@CurrentUser('sub') userId: string): Promise<unknown> {
    return this.crisisPredictionService.getLatestForUser(userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Returns the prediction history for the authenticated user.',
  })
  history(
    @CurrentUser('sub') userId: string,
    @Query() query: PredictionQueryDto,
  ): Promise<unknown> {
    return this.crisisPredictionService.getHistoryForUser(userId, query);
  }

  @Post('recalculate/:dailyRecordId')
  @ApiOperation({
    summary: 'Recalculates the prediction for a specific daily record.',
  })
  recalculate(
    @CurrentUser('sub') userId: string,
    @Param('dailyRecordId', new ParseUUIDPipe()) dailyRecordId: string,
  ): Promise<unknown> {
    return this.crisisPredictionService.recalculate(userId, dailyRecordId);
  }
}
