import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type Spot, type User, type UpdateProfile } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit2, LogOut, Edit, X } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // State management
  const [viewingList, setViewingList] = useState<{ listName: string; region: string } | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // Fetch spots
  const { data: spots = [], isLoading } = useQuery<(Spot & { user: User })[]>({
    queryKey: ["/api/spots"],
  });

  // Check for new list from create-list page and automatically view it
  useEffect(() => {
    const newListData = sessionStorage.getItem('newListToView');
    if (newListData) {
      const listData = JSON.parse(newListData);
      sessionStorage.removeItem('newListToView');
      setViewingList({ listName: listData.listName, region: listData.region });
      toast({
        title: "リストが作成されました",
        description: `${listData.listName} (${listData.region}) への場所の追加を開始してください。`,
      });
    }
  }, [toast]);

  // Profile edit form
  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: (user as any)?.username || `${(user as any)?.firstName || ""} ${(user as any)?.lastName || ""}`.trim() || "",
      bio: (user as any)?.bio || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      await apiRequest("PUT", "/api/users/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowProfileEdit(false);
      toast({ title: "プロフィールを更新しました" });
    },
    onError: () => {
      toast({ title: "エラー", description: "プロフィールの更新に失敗しました", variant: "destructive" });
    },
  });

  const displayName = (user as any)?.username || (user as any)?.firstName || "ユーザー";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <h1
              onClick={() => setViewingList(null)}
              className="text-xl font-bold cursor-pointer hover:opacity-70 transition-opacity tracking-wider"
            >
              あしあと
            </h1>

            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await apiRequest("POST", "/api/auth/logout");
                  queryClient.clear();
                  window.location.href = "/";
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">

        {viewingList ? (
          <>
            {/* Viewing specific list */}
            <div>
              <div className="mb-6 border-2 border-foreground rounded-lg px-4 py-3">
                <h2 className="text-xl font-bold">
                  {viewingList.listName}
                </h2>
                <p className="text-sm text-muted-foreground">{viewingList.region}</p>
              </div>

              {/* Places List Section */}
              <div className="border-t-2 border-foreground pt-6">
                <p className="section-header mb-4">場所一覧</p>
                <div className="border-t border-foreground/30">
                  {isLoading ? (
                    <div className="space-y-3 pt-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : spots.filter(spot =>
                    spot.listName === viewingList.listName &&
                    spot.region === viewingList.region
                  ).length === 0 ? (
                    <p className="text-muted-foreground text-sm pt-4">このリストには場所が登録されていません</p>
                  ) : (
                    <div className="space-y-3">
                      {spots.filter(spot =>
                        spot.listName === viewingList.listName &&
                        spot.region === viewingList.region
                      ).map((spot) => (
                        <div key={spot.id} className="border-2 border-foreground rounded-lg px-4 py-3">
                          <div className="flex-1">
                            {spot.url ? (
                              <a
                                href={spot.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold underline hover:opacity-70 transition-opacity"
                              >
                                {spot.placeName || 'タイトルなし'}
                              </a>
                            ) : (
                              <h5 className="font-bold">{spot.placeName || 'タイトルなし'}</h5>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">{spot.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 下部ボタン */}
              <div className="flex justify-center mt-10">
                <Button
                  variant="outline"
                  onClick={() => {
                    sessionStorage.setItem('editingList', JSON.stringify({ listName: viewingList.listName, region: viewingList.region }));
                    setLocation('/edit-list');
                  }}
                  className="bg-primary text-primary-foreground px-8"
                  size="lg"
                >
                  <Edit2 className="mr-2 h-5 w-5" />
                  編集
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Profile Section */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-foreground">
              <div className="flex items-center space-x-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-lg font-bold bg-foreground text-background">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{displayName}</h2>
                  {(user as any)?.bio && (
                    <p className="text-sm text-muted-foreground">{(user as any).bio}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileEdit(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            {/* リスト一覧の表示 */}
            <div>
              <div className="mb-4">
                <p className="section-header">作成済みリスト一覧</p>
              </div>
              <div className="border-t-2 border-foreground">
                {spots.length === 0 ? (
                  <p className="text-muted-foreground text-sm pt-4">まだリストがありません</p>
                ) : (
                  <div className="space-y-3 pt-3">
                    {Object.entries(
                      spots.reduce((acc, spot) => {
                        const key = `${spot.listName}-${spot.region}`;
                        if (!acc[key]) {
                          acc[key] = { listName: spot.listName, region: spot.region, count: 0 };
                        }
                        acc[key].count++;
                        return acc;
                      }, {} as Record<string, { listName: string; region: string; count: number }>)
                    ).map(([key, list]) => (
                      <div key={key} className="w-full flex items-center border-2 border-foreground rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors">
                        <button
                          onClick={() => setViewingList({ listName: list.listName, region: list.region })}
                          className="flex-1 text-left"
                        >
                          <h3 className="text-lg font-bold">{list.listName}</h3>
                          <p className="text-sm text-muted-foreground">{list.region}</p>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 p-1"
                          onClick={() => {
                            sessionStorage.setItem('editingList', JSON.stringify({ listName: list.listName, region: list.region }));
                            setLocation('/edit-list');
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* リスト作成ボタン */}
            {isAuthenticated && (
              <div className="flex justify-center mt-10">
                <Button asChild size="lg" className="bg-primary text-primary-foreground px-8">
                  <Link href="/create-list">
                    <Plus className="mr-2 h-5 w-5" />
                    リスト作成
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Profile Edit Overlay */}
      {showProfileEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowProfileEdit(false)} />
          <div className="relative bg-background border-2 border-foreground rounded-lg p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">プロフィール編集</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowProfileEdit(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">ユーザーネーム</FormLabel>
                      <FormControl>
                        <Input placeholder="あなたの名前" className="border-2 border-foreground bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">ひとことプロフィール</FormLabel>
                      <FormControl>
                        <Input placeholder="自分について一言どうぞ" className="border-2 border-foreground bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-bold"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "更新中..." : "更新"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
