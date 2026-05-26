import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CommunityPostsService } from './community-posts.service';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { CommunityPostListResponseDto } from './dto/community-post-list-response.dto';
import { CommunityPostQueryDto } from './dto/community-post-query.dto';
import { CommunityPostResponseDto } from './dto/community-post-response.dto';

@ApiTags('Community Posts')
@ApiBearerAuth('access-token')
@Controller('community-posts')
export class CommunityPostsController {
  constructor(private readonly communityPostsService: CommunityPostsService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a new community post for the authenticated user.' })
  @ApiCreatedResponse({ type: CommunityPostResponseDto })
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCommunityPostDto,
  ): Promise<CommunityPostResponseDto> {
    return this.communityPostsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lists community posts visible to authenticated users.' })
  @ApiOkResponse({ type: CommunityPostListResponseDto })
  list(@Query() query: CommunityPostQueryDto): Promise<CommunityPostListResponseDto> {
    return this.communityPostsService.list(query);
  }
}
