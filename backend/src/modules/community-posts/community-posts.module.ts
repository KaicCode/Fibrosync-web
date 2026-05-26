import { Module } from '@nestjs/common';
import { CommunityPostsController } from './community-posts.controller';
import { CommunityPostsService } from './community-posts.service';

@Module({
  controllers: [CommunityPostsController],
  providers: [CommunityPostsService],
  exports: [CommunityPostsService],
})
export class CommunityPostsModule {}
