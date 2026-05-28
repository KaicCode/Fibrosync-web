import { cn } from "@/lib/utils";

export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[1rem] bg-[linear-gradient(90deg,rgba(240,233,255,0.95),rgba(248,244,255,0.85),rgba(240,233,255,0.95))] bg-[length:220%_100%]",
        className,
      )}
    />
  );
}
