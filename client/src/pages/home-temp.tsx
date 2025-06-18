import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSpotSchema, type InsertSpot, type Spot, type User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MapPin, Plus, Trash2, MessageCircle, Calendar, List, Globe, User as UserIcon, LogOut, Settings, Users, ArrowLeft, Star, Heart, Eye } from "lucide-react";
import { Link } from "wouter";

type FormData = {
  placeName: string;
  url: string;
  comment: string;
};

type ListFormData = {
  listName: string;
  region: string;
};

type RecommendationScore = {
  spot: Spot & { user: User };
  score: number;
  reasons: string[];
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Navigation state
  const [currentView, setCurrentView] = useState<"list" | "spots">("list");
  
  // Fetch spots
  const { data: spots = [], isLoading } = useQuery<(Spot & { user: User })[]>({
    queryKey: ["/api/spots"],
  });

  // Fetch personalized recommendations
  const { data: recommendations = [], isLoading: isLoadingRecommendations } = useQuery<RecommendationScore[]>({
    queryKey: ["/api/recommendations"],
    enabled: isAuthenticated,
  });

  // List creation form
  const listForm = useForm<ListFormData>({
    defaultValues: {
      listName: "",
      region: "",
    },
  });

  // Place addition form
  const form = useForm<FormData>({
    resolver: zodResolver(insertSpotSchema.pick({ placeName: true, url: true, comment: true })),
    defaultValues: {
      placeName: "",
      url: "",
      comment: "",
    },
  });

  // Location selection state
  const [selectedCategory, setSelectedCategory] = useState<"japan" | "overseas">("japan");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [currentList, setCurrentList] = useState<{ listName: string; region: string }>({ listName: "", region: "" });

  // Japan prefectures data
  const japanPrefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ];

  // Overseas regions data
  const overseasRegions = [
    "アジア", "ヨーロッパ", "北アメリカ", "南アメリカ", "オセアニア", "アフリカ", "中東"
  ];

  // Create spot mutation
  const createSpotMutation = useMutation({
    mutationFn: async (data: InsertSpot) => {
      return await apiRequest(`/api/spots`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      form.reset();
      toast({
        title: "場所が追加されました",
        description: "新しい場所がリストに追加されました。",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "場所の追加に失敗しました。",
        variant: "destructive",
      });
    },
  });

  // Delete spot mutation
  const deleteSpotMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/spots/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "場所が削除されました",
        description: "場所がリストから削除されました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "場所の削除に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (!currentList.listName || !currentList.region) {
      toast({
        title: "エラー",
        description: "リストを先に作成してください。",
        variant: "destructive",
      });
      return;
    }

    createSpotMutation.mutate({
      ...data,
      listName: currentList.listName,
      region: currentList.region,
    });
  };

  const onListSubmit = (data: ListFormData) => {
    setCurrentList(data);
    setCurrentView("spots");
    toast({
      title: "リストが作成されました",
      description: `${data.listName} (${data.region}) への場所の追加を開始してください。`,
    });
  };

  const handleDelete = (id: number) => {
    deleteSpotMutation.mutate(id);
  };

  const displayName = (user as any)?.username || (user as any)?.firstName || "ユーザー";

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1eee9' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold" style={{ color: '#0294b5' }}>
                あしあと
              </h1>
            </div>
            
            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                        <AvatarFallback style={{ backgroundColor: '#0294b5', color: 'white' }}>
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        プロフィール
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/api/logout">
                        <LogOut className="mr-2 h-4 w-4" />
                        ログアウト
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List Creation and Place Addition - First Column on PC */}
          <div className="lg:col-span-2 lg:order-1 space-y-6">
            {currentView === "list" ? (
              <>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">リスト作成</h3>
                  <Form {...listForm}>
                    <form onSubmit={listForm.handleSubmit(onListSubmit)} className="space-y-4">
                      <FormField
                        control={listForm.control}
                        name="listName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">リスト名</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="例：お気に入りカフェ"
                                className="px-4 py-3 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-slate-700 text-sm font-medium mb-3 block">地域</label>
                          
                          {/* Japan/Overseas Selection Buttons */}
                          <div className="flex gap-3 mb-4">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory("japan");
                                setSelectedLocation("");
                              }}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedCategory === "japan"
                                  ? "text-white"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                              style={selectedCategory === "japan" ? { backgroundColor: '#0294b5' } : {}}
                            >
                              日本
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory("overseas");
                                setSelectedLocation("");
                              }}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedCategory === "overseas"
                                  ? "text-white"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                              style={selectedCategory === "overseas" ? { backgroundColor: '#0294b5' } : {}}
                            >
                              海外
                            </button>
                          </div>

                          {/* Location Selection Grid */}
                          {selectedCategory === "japan" && (
                            <div>
                              <label className="text-slate-700 text-sm font-medium mb-2 block">都道府県</label>
                              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                                {japanPrefectures.map((prefecture) => (
                                  <button
                                    key={prefecture}
                                    type="button"
                                    onClick={() => {
                                      setSelectedLocation(prefecture);
                                      listForm.setValue("region", prefecture);
                                    }}
                                    className={`px-3 py-2 text-sm rounded font-medium transition-colors ${
                                      selectedLocation === prefecture
                                        ? "text-white"
                                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                                    }`}
                                    style={selectedLocation === prefecture ? { backgroundColor: '#0294b5' } : {}}
                                  >
                                    {prefecture}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedCategory === "overseas" && (
                            <div>
                              <label className="text-slate-700 text-sm font-medium mb-2 block">地域</label>
                              <div className="grid grid-cols-2 gap-2">
                                {overseasRegions.map((region) => (
                                  <button
                                    key={region}
                                    type="button"
                                    onClick={() => {
                                      setSelectedLocation(region);
                                      listForm.setValue("region", region);
                                    }}
                                    className={`px-3 py-2 text-sm rounded font-medium transition-colors ${
                                      selectedLocation === region
                                        ? "text-white"
                                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                                    }`}
                                    style={selectedLocation === region ? { backgroundColor: '#0294b5' } : {}}
                                  >
                                    {region}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                        style={{ backgroundColor: '#0294b5' }}
                        onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#026b85'}
                        onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#0294b5'}
                      >
                        <Plus className="mr-2 h-5 w-5" style={{ color: 'white' }} />
                        リストを作成
                      </Button>
                    </form>
                  </Form>
                </div>
                
                {/* Created Lists Section */}
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <List className="mr-2 h-5 w-5" style={{ color: '#0294b5' }} />
                    作成済みリスト一覧
                  </h4>
                  <div className="space-y-2">
                    {spots.length === 0 ? (
                      <p className="text-slate-500 text-sm">まだリストがありません</p>
                    ) : (
                      <>
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
                          <div key={key} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                            <div>
                              <p className="font-medium text-slate-700">{list.listName}</p>
                              <p className="text-sm text-slate-500">{list.region}</p>
                            </div>
                            <span className="text-sm text-slate-500 bg-slate-200 px-2 py-1 rounded">
                              {list.count}件
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                      <Plus className="mr-2 h-5 w-5" style={{ color: '#0294b5' }} />
                      場所を追加
                    </h3>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentView("list")}
                      className="text-sm flex items-center"
                    >
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      リスト作成に戻る
                    </Button>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField
                        control={form.control}
                        name="placeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 flex items-center">
                              <MapPin className="text-slate-400 mr-1 h-4 w-4" />
                              場所名
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="例：スターバックス コーヒー 渋谷店"
                                className="px-4 py-3 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="comment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 flex items-center">
                              <MessageCircle className="text-slate-400 mr-1 h-4 w-4" />
                              コメント
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="この場所についてのコメントを入力..."
                                className="px-4 py-3 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 flex items-center">
                              <Globe className="text-slate-400 mr-1 h-4 w-4" />
                              URL
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="例：https://example.com"
                                className="px-4 py-3 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full text-white py-3 rounded-lg font-semibold transition-colors"
                        style={{ backgroundColor: '#0294b5' }}
                        onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#026b85'}
                        onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#0294b5'}
                        disabled={createSpotMutation.isPending}
                      >
                        {createSpotMutation.isPending ? "追加中..." : "場所を追加"}
                      </Button>
                    </form>
                  </Form>
                </div>

                {/* Places List Section */}
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <MapPin className="mr-2 h-5 w-5" style={{ color: '#0294b5' }} />
                    場所一覧
                  </h4>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : spots.filter(spot => 
                    spot.listName === currentList.listName && 
                    spot.region === currentList.region
                  ).length === 0 ? (
                    <p className="text-slate-500 text-sm">このリストには場所が登録されていません</p>
                  ) : (
                    <div className="space-y-3">
                      {spots.filter(spot => 
                        spot.listName === currentList.listName && 
                        spot.region === currentList.region
                      ).map((spot) => (
                        <div key={spot.id} className="p-3 bg-slate-50 rounded border-l-4" style={{ borderLeftColor: '#0294b5' }}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-slate-800">{spot.placeName || 'タイトルなし'}</h5>
                              <p className="text-sm text-slate-600 mt-1">{spot.comment}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {spot.listName && (
                                  <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
                                    {spot.listName}
                                  </span>
                                )}
                                {spot.region && (
                                  <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
                                    {spot.region}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isAuthenticated && (user as any)?.id === spot.userId && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 ml-2">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>スポットを削除</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      このスポットを削除してもよろしいですか？この操作は取り消せません。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(spot.id)}>
                                      削除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Recommendations and Profile Section - Second Column on PC */}
          <div className="lg:col-span-1 lg:order-2">
            <div className="sticky top-8 space-y-6">
              {/* Personalized Recommendations */}
              {isAuthenticated && (
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <Star className="mr-2 h-5 w-5" style={{ color: '#0294b5' }} />
                      おすすめスポット
                    </h3>
                    
                    {isLoadingRecommendations ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                            <div className="h-2 bg-slate-200 rounded w-full"></div>
                          </div>
                        ))}
                      </div>
                    ) : recommendations.length === 0 ? (
                      <p className="text-slate-500 text-sm">
                        まだおすすめがありません。スポットを閲覧して好みを学習させましょう！
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {recommendations.slice(0, 3).map((rec) => (
                          <div key={rec.spot.id} className="border-l-4 border-blue-500 pl-3">
                            <h4 className="font-medium text-slate-800 text-sm">
                              {rec.spot.placeName || 'スポット'}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {rec.spot.comment}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-1">
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(rec.score * 100)}%マッチ
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button className="p-1 hover:bg-slate-100 rounded">
                                  <Heart className="h-3 w-3 text-slate-400" />
                                </button>
                                <button className="p-1 hover:bg-slate-100 rounded">
                                  <Eye className="h-3 w-3 text-slate-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Profile Section */}
              {isAuthenticated && (
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                        <AvatarFallback style={{ backgroundColor: '#0294b5', color: 'white' }}>
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">{displayName}</h3>
                        <p className="text-sm text-slate-600">
                          {spots.length}件のスポット
                        </p>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-3">
                      <Link href="/profile">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          style={{ borderColor: '#0294b5', color: '#0294b5' }}
                        >
                          <UserIcon className="mr-2 h-4 w-4" />
                          プロフィール設定
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}