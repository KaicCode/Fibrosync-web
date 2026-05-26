import { apiCall } from '@/lib/api-client'

export type CommunityPostType = 'FEED' | 'QUESTION' | 'INSIGHT'

export interface CommunityPostAuthor {
  id: string
  fullName: string
  role: 'USER' | 'ADMIN'
}

export interface CommunityPost {
  id: string
  type: CommunityPostType
  content: string
  tags: string[]
  likesCount: number
  commentsCount: number
  createdAt: string
  updatedAt: string
  author: CommunityPostAuthor
}

export interface CreateCommunityPostDto {
  type?: CommunityPostType
  content: string
}

export interface CommunityPostFilters {
  type?: CommunityPostType
  search?: string
  page?: number
  limit?: number
}

interface CommunityPostListResponse {
  items: CommunityPost[]
}

export const communityService = {
  getPosts: async (filters?: CommunityPostFilters): Promise<CommunityPost[]> => {
    const response = await apiCall<CommunityPostListResponse>('get', '/community-posts', undefined, {
      params: filters,
    })

    return response.items
  },

  createPost: async (data: CreateCommunityPostDto): Promise<CommunityPost> => {
    return apiCall<CommunityPost>('post', '/community-posts', data)
  },
}
