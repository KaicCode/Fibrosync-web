import { Injectable } from '@nestjs/common';
import { CommunityPostType, Prisma } from '@prisma/client';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import { PrismaService } from '@/database/prisma.service';
import type { CreateCommunityPostDto } from './dto/create-community-post.dto';
import type { CommunityPostListResponseDto } from './dto/community-post-list-response.dto';
import type { CommunityPostQueryDto } from './dto/community-post-query.dto';
import type { CommunityPostResponseDto } from './dto/community-post-response.dto';
import {
  type CommunityPostDetails,
  communityPostResponseSelect,
} from './community-posts.select';

@Injectable()
export class CommunityPostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateCommunityPostDto,
  ): Promise<CommunityPostResponseDto> {
    const content = dto.content.trim();
    const tags = this.extractTags(content);

    const post = await this.prisma.communityPost.create({
      data: {
        userId,
        type: dto.type ?? CommunityPostType.FEED,
        content,
        tags,
      },
      select: communityPostResponseSelect,
    });

    return this.mapPost(post);
  }

  async list(
    query: CommunityPostQueryDto,
  ): Promise<CommunityPostListResponseDto> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const search = this.normalizeSearch(query.search);
    const tagSearch = search?.replace(/^#/, '').toLowerCase();

    const where: Prisma.CommunityPostWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(search
        ? {
            OR: [
              {
                content: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                user: {
                  fullName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
              ...(tagSearch
                ? [
                    {
                      tags: {
                        has: tagSearch,
                      },
                    } satisfies Prisma.CommunityPostWhereInput,
                  ]
                : []),
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.communityPost.findMany({
        where,
        select: communityPostResponseSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapPost(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  private normalizeSearch(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private extractTags(content: string): string[] {
    const matches = content.match(/#([\p{L}\p{N}_-]+)/gu) ?? [];

    return Array.from(
      new Set(
        matches
          .map((match) =>
            match
              .slice(1)
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase(),
          )
          .filter(Boolean),
      ),
    ).slice(0, 8);
  }

  private mapPost(post: CommunityPostDetails): CommunityPostResponseDto {
    return {
      id: post.id,
      type: post.type,
      content: post.content,
      tags: post.tags,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.user.id,
        fullName: post.user.fullName,
        role: post.user.role,
      },
    };
  }
}
