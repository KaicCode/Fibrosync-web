import { Heart, MessageSquare, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { resolveUserAvatar } from '@/lib/user-profile'
import type { CommunityPost } from '@/services/community.service'

type CommunityPostCardProps = {
  post: CommunityPost
}

const typeLabel: Record<CommunityPost['type'], string> = {
  FEED: 'Feed',
  QUESTION: 'Pergunta',
  INSIGHT: 'Insight',
}

function formatRelativeTime(value: string): string {
  const createdAt = new Date(value).getTime()
  const now = Date.now()
  const diffMinutes = Math.max(Math.round((now - createdAt) / 60000), 0)

  if (diffMinutes < 1) {
    return 'agora'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min`
  }

  const diffHours = Math.round(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}h`
  }

  const diffDays = Math.round(diffHours / 24)

  if (diffDays < 7) {
    return `${diffDays}d`
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

function buildHandle(name: string): string {
  const sanitized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')

  return `@${sanitized || 'paciente'}`
}

export function CommunityPostCard({ post }: CommunityPostCardProps) {
  const avatar = resolveUserAvatar({ fullName: post.author.fullName })
  const handle = buildHandle(post.author.fullName)
  const time = formatRelativeTime(post.createdAt)

  return (
    <article className="card-surface p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatar} alt={post.author.fullName} />
            <AvatarFallback>{post.author.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground break-words">{post.author.fullName}</p>
            <p className="text-xs text-muted-foreground break-words">
              {handle} · {time}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="rounded-full p-2 text-muted-foreground transition hover:bg-brand-50 hover:text-brand-700"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge className="w-fit">{typeLabel[post.type]}</Badge>
        <Badge variant={post.author.role === 'ADMIN' ? 'warning' : 'neutral'}>
          {post.author.role === 'ADMIN' ? 'Administrador' : 'Paciente'}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-7 text-foreground/86 whitespace-pre-wrap break-words">
        {post.content}
      </p>

      {post.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={`${post.id}-${tag}`}
              className="rounded-full border border-white/80 bg-white/84 px-3 py-1.5 text-xs font-medium text-brand-700 shadow-soft"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-500" />
          {post.likesCount}
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand-500" />
          {post.commentsCount}
        </div>
      </div>
    </article>
  )
}
