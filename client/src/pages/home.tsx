import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfileSchema, insertSpotSchema, type Spot, type User, type UpdateProfile, type InsertSpot } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, LogOut, Edit, X, MapPin, MessageCircle, Link2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  // State management
  const [viewingList, setViewingList] = useState<{ listName: string; region: string } | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [, setLocation] = useLocation();

  // ログイン時は自分のスポットのみ、未ログイン時は全体の公開スポットを取得
  const userId = (user as any)?.id;
  const spotsQueryKey = isAuthenticated && userId
    ? [`/api/users/${userId}/spots`]
    : ["/api/spots"];

  // Fetch spots
  const { data: spots = [], isLoading } = useQuery<(Spot & { user: User })[]>({
    queryKey: spotsQueryKey,
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

  // Spot addition form
  const spotForm = useForm<{ placeName: string; url: string; comment: string }>({
    resolver: zodResolver(insertSpotSchema.pick({ placeName: true, url: true, comment: true })),
    defaultValues: { placeName: "", url: "", comment: "" },
  });

  // URL extraction mutation
  const extractUrlMutation = useMutation({
    mutationFn: async (url: string): Promise<{ storeName?: string; prefecture?: string }> => {
      const response = await apiRequest("POST", "/api/extract-url", { url });
      return await response.json() as { storeName?: string; prefecture?: string };
    },
    onSuccess: (data: { storeName?: string; prefecture?: string }) => {
      if (data.storeName && data.storeName.trim()) {
        spotForm.setValue("placeName", data.storeName.trim());
      }
    },
  });

  const handleUrlChange = (url: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://')) &&
        (url.includes('tabelog.com') || url.includes('maps.app.goo.gl') ||
         url.includes('google.com/maps') || url.includes('gnavi.co.jp') ||
         url.includes('hotpepper.jp'))) {
      extractUrlMutation.mutate(url);
    }
  };

  // Create spot mutation
  const createSpotMutation = useMutation({
    mutationFn: async (data: InsertSpot): Promise<Spot> => {
      const response = await apiRequest("POST", "/api/spots", data);
      return await response.json() as Spot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spotsQueryKey });
      spotForm.reset();
      setShowAddSpot(false);
      toast({ title: "場所が追加されました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  // List creation form (popup)
  const createListForm = useForm<{ region: string; listName: string }>({
    resolver: zodResolver(z.object({
      region: z.string().min(1, "場所名を入力してください"),
      listName: z.string().min(1, "ジャンルを入力してください"),
    })),
    defaultValues: { region: "", listName: "" },
  });

  const onCreateList = (data: { region: string; listName: string }) => {
    setShowCreateList(false);
    createListForm.reset();
    setViewingList({ listName: data.listName, region: data.region });
    toast({
      title: "リストが作成されました",
      description: "場所を追加してください",
    });
  };

  // Spot edit form
  const editSpotForm = useForm<{ placeName: string; url: string; comment: string }>({
    resolver: zodResolver(insertSpotSchema.pick({ placeName: true, url: true, comment: true })),
    defaultValues: { placeName: "", url: "", comment: "" },
  });

  const openEditSpot = (spot: Spot) => {
    editSpotForm.reset({
      placeName: spot.placeName || "",
      url: spot.url || "",
      comment: spot.comment || "",
    });
    setEditingSpot(spot);
  };

  const updateSpotMutation = useMutation({
    mutationFn: async (data: { placeName: string; url: string; comment: string }) => {
      if (!editingSpot) return;
      await apiRequest("PUT", `/api/spots/${editingSpot.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spotsQueryKey });
      setEditingSpot(null);
      toast({ title: "更新しました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const displayName = (user as any)?.username || (user as any)?.firstName || "ユーザー";

  return (
    <div className="min-h-screen bg-[#E9BC4F] text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#E9BC4F]">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <button
              onClick={() => setViewingList(null)}
              className="cursor-pointer hover:opacity-70 transition-opacity"
            >
              <span className="text-2xl font-black tracking-widest">レコメン</span>
            </button>

            {isAuthenticated ? (
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
            ) : (
              <Button asChild variant="ghost" size="sm" className="font-bold">
                <a href="/auth">ログイン</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">

        {viewingList ? (
          <>
            {/* Viewing specific list（白カード） */}
            <div className="bg-white border-2 border-black rounded-3xl max-w-2xl mx-auto px-6 sm:px-10 py-8 min-h-[24rem] flex flex-col">
              <h2 className="text-xl font-black text-center mb-8">
                {viewingList.region}でおすすめの{viewingList.listName}
              </h2>

              {/* Places List Section */}
              <div className="flex-1">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse border border-black/20 px-4 py-4">
                        <div className="h-4 bg-muted w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : spots.filter(spot =>
                  spot.listName === viewingList.listName &&
                  spot.region === viewingList.region
                ).length === 0 ? (
                  <p className="text-sm text-center py-8">このリストには場所が登録されていません</p>
                ) : (
                  <div className="space-y-4">
                    {spots.filter(spot =>
                      spot.listName === viewingList.listName &&
                      spot.region === viewingList.region
                    ).map((spot) => (
                      <div key={spot.id} className="border border-black px-4 py-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {spot.url ? (
                            <a
                              href={spot.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:opacity-70 transition-opacity"
                            >
                              {spot.placeName || 'タイトルなし'}
                            </a>
                          ) : (
                            <span>{spot.placeName || 'タイトルなし'}</span>
                          )}
                          {spot.comment && (
                            <span>・・・ {spot.comment}</span>
                          )}
                        </div>
                        {isAuthenticated && (
                          <button
                            onClick={() => openEditSpot(spot)}
                            aria-label="編集"
                            className="shrink-0 text-black/50 hover:text-black transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 追加ボタン（オレンジの＋） */}
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setShowAddSpot(true)}
                  aria-label="場所を追加"
                  className="bg-[#E8613C] hover:bg-[#d4552f] transition-colors rounded-xl w-12 h-12 flex items-center justify-center"
                >
                  <Plus className="h-7 w-7 text-white" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Profile Section (shown only when logged in) */}
            {isAuthenticated && (
              <div className="flex items-center justify-between mb-8">
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
            )}

            {/* リスト一覧（カード） */}
            <div>
              {(() => {
                const allLists = Object.values(
                  spots.reduce((acc, spot) => {
                    const key = `${spot.listName}-${spot.region}`;
                    if (!acc[key]) {
                      acc[key] = { listName: spot.listName, region: spot.region, places: [] as string[] };
                    }
                    acc[key].places.push(spot.placeName || "タイトルなし");
                    return acc;
                  }, {} as Record<string, { listName: string; region: string; places: string[] }>)
                );
                return isLoading ? (
                  <div className="flex flex-wrap gap-6">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-white/60 rounded-3xl w-72 h-64"></div>
                    ))}
                  </div>
                ) : allLists.length === 0 ? (
                  <p className="text-center py-16 font-bold">まだリストがありません</p>
                ) : (
                  <div className="flex flex-wrap gap-6">
                    {allLists.map((list) => (
                      <button
                        key={`${list.listName}-${list.region}`}
                        onClick={() => setViewingList({ listName: list.listName, region: list.region })}
                        className="flex flex-col bg-white border-2 border-black rounded-3xl w-full sm:w-72 h-64 px-6 py-5 text-left overflow-hidden hover:opacity-90 transition-opacity"
                      >
                        <h3 className="text-lg font-black text-center mb-4">
                          {list.region}
                          <span className="mx-1">✕</span>
                          {list.listName}
                        </h3>
                        <ul className="space-y-1">
                          {list.places.slice(0, 6).map((place, i) => (
                            <li key={i} className="truncate">・{place}</li>
                          ))}
                        </ul>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* 新規リスト作成（ポップアップを開く。未ログイン時はログイン画面へ） */}
              <div className="flex justify-center mt-16 pb-10">
                <button
                  onClick={() => {
                    if (isAuthenticated) {
                      setShowCreateList(true);
                    } else {
                      setLocation("/auth");
                    }
                  }}
                  className="bg-[#E8613C] hover:bg-[#d4552f] text-white text-lg font-bold px-10 py-3 rounded-xl transition-colors"
                >
                  リスト作成
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Spot Overlay */}
      {showAddSpot && viewingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddSpot(false)} />
          <div className="relative bg-background border-2 border-foreground rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">場所を追加</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddSpot(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Form {...spotForm}>
              <form onSubmit={spotForm.handleSubmit((data) => {
                createSpotMutation.mutate({
                  ...data,
                  listName: viewingList.listName,
                  region: viewingList.region,
                });
              })} className="space-y-4">
                <FormField
                  control={spotForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center font-bold">
                        <Link2 className="mr-1 h-4 w-4" />
                        URL <span className="text-xs text-muted-foreground ml-2 font-normal">(場所の情報を自動入力)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="https://example.com"
                            className="px-3 py-2 border-2 border-foreground bg-background"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleUrlChange(e.target.value);
                            }}
                          />
                          {extractUrlMutation.isPending && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin h-4 w-4 border-b-2 border-foreground"></div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={spotForm.control}
                  name="placeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center font-bold">
                        <MapPin className="mr-1 h-4 w-4" />
                        場所名
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例：スターバックス コーヒー 渋谷店"
                          className="px-3 py-2 border-2 border-foreground bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={spotForm.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center font-bold">
                        <MessageCircle className="mr-1 h-4 w-4" />
                        コメント
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="この場所についてのコメントを入力..."
                          className="px-3 py-2 border-2 border-foreground bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full py-3 font-bold tracking-wide bg-primary text-primary-foreground"
                  disabled={createSpotMutation.isPending}
                >
                  {createSpotMutation.isPending ? "追加中..." : "場所を追加"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Create List Overlay */}
      {showCreateList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateList(false)} />
          <div className="relative bg-white border-2 border-black rounded-3xl p-6 sm:p-8 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black">リスト作成</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateList(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Form {...createListForm}>
              <form onSubmit={createListForm.handleSubmit(onCreateList)} className="space-y-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <FormField
                    control={createListForm.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-[6rem]">
                        <FormControl>
                          <Input
                            placeholder="場所名"
                            className="px-3 py-2 border-2 border-black bg-white rounded-xl text-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <span className="font-bold shrink-0">でおすすめの</span>
                  <FormField
                    control={createListForm.control}
                    name="listName"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-[6rem]">
                        <FormControl>
                          <Input
                            placeholder="ジャンル"
                            className="px-3 py-2 border-2 border-black bg-white rounded-xl text-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-black/80 font-bold tracking-wide rounded-xl"
                >
                  リストを作成
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Edit Spot Overlay */}
      {editingSpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingSpot(null)} />
          <div className="relative bg-background border-2 border-foreground rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">メモを編集</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingSpot(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Form {...editSpotForm}>
              <form onSubmit={editSpotForm.handleSubmit((data) => updateSpotMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={editSpotForm.control}
                  name="placeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center font-bold">
                        <MapPin className="mr-1 h-4 w-4" />
                        場所名
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例：スターバックス コーヒー 渋谷店"
                          className="px-3 py-2 border-2 border-foreground bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editSpotForm.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center font-bold">
                        <MessageCircle className="mr-1 h-4 w-4" />
                        コメント
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="この場所についてのコメントを入力..."
                          className="px-3 py-2 border-2 border-foreground bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editSpotForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center font-bold">
                        <Link2 className="mr-1 h-4 w-4" />
                        URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          className="px-3 py-2 border-2 border-foreground bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full py-3 font-bold tracking-wide bg-primary text-primary-foreground"
                  disabled={updateSpotMutation.isPending}
                >
                  {updateSpotMutation.isPending ? "更新中..." : "更新"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}

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
