import { Heart, MessageSquare, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

type CommunityPostCardProps = {
  author: string
  handle: string
  avatar: string
  text: string
  time: string
  likes: number
  comments: number
  badge: string
}

export function CommunityPostCard({
  author,
  handle,
  avatar,
  text,
  time,
  likes,
  comments,
  badge,
}: CommunityPostCardProps) {
  return (
    <article className="card-surface p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatar} alt={author} />
            <AvatarFallback>{author.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{author}</p>
            <p className="text-xs text-muted-foreground">
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

      <Badge className="mt-3 w-fit">{badge}</Badge>
      <p className="mt-3 text-sm leading-6 text-foreground/86">{text}</p>

      <div className="mt-4 flex items-center gap-5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-500" />
          {likes}
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand-500" />
          {comments}
        </div>
      </div>
    </article>
  )
}
