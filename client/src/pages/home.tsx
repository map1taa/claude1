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
import { Plus, LogOut, Edit, X, MapPin, MessageCircle, Link2, Share2, UserPlus, Mail } from "lucide-react";
import { useLocation } from "wouter";

// リスト作成で選べるジャンルタグ
const GENRE_TAGS = [
  "喫茶店",
  "居酒屋",
  "ローカルスポット",
  "おしゃれ系",
  "ワイン",
  "ビール",
  "日本酒",
  "ラーメン",
  "昼飲み",
  "隠れ家",
  "センス",
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  // State management
  const [viewingList, setViewingList] = useState<{ ownerId: string; listName: string; region: string } | null>(null);
  const [viewingFriend, setViewingFriend] = useState<{ id: string; name: string } | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [editListData, setEditListData] = useState<{
    title: string;
    items: { id: number | null; placeName: string; url: string; comment: string }[];
  } | null>(null);
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

  // 共有リンク（/share/:ownerId?list=..&region=..）で開かれた場合はそのリストを表示
  useEffect(() => {
    const m = window.location.pathname.match(/^\/share\/([^/]+)/);
    if (m) {
      const q = new URLSearchParams(window.location.search);
      const list = q.get("list");
      const region = q.get("region");
      if (list && region) {
        setViewingList({ ownerId: decodeURIComponent(m[1]), listName: list, region });
      }
    }
  }, []);

  // リスト詳細（共有エンドポイント経由: 自分/友達/共有/未ログインすべて対応）
  const listQueryKey = viewingList
    ? [`/api/share/${viewingList.ownerId}/spots?list=${encodeURIComponent(viewingList.listName)}&region=${encodeURIComponent(viewingList.region)}`]
    : ["list-none"];
  const { data: listData, isLoading: listLoading } = useQuery<{
    owner: { id: string; name: string | null };
    spots: Spot[];
    canEdit: boolean;
    isOwner: boolean;
  }>({ queryKey: listQueryKey, enabled: !!viewingList });
  const listSpots = listData?.spots ?? [];
  const canEditList = listData?.canEdit ?? false;
  const isListOwner = listData?.isOwner ?? false;

  // マイページ用: 友達申請・フレンド・共有リスト
  const { data: friendRequests = [] } = useQuery<User[]>({
    queryKey: ["/api/friends/requests"],
    enabled: isAuthenticated,
  });
  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });
  const { data: sharedLists = [] } = useQuery<{ ownerId: string; listName: string; region: string; ownerName: string | null }[]>({
    queryKey: ["/api/shared-lists"],
    enabled: isAuthenticated,
  });

  // フレンドのリスト一覧
  const { data: friendSpots = [] } = useQuery<Spot[]>({
    queryKey: [`/api/friends/${viewingFriend?.id}/spots`],
    enabled: !!viewingFriend,
  });

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

  // Create spot mutation（共有リストの場合は ownerId を付与）
  const createSpotMutation = useMutation({
    mutationFn: async (data: InsertSpot & { ownerId?: string }): Promise<Spot> => {
      const response = await apiRequest("POST", "/api/spots", data);
      return await response.json() as Spot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
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
    if (!userId) return;
    setShowCreateList(false);
    createListForm.reset();
    setViewingList({ ownerId: userId, listName: data.listName, region: data.region });
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
      queryClient.invalidateQueries();
      setEditingSpot(null);
      toast({ title: "更新しました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const deleteSpotMutation = useMutation({
    mutationFn: async () => {
      if (!editingSpot) return;
      await apiRequest("DELETE", `/api/spots/${editingSpot.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setEditingSpot(null);
      toast({ title: "削除しました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  // リスト全体編集
  const openEditList = () => {
    if (!viewingList) return;
    const items = listSpots
      .map(s => ({ id: s.id as number | null, placeName: s.placeName || "", url: s.url || "", comment: s.comment || "" }));
    setEditListData({
      title: `${viewingList.region}でおすすめの${viewingList.listName}`,
      items,
    });
  };

  const updateEditItem = (idx: number, patch: Partial<{ placeName: string; url: string; comment: string }>) => {
    setEditListData(prev =>
      prev ? { ...prev, items: prev.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) } : prev
    );
  };

  const addEditItem = () => {
    setEditListData(prev =>
      prev ? { ...prev, items: [...prev.items, { id: null, placeName: "", url: "", comment: "" }] } : prev
    );
  };

  const saveListEditsMutation = useMutation({
    mutationFn: async () => {
      if (!editListData || !viewingList) return;

      // 一行タイトル「〇〇でおすすめの△△」を場所・ジャンルに分解
      const sep = "でおすすめの";
      const sepIdx = editListData.title.indexOf(sep);
      if (sepIdx === -1) {
        throw new Error("リスト名は「〇〇でおすすめの△△」の形式で入力してください");
      }
      const newRegion = editListData.title.slice(0, sepIdx).trim();
      const newListName = editListData.title.slice(sepIdx + sep.length).trim();
      if (!newRegion || !newListName) {
        throw new Error("場所名とジャンルを入力してください");
      }

      // 各お店の更新（既存はPUT、追加分は名前があればPOST）
      for (const item of editListData.items) {
        if (item.id !== null) {
          await apiRequest("PUT", `/api/spots/${item.id}`, {
            placeName: item.placeName,
            url: item.url,
            comment: item.comment,
          });
        } else if (item.placeName.trim()) {
          await apiRequest("POST", "/api/spots", {
            placeName: item.placeName,
            url: item.url,
            comment: item.comment,
            listName: viewingList.listName,
            region: viewingList.region,
            ownerId: viewingList.ownerId,
          });
        }
      }

      // リストのタイトル変更はオーナーのみ
      if (isListOwner && (newListName !== viewingList.listName || newRegion !== viewingList.region)) {
        await apiRequest("PATCH", "/api/spots/update-list", {
          oldListName: viewingList.listName,
          newListName,
          oldRegion: viewingList.region,
          newRegion,
        });
      }

      return { newListName, newRegion };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      if (viewingList && result) {
        setViewingList({
          ownerId: viewingList.ownerId,
          listName: isListOwner ? result.newListName : viewingList.listName,
          region: isListOwner ? result.newRegion : viewingList.region,
        });
      }
      setEditListData(null);
      toast({ title: "リストを更新しました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async () => {
      if (!viewingList) return;
      const ids = listSpots.map(s => s.id);
      for (const id of ids) {
        await apiRequest("DELETE", `/api/spots/${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setEditListData(null);
      setViewingList(null);
      toast({ title: "リストを削除しました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  // 共有リンクのコピー
  const copyShareLink = () => {
    if (!viewingList) return;
    const url = `${window.location.origin}/share/${viewingList.ownerId}?list=${encodeURIComponent(viewingList.listName)}&region=${encodeURIComponent(viewingList.region)}`;
    navigator.clipboard.writeText(url).then(
      () => toast({ title: "共有リンクをコピーしました" }),
      () => toast({ title: "コピーに失敗しました", description: url, variant: "destructive" })
    );
  };

  // 友達申請
  const friendRequestMutation = useMutation({
    mutationFn: async (targetId: string) => {
      await apiRequest("POST", "/api/friends/request", { targetId });
    },
    onSuccess: () => toast({ title: "友達申請を送りました" }),
    onError: (error) => toast({ title: "エラー", description: error.message, variant: "destructive" }),
  });

  const acceptFriendMutation = useMutation({
    mutationFn: async (requesterId: string) => {
      await apiRequest("POST", "/api/friends/accept", { requesterId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "承認しました" });
    },
    onError: (error) => toast({ title: "エラー", description: error.message, variant: "destructive" }),
  });

  // 共有メンバー管理（オーナーのみ）
  const [inviteEmail, setInviteEmail] = useState("");
  const membersQueryKey = viewingList
    ? [`/api/list-members?list=${encodeURIComponent(viewingList.listName)}&region=${encodeURIComponent(viewingList.region)}`]
    : ["members-none"];
  const { data: members = [] } = useQuery<{ id: number; email: string }[]>({
    queryKey: membersQueryKey,
    enabled: isListOwner && (showInvite || !!editListData),
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!viewingList) return;
      await apiRequest("POST", "/api/list-members", {
        listName: viewingList.listName,
        region: viewingList.region,
        email: inviteEmail.trim(),
      });
    },
    onSuccess: () => {
      setInviteEmail("");
      queryClient.invalidateQueries();
      toast({ title: "メンバーを追加しました" });
    },
    onError: (error) => toast({ title: "エラー", description: error.message, variant: "destructive" }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await apiRequest("DELETE", `/api/list-members/${memberId}`);
    },
    onSuccess: () => queryClient.invalidateQueries(),
    onError: (error) => toast({ title: "エラー", description: error.message, variant: "destructive" }),
  });

  const displayName = (user as any)?.username || (user as any)?.firstName || "ユーザー";

  return (
    <div className="min-h-screen bg-[#E9BC4F] text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#E9BC4F]">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <button
              onClick={() => { setViewingList(null); setViewingFriend(null); setLocation("/"); }}
              className="cursor-pointer hover:opacity-70 transition-opacity"
            >
              <span className="text-2xl font-black tracking-widest">タビコミ</span>
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
              <div className="relative mb-8">
                <h2 className="text-xl font-black text-center px-16">
                  {viewingList.region}でおすすめの{viewingList.listName}
                </h2>
                {listData?.owner && !isListOwner && (
                  <p className="text-xs text-center text-black/60 mt-1">{listData.owner.name}さんのリスト</p>
                )}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <button
                    onClick={copyShareLink}
                    aria-label="共有リンクをコピー"
                    className="text-black/50 hover:text-black transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  {isListOwner && (
                    <button
                      onClick={() => setShowInvite(true)}
                      aria-label="メンバーを招待"
                      className="text-black/50 hover:text-black transition-colors"
                    >
                      <Mail className="h-5 w-5" />
                    </button>
                  )}
                  {isAuthenticated && !isListOwner && viewingList.ownerId !== userId && (
                    <button
                      onClick={() => friendRequestMutation.mutate(viewingList.ownerId)}
                      aria-label="友達申請"
                      className="text-black/50 hover:text-black transition-colors"
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                  )}
                  {canEditList && (
                    <button
                      onClick={openEditList}
                      aria-label="リストを編集"
                      className="text-black/50 hover:text-black transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Places List Section */}
              <div className="flex-1">
                {listLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse border border-black/20 px-4 py-4">
                        <div className="h-4 bg-muted w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : listSpots.length === 0 ? (
                  <p className="text-sm text-center py-8">このリストには場所が登録されていません</p>
                ) : (
                  <div className="space-y-4">
                    {listSpots.map((spot) => (
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
                        {canEditList && (
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

              {/* 追加ボタン（オレンジの＋、編集権限がある場合のみ） */}
              {canEditList && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setShowAddSpot(true)}
                    aria-label="場所を追加"
                    className="bg-[#E8613C] hover:bg-[#d4552f] transition-colors rounded-xl w-12 h-12 flex items-center justify-center"
                  >
                    <Plus className="h-7 w-7 text-white" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : viewingFriend ? (
          /* フレンドのリスト一覧 */
          <div>
            <div className="relative mb-10">
              <h2 className="text-center font-bold">{viewingFriend.name}さんのリスト</h2>
              <button
                onClick={() => setViewingFriend(null)}
                aria-label="戻る"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-black/50 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {(() => {
              const grouped = friendSpots.reduce((acc, spot) => {
                if (!acc[spot.region]) acc[spot.region] = [];
                if (!acc[spot.region].includes(spot.listName)) {
                  acc[spot.region].push(spot.listName);
                }
                return acc;
              }, {} as Record<string, string[]>);
              const regions = Object.keys(grouped);
              return regions.length === 0 ? (
                <p className="text-center py-16 font-bold">まだリストがありません</p>
              ) : (
                <div className="space-y-10">
                  {regions.map((region) => (
                    <div key={region}>
                      <h3 className="text-[#3D3BF3] font-black text-lg mb-4">【{region}】</h3>
                      <div className="space-y-4">
                        {grouped[region].map((listName) => (
                          <button
                            key={listName}
                            onClick={() => setViewingList({ ownerId: viewingFriend.id, listName, region })}
                            className="block bg-white border-2 border-black rounded-2xl px-8 py-4 font-bold text-lg w-full sm:w-72 text-center hover:opacity-90 transition-opacity"
                          >
                            {listName}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          <>
            {isAuthenticated ? (
              /* マイページ: 場所ごとにリストをグルーピング表示 */
              <div>
                <h2 className="text-center font-bold mb-10">マイリスト</h2>
                {(() => {
                  const grouped = spots.reduce((acc, spot) => {
                    if (!acc[spot.region]) acc[spot.region] = [];
                    if (!acc[spot.region].includes(spot.listName)) {
                      acc[spot.region].push(spot.listName);
                    }
                    return acc;
                  }, {} as Record<string, string[]>);
                  const regions = Object.keys(grouped);
                  return isLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-white/60 rounded-2xl w-full sm:w-72 h-16"></div>
                      ))}
                    </div>
                  ) : regions.length === 0 ? (
                    <p className="text-center py-16 font-bold">まだリストがありません</p>
                  ) : (
                    <div className="space-y-10">
                      {regions.map((region) => (
                        <div key={region}>
                          <h3 className="text-[#3D3BF3] font-black text-lg mb-4">【{region}】</h3>
                          <div className="space-y-4">
                            {grouped[region].map((listName) => (
                              <button
                                key={listName}
                                onClick={() => setViewingList({ ownerId: userId, listName, region })}
                                className="block bg-white border-2 border-black rounded-2xl px-8 py-4 font-bold text-lg w-full sm:w-72 text-center hover:opacity-90 transition-opacity"
                              >
                                {listName}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* 共有リスト（招待されたリスト） */}
                {sharedLists.length > 0 && (
                  <div className="mt-12">
                    <h3 className="text-[#3D3BF3] font-black text-lg mb-4">【共有】</h3>
                    <div className="space-y-4">
                      {sharedLists.map((sl) => (
                        <button
                          key={`${sl.ownerId}-${sl.listName}-${sl.region}`}
                          onClick={() => setViewingList({ ownerId: sl.ownerId, listName: sl.listName, region: sl.region })}
                          className="block bg-white border-2 border-black rounded-2xl px-8 py-4 font-bold text-lg w-full sm:w-72 text-center hover:opacity-90 transition-opacity"
                        >
                          {sl.region}✕{sl.listName}
                          <span className="block text-xs font-normal text-black/60">{sl.ownerName}さんと共有</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 友達申請（承認待ち） */}
                {friendRequests.length > 0 && (
                  <div className="mt-12">
                    <h3 className="text-[#3D3BF3] font-black text-lg mb-4">友達申請</h3>
                    <div className="space-y-3">
                      {friendRequests.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-3 bg-white border-2 border-black rounded-2xl px-5 py-3 w-full sm:w-96"
                        >
                          <span className="font-bold truncate">{(r as any).username || (r as any).email}</span>
                          <Button
                            size="sm"
                            onClick={() => acceptFriendMutation.mutate(r.id)}
                            className="bg-black text-white hover:bg-black/80 rounded-xl shrink-0"
                            disabled={acceptFriendMutation.isPending}
                          >
                            承認
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* フレンド */}
                {friends.length > 0 && (
                  <div className="mt-12">
                    <h3 className="text-[#3D3BF3] font-black text-lg mb-4">フレンド</h3>
                    <div className="space-y-3">
                      {friends.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setViewingFriend({ id: f.id, name: (f as any).username || (f as any).email || "友達" })}
                          className="block bg-white border-2 border-black rounded-2xl px-8 py-3 font-bold w-full sm:w-72 text-center hover:opacity-90 transition-opacity"
                        >
                          {(f as any).username || (f as any).email}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* リスト作成（オレンジの＋） */}
                <div className="flex justify-center mt-16 pb-10">
                  <button
                    onClick={() => setShowCreateList(true)}
                    aria-label="リスト作成"
                    className="bg-[#E8613C] hover:bg-[#d4552f] transition-colors rounded-xl w-12 h-12 flex items-center justify-center"
                  >
                    <Plus className="h-7 w-7 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              /* 未ログイン: 公開リストのカードグリッド */
              <div>
                {(() => {
                  const allLists = Object.values(
                    spots.reduce((acc, spot) => {
                      const key = `${spot.userId}-${spot.listName}-${spot.region}`;
                      if (!acc[key]) {
                        acc[key] = { ownerId: spot.userId, listName: spot.listName, region: spot.region, places: [] as string[] };
                      }
                      acc[key].places.push(spot.placeName || "タイトルなし");
                      return acc;
                    }, {} as Record<string, { ownerId: string; listName: string; region: string; places: string[] }>)
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
                          key={`${list.ownerId}-${list.listName}-${list.region}`}
                          onClick={() => setViewingList({ ownerId: list.ownerId, listName: list.listName, region: list.region })}
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

                {/* リスト作成（ログイン画面へ） */}
                <div className="flex justify-center mt-16 pb-10">
                  <button
                    onClick={() => setLocation("/auth")}
                    className="bg-[#E8613C] hover:bg-[#d4552f] text-white text-lg font-bold px-10 py-3 rounded-xl transition-colors"
                  >
                    リスト作成
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Spot Overlay */}
      {showAddSpot && viewingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddSpot(false)} />
          <div className="relative bg-white border-2 border-black rounded-3xl p-6 sm:p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
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
                  ownerId: viewingList.ownerId,
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
                            className="px-3 py-2 border-2 border-black bg-white rounded-xl"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
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
                          className="px-3 py-2 border-2 border-black bg-white rounded-xl"
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
                          className="px-3 py-2 border-2 border-black bg-white rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full py-3 font-bold tracking-wide bg-black text-white hover:bg-black/80 rounded-xl"
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
                <div className="flex items-center gap-2">
                  <FormField
                    control={createListForm.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem className="flex-1">
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
                </div>

                {/* ジャンルタグ */}
                <div className="flex flex-wrap gap-2">
                  {GENRE_TAGS.map((tag) => {
                    const selected = createListForm.watch("listName") === tag;
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() =>
                          createListForm.setValue("listName", selected ? "" : tag, { shouldValidate: true })
                        }
                        className={`px-4 py-2 rounded-full border-2 border-black font-bold text-sm transition-colors ${
                          selected ? "bg-black text-white" : "bg-white text-black hover:bg-black/5"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {/* 自由入力 */}
                <FormField
                  control={createListForm.control}
                  name="listName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="その他（自由入力）"
                          className="px-3 py-2 border-2 border-black bg-white rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

      {/* Edit List Overlay（リスト全体の一括編集） */}
      {editListData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditListData(null)} />
          <div className="relative bg-white border-[6px] border-[#7EB5E8] rounded-3xl p-6 sm:p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditListData(null)}
              aria-label="閉じる"
              className="absolute right-5 top-5 text-black/60 hover:text-black transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* リスト名（一行で編集、変更はオーナーのみ） */}
            <Input
              value={editListData.title}
              onChange={(e) => setEditListData({ ...editListData, title: e.target.value })}
              placeholder="〇〇でおすすめの△△"
              disabled={!isListOwner}
              className="mb-8 px-1 py-2 border-0 border-b-2 border-dashed border-black/60 bg-transparent rounded-none text-xl font-black text-center focus-visible:ring-0 focus-visible:border-black"
            />

            {/* 各お店（店名・URL・コメントのラベル付き） */}
            <div className="space-y-6 mb-6">
              {editListData.items.map((item, idx) => (
                <div key={item.id ?? `new-${idx}`} className="space-y-3">
                  <div className="flex items-center gap-1">
                    <span className="font-bold shrink-0">店名：</span>
                    <Input
                      value={item.placeName}
                      onChange={(e) => updateEditItem(idx, { placeName: e.target.value })}
                      className="flex-1 px-1 py-1 border-0 border-b-2 border-dashed border-black/60 bg-transparent rounded-none focus-visible:ring-0 focus-visible:border-black"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold shrink-0">URL：</span>
                    <Input
                      value={item.url}
                      onChange={(e) => updateEditItem(idx, { url: e.target.value })}
                      autoComplete="off"
                      className="flex-1 px-1 py-1 border-0 border-b-2 border-dashed border-black/60 bg-transparent rounded-none focus-visible:ring-0 focus-visible:border-black"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold shrink-0">コメント：</span>
                    <Input
                      value={item.comment}
                      onChange={(e) => updateEditItem(idx, { comment: e.target.value })}
                      className="flex-1 px-1 py-1 border-0 border-b-2 border-dashed border-black/60 bg-transparent rounded-none focus-visible:ring-0 focus-visible:border-black"
                    />
                  </div>
                </div>
              ))}
              {editListData.items.length === 0 && (
                <p className="text-sm text-center py-4">このリストにはまだ場所がありません</p>
              )}
            </div>

            {/* 場所追加（黄色いピル） */}
            <div className="flex justify-center mb-8">
              <button
                type="button"
                onClick={addEditItem}
                className="bg-[#E9C46A] hover:bg-[#e0b552] transition-colors rounded-full px-10 py-3 font-bold flex items-center gap-1"
              >
                <Plus className="h-5 w-5" />
                場所を追加
              </button>
            </div>

            <Button
              onClick={() => saveListEditsMutation.mutate()}
              className="w-full py-3 font-bold tracking-wide bg-black text-white hover:bg-black/80 rounded-xl"
              disabled={saveListEditsMutation.isPending}
            >
              {saveListEditsMutation.isPending ? "保存中..." : "保存"}
            </Button>

            {/* リスト削除（オーナーのみ） */}
            {isListOwner && (
              <div className="mt-8 pt-6 border-t border-black/20">
                <Button
                  onClick={() => {
                    if (window.confirm("このリストを削除しますか？中の場所もすべて削除されます。")) {
                      deleteListMutation.mutate();
                    }
                  }}
                  className="w-full py-3 font-bold tracking-wide bg-[#D64541] text-white hover:bg-[#b93b38] rounded-xl"
                  disabled={deleteListMutation.isPending}
                >
                  {deleteListMutation.isPending ? "削除中..." : "リストを削除"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite Overlay（メンバー招待・独立） */}
      {showInvite && isListOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowInvite(false)} />
          <div className="relative bg-white border-2 border-black rounded-3xl p-6 sm:p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black">メンバーを招待</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowInvite(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-black/60 mb-4">
              招待したメールアドレスでログインした人が、このリストを一緒に編集できます。
            </p>
            <div className="flex gap-2 mb-4">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="メールアドレスで招待"
                autoComplete="off"
                className="flex-1 px-3 py-2 border-2 border-black bg-white rounded-xl"
              />
              <Button
                type="button"
                onClick={() => inviteEmail.trim() && addMemberMutation.mutate()}
                className="bg-black text-white hover:bg-black/80 rounded-xl px-5 shrink-0"
                disabled={addMemberMutation.isPending}
              >
                招待
              </Button>
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-center text-black/60 py-4">まだメンバーがいません</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 border border-black rounded-xl px-3 py-2">
                    <span className="text-sm truncate">{m.email}</span>
                    <button
                      onClick={() => removeMemberMutation.mutate(m.id)}
                      aria-label="メンバーを削除"
                      className="shrink-0 text-black/50 hover:text-black transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Spot Overlay */}
      {editingSpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingSpot(null)} />
          <div className="relative bg-white border-2 border-black rounded-3xl p-6 sm:p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
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
                          className="px-3 py-2 border-2 border-black bg-white rounded-xl"
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
                          className="px-3 py-2 border-2 border-black bg-white rounded-xl"
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
                          className="px-3 py-2 border-2 border-black bg-white rounded-xl"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 py-3 font-bold tracking-wide bg-black text-white hover:bg-black/80 rounded-xl"
                    disabled={updateSpotMutation.isPending}
                  >
                    {updateSpotMutation.isPending ? "更新中..." : "更新"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (window.confirm("このメモを削除しますか？")) {
                        deleteSpotMutation.mutate();
                      }
                    }}
                    className="py-3 px-6 font-bold tracking-wide bg-[#D64541] text-white hover:bg-[#b93b38] rounded-xl"
                    disabled={deleteSpotMutation.isPending}
                  >
                    {deleteSpotMutation.isPending ? "削除中..." : "削除"}
                  </Button>
                </div>
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
