import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, insertSpotSchema, type Spot, type User, type UpdateProfile, type InsertSpot } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, LogOut, Edit, X, Home as HomeIcon, MapPin, MessageCircle, Link2 } from "lucide-react";
import { Link } from "wouter";
import JapanMap from "@/components/JapanMap";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  // State management
  const [viewingList, setViewingList] = useState<{ listName: string; region: string } | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ["/api/spots"] });
      spotForm.reset();
      setShowAddSpot(false);
      toast({ title: "場所が追加されました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const displayName = (user as any)?.username || (user as any)?.firstName || "ユーザー";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <button
              onClick={() => { setViewingList(null); setSelectedPrefecture(null); }}
              className="cursor-pointer hover:opacity-70 transition-opacity"
            >
              <HomeIcon className="h-6 w-6" />
            </button>

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
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold">
                  {viewingList.listName}
                </h2>
                <p className="text-sm text-muted-foreground">{viewingList.region}</p>
              </div>

              {/* Places List Section */}
              <div>
                <div>
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
                  onClick={() => setShowAddSpot(true)}
                  className="bg-primary text-primary-foreground px-8"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  場所を追加
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Profile Section */}
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

            {/* 日本地図 */}
            {selectedPrefecture ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{selectedPrefecture}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPrefecture(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    戻る
                  </Button>
                </div>
                {(() => {
                  const prefLists = Object.entries(
                    spots
                      .filter(spot => spot.region === selectedPrefecture)
                      .reduce((acc, spot) => {
                        const key = `${spot.listName}-${spot.region}`;
                        if (!acc[key]) {
                          acc[key] = { listName: spot.listName, region: spot.region, count: 0 };
                        }
                        acc[key].count++;
                        return acc;
                      }, {} as Record<string, { listName: string; region: string; count: number }>)
                  );
                  return prefLists.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm mb-4">この地域にはまだリストがありません</p>
                      <Button asChild size="lg" className="bg-primary text-primary-foreground px-8">
                        <Link href="/create-list">
                          <Plus className="mr-2 h-5 w-5" />
                          リスト作成
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prefLists.map(([key, list]) => (
                        <button
                          key={key}
                          onClick={() => setViewingList({ listName: list.listName, region: list.region })}
                          className="w-full border-2 border-foreground rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <h3 className="text-lg font-bold">{list.listName}</h3>
                          <p className="text-sm text-muted-foreground">{list.count}件</p>
                        </button>
                      ))}
                      <div className="flex justify-center pt-4">
                        <Button asChild size="lg" className="bg-primary text-primary-foreground px-8">
                          <Link href="/create-list">
                            <Plus className="mr-2 h-5 w-5" />
                            リスト作成
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div>
                <JapanMap
                  spots={spots}
                  onPrefectureClick={(pref) => setSelectedPrefecture(pref)}
                />

                {/* リスト作成ボタン */}
                {isAuthenticated && (
                  <div className="flex justify-center mt-8">
                    <Button asChild size="lg" className="bg-primary text-primary-foreground px-8">
                      <Link href="/create-list">
                        <Plus className="mr-2 h-5 w-5" />
                        リスト作成
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
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
