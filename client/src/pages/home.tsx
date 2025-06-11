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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MapPin, Plus, Trash2, MessageCircle, Calendar, List, Globe, User as UserIcon, LogOut, Settings, Users } from "lucide-react";
import { Link } from "wouter";

type FormData = {
  placeName: string;
  url: string;
  comment: string;
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Fetch spots
  const { data: spots = [], isLoading } = useQuery<(Spot & { user: User })[]>({
    queryKey: ["/api/spots"],
  });

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(insertSpotSchema),
    defaultValues: {
      placeName: "",
      url: "",
      comment: "",
    },
  });

  // Create spot mutation
  const createSpotMutation = useMutation({
    mutationFn: async (data: InsertSpot) => {
      await apiRequest("POST", "/api/spots", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spots"] });
      toast({
        title: "スポットが追加されました",
        description: "新しいスポットが正常に追加されました！",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "スポットの追加に失敗しました。",
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
    createSpotMutation.mutate(data as InsertSpot);
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
              <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                <MapPin className="text-blue-600 mr-3 h-8 w-8" />
                あしあと
              </h1>
              <p className="text-slate-600 mt-2">
                あなたのお気に入りのスポットを記録・共有しましょう
              </p>
              
              {/* Navigation Buttons */}
              {isAuthenticated && (
                <div className="flex items-center space-x-4 mt-4">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      プロフィール
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/following">
                      <Users className="mr-2 h-4 w-4" />
                      フォロー中
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/my-lists">
                      <List className="mr-2 h-4 w-4" />
                      マイリスト
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            
            {!isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Button asChild>
                  <a href="/api/login">ログイン</a>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                        <AvatarFallback>
                          {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Add Spot Form */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                  <Plus className="text-blue-600 mr-2 h-5 w-5" />
                  リストを追加
                </h2>

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
                              placeholder="例：https://..."
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
                              placeholder="このスポットについて詳しく教えてください..."
                              className="px-4 py-3 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                      disabled={createSpotMutation.isPending}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {createSpotMutation.isPending ? "追加中..." : "リストを追加"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Spots List Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <List className="text-blue-600 mr-2 h-6 w-6" />
                投稿されたリスト
              </h2>
              <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {spots.length} 件のリスト
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-slate-200 rounded mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded mb-3"></div>
                      <div className="h-20 bg-slate-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : spots.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-200">
                <CardContent className="text-center py-12">
                  <MapPin className="text-slate-300 h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">
                    まだリストが投稿されていません
                  </h3>
                  <p className="text-slate-500">
                    左のフォームから最初のリストを追加してみましょう！
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {spots.map((spot) => (
                  <Card key={spot.id} className="shadow-lg hover:shadow-xl transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              {spot.listName}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">
                            {spot.placeName}
                          </h3>
                          <div className="flex items-center text-slate-600 mb-2">
                            <Globe className="text-green-500 mr-2 h-4 w-4" />
                            <span className="font-medium text-sm">{spot.region}</span>
                          </div>
                          {spot.url && (
                            <div className="flex items-center text-blue-600 mb-3">
                              <Globe className="mr-2 h-4 w-4" />
                              <a
                                href={spot.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm hover:underline"
                              >
                                {spot.url}
                              </a>
                            </div>
                          )}
                        </div>
                        
                        {user?.id === spot.userId && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>スポットを削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  この操作は元に戻すことができません。本当に削除しますか？
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(spot.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  削除する
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

                      <p className="text-slate-700 mb-4 leading-relaxed">
                        {spot.comment}
                      </p>

                      <Separator className="my-4" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={spot.user.profileImageUrl || ""} />
                            <AvatarFallback>
                              {spot.user.firstName?.charAt(0) || spot.user.email?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {spot.user.firstName && spot.user.lastName 
                                ? `${spot.user.firstName} ${spot.user.lastName}`
                                : spot.user.firstName || spot.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-slate-500 text-xs">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(spot.createdAt!).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className="lg:col-span-1">
            {isAuthenticated && user && (
              <Card className="shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <Avatar className="h-20 w-20 mx-auto mb-4">
                      <AvatarImage src={user.profileImageUrl || ""} />
                      <AvatarFallback className="text-lg">
                        {user.firstName?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-bold text-slate-800">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName || user.email}
                    </h3>
                    {user.email && (
                      <p className="text-sm text-slate-500">{user.email}</p>
                    )}
                  </div>

                  {user.bio && (
                    <div className="mb-6">
                      <p className="text-sm text-slate-600">{user.bio}</p>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div className="text-center">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">最近の投稿</h4>
                      {spots.filter(spot => spot.user.id === user.id).slice(0, 3).map(spot => (
                        <div key={spot.id} className="text-xs text-slate-500 mb-1">
                          {spot.placeName}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}