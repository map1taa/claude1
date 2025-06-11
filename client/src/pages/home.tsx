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
import { MapPin, Plus, Trash2, MessageCircle, Calendar, List, Globe, User as UserIcon, LogOut, Settings, Users, ArrowLeft } from "lucide-react";
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

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Navigation state
  const [currentView, setCurrentView] = useState<"list" | "spots">("list");
  
  // Fetch spots
  const { data: spots = [], isLoading } = useQuery<(Spot & { user: User })[]>({
    queryKey: ["/api/spots"],
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

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                  <svg className="mr-3 h-8 w-8" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#3e80a8' }}>
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
                <div className="flex space-x-3 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center"
                    style={{ borderColor: '#3e80a8', color: '#3e80a8' }}
                    onClick={() => setCurrentView("list")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    リスト作成
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center"
                    style={{ borderColor: '#3e80a8', color: '#3e80a8' }}
                  >
                    <List className="mr-2 h-4 w-4" />
                    リスト一覧
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center"
                    style={{ borderColor: '#3e80a8', color: '#3e80a8' }}
                    asChild
                  >
                    <Link href="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      プロフィール
                    </Link>
                  </Button>
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
                <Card className="shadow-lg" style={{ border: '1.5mm solid #3e80a8' }}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">リスト作成</h3>
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
                        
                        <FormField
                          control={listForm.control}
                          name="region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700">地域</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="px-4 py-3 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <SelectValue placeholder="地域を選択" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="全国">全国</SelectItem>
                                  <SelectItem value="北海道">北海道</SelectItem>
                                  <SelectItem value="東北">東北</SelectItem>
                                  <SelectItem value="関東">関東</SelectItem>
                                  <SelectItem value="中部">中部</SelectItem>
                                  <SelectItem value="関西">関西</SelectItem>
                                  <SelectItem value="中国">中国</SelectItem>
                                  <SelectItem value="四国">四国</SelectItem>
                                  <SelectItem value="九州">九州</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full text-white py-3 rounded-lg font-semibold transition-colors"
                          style={{ backgroundColor: '#3e80a8' }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2d5d7b'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#3e80a8'}
                        >
                          リストを作成
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                
                {/* Created Lists Section */}
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <List className="mr-2 h-5 w-5" style={{ color: '#3e80a8' }} />
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
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="shadow-lg" style={{ border: '1.5mm solid #3e80a8' }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                        <Plus className="mr-2 h-5 w-5" style={{ color: '#3e80a8' }} />
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
                          style={{ backgroundColor: '#3e80a8' }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2d5d7b'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#3e80a8'}
                          disabled={createSpotMutation.isPending}
                        >
                          {createSpotMutation.isPending ? "追加中..." : "場所を追加"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

              </>
            )}
          </div>



          {/* Profile Section - Second Column on PC */}
          <div className="lg:col-span-1 lg:order-2">
            <div className="sticky top-8">
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <Users className="mr-2 h-5 w-5" style={{ color: '#3e80a8' }} />
                    ユーザー
                  </h3>
                  <div className="space-y-3">
                    <Link href="/profile">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        style={{ borderColor: '#3e80a8', color: '#3e80a8' }}
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