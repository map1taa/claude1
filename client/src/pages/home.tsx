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

  // Fetch recommendations
  const { data: recommendations = [], isLoading: isLoadingRecommendations } = useQuery<RecommendationScore[]>({
    queryKey: ["/api/recommendations"],
    enabled: isAuthenticated,
  });

  // Form setup for spot creation
  const form = useForm<FormData>({
    resolver: zodResolver(insertSpotSchema.pick({ placeName: true, url: true, comment: true })),
    defaultValues: {
      placeName: "",
      url: "",
      comment: "",
    },
  });

  // Form setup for list creation
  const listForm = useForm<ListFormData>({
    defaultValues: {
      listName: "",
      region: "",
    },
  });

  // Current list state
  const [currentList, setCurrentList] = useState<ListFormData>({
    listName: "あしあとリスト",
    region: "全国",
  });

  // Region selection state
  const [selectedCategory, setSelectedCategory] = useState<"japan" | "overseas" | "">("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  // Japan prefectures data
  const japanPrefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県",
    "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
    "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県",
    "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ];

  // Overseas countries data (50音順)
  const overseasCountries = [
    "アメリカ", "アルゼンチン", "イギリス", "イタリア", "インド", "インドネシア", "ウクライナ", "エジプト", "オーストラリア", "オーストリア", "オランダ",
    "カナダ", "韓国", "ギリシャ", "シンガポール", "スイス", "スペイン", "タイ", "台湾", "チェコ", "中国", "ドイツ", "トルコ",
    "ニュージーランド", "ノルウェー", "ハンガリー", "フィリピン", "フィンランド", "ブラジル", "フランス", "ベトナム", "ベルギー", "ポーランド", "香港",
    "マレーシア", "南アフリカ", "メキシコ", "ロシア", "その他"
  ];

  // Create spot mutation
  const createSpotMutation = useMutation({
    mutationFn: async (data: InsertSpot) => {
      await apiRequest("POST", "/api/spots", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spots"] });
      toast({
        title: "場所が追加されました",
        description: `「${currentList.listName}」に場所を追加しました。続けて他の場所も追加できます。`,
      });
      form.reset();
    },
    onError: () => {
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
      await apiRequest("DELETE", `/api/spots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spots"] });
      toast({
        title: "スポットが削除されました",
        description: "スポットが正常に削除されました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "スポットの削除に失敗しました。",
        variant: "destructive",
      });
    },
  });

  // Record interaction mutation
  const recordInteractionMutation = useMutation({
    mutationFn: async ({ spotId, interactionType }: { spotId: number; interactionType: string }) => {
      await apiRequest("POST", "/api/interactions", { spotId, interactionType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
    },
  });

  const onSubmit = (data: FormData) => {
    const spotData = {
      ...data,
      listName: currentList.listName,
      region: currentList.region,
    };
    createSpotMutation.mutate(spotData as InsertSpot);
  };

  const onListSubmit = (data: ListFormData) => {
    setCurrentList(data);
    setCurrentView("spots"); // Navigate to spot addition view
    listForm.reset();
    toast({
      title: "リストを作成しました",
      description: `「${data.listName}」に場所を追加できます`,
    });
  };

  const handleDelete = (id: number) => {
    deleteSpotMutation.mutate(id);
  };

  const handleInteraction = (spotId: number, interactionType: string) => {
    recordInteractionMutation.mutate({ spotId, interactionType });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1eee9' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                  <svg className="mr-3 h-8 w-8" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#0294b5' }}>
                    {/* Main paw pad */}
                    <ellipse cx="12" cy="16" rx="4" ry="3.5" />
                    {/* Top left toe */}
                    <ellipse cx="8" cy="8" rx="1.5" ry="2.5" transform="rotate(-20 8 8)" />
                    {/* Top center toe */}
                    <ellipse cx="12" cy="6" rx="1.5" ry="2.5" />
                    {/* Top right toe */}
                    <ellipse cx="16" cy="8" rx="1.5" ry="2.5" transform="rotate(20 16 8)" />
                    {/* Middle toe */}
                    <ellipse cx="14" cy="4" rx="1.2" ry="2" transform="rotate(10 14 4)" />
                  </svg>
                  あしあと
                </h1>
                <p className="text-slate-600 mt-1">お気に入りの場所を記録しよう</p>
                
                {/* Navigation Buttons */}
                <div className="grid grid-cols-3 mt-4 w-full">
                  <button 
                    className="text-slate-600 hover:text-slate-800 font-medium transition-colors cursor-pointer text-center py-2"
                    onClick={() => setCurrentView("list")}
                  >
                    リスト作成
                  </button>
                  <button 
                    className="text-slate-600 hover:text-slate-800 font-medium transition-colors cursor-pointer text-center py-2"
                  >
                    リスト一覧
                  </button>
                  <Link href="/profile" className="text-slate-600 hover:text-slate-800 font-medium transition-colors text-center block py-2">
                    プロフィール
                  </Link>
                </div>
              </div>
            </div>

            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(user as any)?.profileImageUrl || ""} alt={(user as any)?.firstName || ""} />
                        <AvatarFallback>
                          {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <Settings className="mr-2 h-4 w-4" />
                        プロフィール設定
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
                                <label className="text-slate-700 text-sm font-medium mb-2 block">国・地域</label>
                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                                  {overseasCountries.map((country) => (
                                    <button
                                      key={country}
                                      type="button"
                                      onClick={() => {
                                        setSelectedLocation(country);
                                        listForm.setValue("region", country);
                                      }}
                                      className={`px-3 py-2 text-sm rounded font-medium transition-colors ${
                                        selectedLocation === country
                                          ? "text-white"
                                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                                      }`}
                                      style={selectedLocation === country ? { backgroundColor: '#0294b5' } : {}}
                                    >
                                      {country}
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
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  スコア: {rec.score}
                                </span>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleInteraction(rec.spot.id, 'view')}
                                  className="h-6 w-6 p-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleInteraction(rec.spot.id, 'like')}
                                  className="h-6 w-6 p-0"
                                >
                                  <Heart className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {rec.reasons.length > 0 && (
                              <p className="text-xs text-slate-500 mt-1">
                                理由: {rec.reasons[0]}
                              </p>
                            )}
                          </div>
                        ))}
                        {recommendations.length > 3 && (
                          <p className="text-xs text-slate-500 text-center mt-2">
                            他 {recommendations.length - 3} 件のおすすめ
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* User Profile Section */}
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <Users className="mr-2 h-5 w-5" style={{ color: '#0294b5' }} />
                    ユーザー
                  </h3>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}