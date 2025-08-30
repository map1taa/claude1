import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSpotSchema, type InsertSpot, type Spot, type User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Plus, Trash2, MessageCircle, List, User as UserIcon, LogOut, ArrowLeft, Edit2, Link2 } from "lucide-react";
import { Link } from "wouter";

type FormData = {
  placeName: string;
  url: string;
  comment: string;
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [viewingList, setViewingList] = useState<{ listName: string; region: string } | null>(null);
  const [editingList, setEditingList] = useState<{ listName: string; region: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Fetch spots
  const { data: spots = [], isLoading } = useQuery<(Spot & { user: User })[]>({
    queryKey: ["/api/spots"],
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

  // Edit list form
  const editForm = useForm<{ listName: string }>({
    defaultValues: {
      listName: "",
    },
  });

  // URL extraction mutation
  const extractUrlMutation = useMutation({
    mutationFn: async (url: string): Promise<{ storeName?: string; prefecture?: string }> => {
      const response = await apiRequest("POST", "/api/extract-url", { url });
      return await response.json() as { storeName?: string; prefecture?: string };
    },
    onSuccess: (data: { storeName?: string; prefecture?: string }) => {
      if (data.storeName && data.storeName.trim()) {
        form.setValue("placeName", data.storeName.trim());
      }
    },
  });

  // Handle URL change for auto-extraction
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
      form.reset();
      toast({
        title: "場所が追加されました",
        description: "新しい場所がリストに追加されました。",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete spot mutation
  const deleteSpotMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiRequest("DELETE", `/api/spots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spots"] });
      toast({
        title: "場所が削除されました",
        description: "選択した場所がリストから削除されました。",
      });
    },
  });

  // Edit list mutation
  const editListMutation = useMutation({
    mutationFn: async (data: { oldListName: string; newListName: string; region: string }): Promise<void> => {
      await apiRequest("PUT", "/api/spots/list", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spots"] });
      setIsEditDialogOpen(false);
      setEditingList(null);
      toast({
        title: "リスト名が更新されました",
        description: "リスト名が正常に変更されました。",
      });
    },
  });

  // Handle spot submission
  const onSpotSubmit = (data: FormData) => {
    if (!viewingList) {
      toast({
        title: "エラー",
        description: "リストを選択してください。",
        variant: "destructive",
      });
      return;
    }

    const spotData = {
      ...data,
      listName: viewingList.listName,
      region: viewingList.region,
    };
    
    createSpotMutation.mutate(spotData);
  };

  // Handle list editing
  const handleEditList = (listName: string, region: string) => {
    setEditingList({ listName, region });
    editForm.setValue("listName", listName);
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = (data: { listName: string }) => {
    if (!editingList) return;
    
    editListMutation.mutate({
      oldListName: editingList.listName,
      newListName: data.listName,
      region: editingList.region,
    });
  };

  const handleDelete = (id: number) => {
    deleteSpotMutation.mutate(id);
  };

  // Check for new list from create-list page and automatically view it
  useEffect(() => {
    const newListData = sessionStorage.getItem('newListToView');
    if (newListData) {
      const listData = JSON.parse(newListData);
      sessionStorage.removeItem('newListToView');
      
      // Automatically select this list for viewing
      setViewingList({ listName: listData.listName, region: listData.region });
      
      toast({
        title: "リストが作成されました",
        description: `${listData.listName} (${listData.region}) への場所の追加を開始してください。`,
      });
    }
  }, [toast]);

  const displayName = (user as any)?.username || (user as any)?.firstName || "ユーザー";

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1eee9' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 
                  className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: '#4FAEC0' }}
                >
                  あしあと
                </h1>
              </Link>
            </div>
            
            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                <Button asChild
                  size="default"
                  style={{ backgroundColor: '#4FAEC0', color: 'white' }}
                  className="hover:opacity-90"
                >
                  <Link href="/create-list">
                    <Plus className="h-4 w-4 mr-2" />
                    リスト作成
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                        <AvatarFallback style={{ backgroundColor: '#4FAEC0', color: 'white' }}>
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
          {/* Main Content Area */}
          <div className="lg:col-span-2 lg:order-1 space-y-6">
            {viewingList ? (
              <>
                {/* Viewing specific list */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <Button
                      variant="outline"
                      onClick={() => setViewingList(null)}
                      className="flex items-center text-sm"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      リスト一覧に戻る
                    </Button>
                    <div className="text-right">
                      <h2 className="text-xl font-bold text-slate-800">
                        {viewingList.listName}
                      </h2>
                      <p className="text-sm text-slate-600">{viewingList.region}</p>
                    </div>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSpotSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 flex items-center">
                              <Link2 className="text-slate-400 mr-1 h-4 w-4" />
                              URL <span className="text-xs text-slate-500 ml-2">(場所の情報を自動入力)</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="https://example.com または食べログ、ぐるなび、ホットペッパー、Google MapsのURL"
                                  className="px-4 py-3 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleUrlChange(e.target.value);
                                  }}
                                />
                                {extractUrlMutation.isPending && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="placeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 flex items-center">
                              <MapPin className="text-slate-400 mr-1 h-4 w-4" />
                              場所名 {extractUrlMutation.isSuccess && <span className="text-sm text-green-600 ml-2">✓ URLから自動入力</span>}
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
                      
                      <Button 
                        type="submit" 
                        className="w-full text-white py-3 rounded-lg font-semibold transition-colors"
                        style={{ backgroundColor: '#4FAEC0' }}
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
                    <MapPin className="mr-2 h-5 w-5" style={{ color: '#4FAEC0' }} />
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
                    spot.listName === viewingList.listName && 
                    spot.region === viewingList.region
                  ).length === 0 ? (
                    <p className="text-slate-500 text-sm">このリストには場所が登録されていません</p>
                  ) : (
                    <div className="space-y-3">
                      {spots.filter(spot => 
                        spot.listName === viewingList.listName && 
                        spot.region === viewingList.region
                      ).map((spot) => (
                        <div key={spot.id} className="p-3 bg-slate-50 rounded border-l-4" style={{ borderLeftColor: '#4FAEC0' }}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-slate-800">{spot.placeName || 'タイトルなし'}</h5>
                              <p className="text-sm text-slate-600 mt-1">{spot.comment}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {spot.url && (
                                  <a 
                                    href={spot.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    URL
                                  </a>
                                )}
                              </div>
                            </div>
                            {(user as any)?.id === spot.userId && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
            ) : (
              <>
                {/* リスト一覧の表示 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-slate-800 flex items-center">
                      <List className="mr-2 h-5 w-5" style={{ color: '#4FAEC0' }} />
                      作成済みリスト一覧
                    </h4>
                    <Button asChild
                      variant="outline"
                      size="sm"
                      className="flex items-center text-sm"
                      style={{ borderColor: '#4FAEC0', color: '#4FAEC0' }}
                    >
                      <Link href="/create-list">
                        <Plus className="mr-1 h-4 w-4" />
                        追加
                      </Link>
                    </Button>
                  </div>
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
                          <div key={key} className="w-full flex items-center p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors">
                            <button
                              onClick={() => {
                                setViewingList({ listName: list.listName, region: list.region });
                              }}
                              className="flex-1 flex justify-between items-center text-left"
                            >
                              <div>
                                <p className="font-medium text-slate-700">{list.listName}</p>
                                <p className="text-sm text-slate-500">{list.region}</p>
                              </div>
                              <span className="text-sm text-slate-500 bg-slate-200 px-2 py-1 rounded">
                                {list.count}件
                              </span>
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditList(list.listName, list.region)}
                              className="ml-2"
                              style={{ color: '#4FAEC0' }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Section */}
          <div className="lg:col-span-1 lg:order-2">
            <div className="sticky top-8 space-y-6">
              {isAuthenticated && (
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                      <AvatarFallback style={{ backgroundColor: '#4FAEC0', color: 'white' }}>
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
                        style={{ borderColor: '#4FAEC0', color: '#4FAEC0' }}
                      >
                        <UserIcon className="mr-2 h-4 w-4" />
                        プロフィール設定
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit List Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>リスト名を編集</DialogTitle>
            <DialogDescription>
              リスト名を変更してください。
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="listName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>リスト名</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="新しいリスト名を入力..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  style={{ backgroundColor: '#4FAEC0', color: 'white' }}
                  disabled={editListMutation.isPending}
                >
                  {editListMutation.isPending ? "更新中..." : "更新"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}