"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import PostThread from "../components/post-thread";
import NewPostForm from "../components/new-post-form";

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Post {
  id: number;
  title: string;
  htmlDescription: string;
  jsonDescription?: any;
  type: string;
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  createdAt: Date;
  author: Author;
  userLiked?: boolean;
  _count: {
    comments: number;
    likes: number;
  };
}

interface DiscussionTabProps {
  kelasId: number;
  kelasTitle?: string;
  initialPosts?: Post[];
  initialPostsCount?: number;
  isAuthor?: boolean;
}

export default function DiscussionTab({
  kelasId,
  kelasTitle = "Kelas",
  initialPosts = [],
  initialPostsCount = 0,
  isAuthor = false,
}: DiscussionTabProps) {
  const { user, isAuthenticated } = useSession();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // UX enhancements
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "comments" | "likes">("new");
  const [pinnedFirst, setPinnedFirst] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(
    async (pageNum: number = 1, replace: boolean = false) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/posts?kelasId=${kelasId}&page=${pageNum}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          if (replace) {
            setPosts(data.posts);
          } else {
            setPosts((prev) => [...prev, ...data.posts]);
          }
          setHasMore(data.pagination.page < data.pagination.totalPages);
          setPage(pageNum);
        } else {
          toast.error("Gagal memuat postingan");
        }
      } catch {
        toast.error("Gagal memuat postingan");
      } finally {
        setIsLoading(false);
      }
    },
    [kelasId]
  );

  useEffect(() => {
    if (initialPosts.length === 0) {
      fetchPosts(1, true);
    }
  }, [kelasId, initialPosts.length, fetchPosts]);


  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchPosts(page + 1, false);
    }
  }, [isLoading, hasMore, page, fetchPosts]);

  const handleRefresh = () => {
    fetchPosts(1, true);
  };

  // Infinite scroll via IntersectionObserver (graceful with button fallback)
  useEffect(() => {
    if (!hasMore || isLoading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [handleLoadMore, hasMore, isLoading]);

  // Derived visible list (filter + sort + pinned-first)
  const visiblePosts = useMemo(() => {
    let arr = [...posts];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.htmlDescription || "").toLowerCase().includes(q)
      );
    }

    arr.sort((a, b) => {
      // Pinned first (primary sort)
      if (pinnedFirst) {
        const pinDelta = Number(b.isPinned) - Number(a.isPinned);
        if (pinDelta !== 0) return pinDelta;
      }

      // Secondary sort
      if (sort === "comments") {
        return (b._count?.comments || 0) - (a._count?.comments || 0);
      }
      if (sort === "likes") {
        return (b._count?.likes || 0) - (a._count?.likes || 0);
      }
      // "new"
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return arr;
  }, [posts, query, sort, pinnedFirst]);

  const showLoadingSkeleton = posts.length === 0 && isLoading;
  const totalText =
    initialPostsCount > 0 ? ` (${visiblePosts.length} of ${initialPostsCount})` : ` (${visiblePosts.length})`;

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Diskusi
            <span className="text-muted-foreground font-normal">{totalText}</span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <div className="w-full sm:w-[220px]">
            <Input
              placeholder="Cari diskusi..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9"
            />
          </div>

          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Terbaru</SelectItem>
              <SelectItem value="comments">Paling Dikomentari</SelectItem>
              <SelectItem value="likes">Paling Disukai</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md bg-background">
            <Switch
              id="pin-toggle"
              checked={pinnedFirst}
              onCheckedChange={setPinnedFirst}
            />
            <Label htmlFor="pin-toggle" className="text-xs text-muted-foreground">
              Disematkan di awal
            </Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* New Post Form - Always visible for authenticated users */}
      {isAuthenticated && (
        <div className="mb-6">
          <NewPostForm
            kelasId={kelasId}
            kelasTitle={kelasTitle}
            isAuthor={isAuthor}
            onPostCreated={(post) => {
              setPosts([post, ...posts]);
            }}
            onCancel={() => {
              // No cancel action needed since form is always visible
            }}
          />
        </div>
      )}

      {/* Content */}
      {showLoadingSkeleton ? (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : posts.length > 0 ? (
        <div >
          {visiblePosts.map((post) => (
            <div key={post.id}>
              <PostThread post={post} currentUserId={user?.id as string} />
            </div>
          ))}

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div className="flex flex-col items-center gap-2 py-2">
              <div ref={sentinelRef} className="h-1 w-1" />
              <div className="text-xs text-muted-foreground">
                {isLoading ? "Memuat lebih banyak..." : "Gulir untuk memuat lebih banyak"}
              </div>
              <div className="text-center">
                <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
                  {isLoading ? "Memuat..." : "Muat Lebih Banyak"}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Belum ada diskusi</h3>
          <p className="mb-4">Jadilah yang pertama untuk memulai percakapan!</p>
        </div>
      )}
    </div>
  );
}

function PostSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}
