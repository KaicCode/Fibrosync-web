import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { communityService } from '@/services/community.service'
import type {
  CommunityPostFilters,
  CreateCommunityPostDto,
} from '@/services/community.service'

export function useCommunity(filters?: CommunityPostFilters) {
  const queryClient = useQueryClient()

  const postsQuery = useQuery({
    queryKey: [
      'communityPosts',
      filters?.type ?? null,
      filters?.search ?? '',
      filters?.page ?? 1,
      filters?.limit ?? null,
    ],
    queryFn: () => communityService.getPosts(filters),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateCommunityPostDto) => communityService.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] })
    },
  })

  return {
    posts: postsQuery.data ?? [],
    isLoading: postsQuery.isLoading,
    error: postsQuery.error,
    createPost: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
