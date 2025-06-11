import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSpotSchema, type Spot, type InsertSpot } from "@shared/schema";
import { z } from "zod";

// Form type for handling string tags input
const formSchema = insertSpotSchema.extend({
  tags: z.string().optional(),
});
type FormData = z.infer<typeof formSchema>;
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MapPin, Plus, Trash2, MessageCircle, Calendar, List, Search, Tag, Globe } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [searchTag, setSearchTag] = useState("");
  const [displayedSpots, setDisplayedSpots] = useState<Spot[]>([]);

  // Fetch spots
  const { data: spots = [], isLoading } = useQuery<Spot[]>({
    queryKey: ["/api/spots"],
  });

  // Update displayed spots when data changes
  useEffect(() => {
    setDisplayedSpots(spots);
  }, [spots]);

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      region: "",
      title: "",
      location: "",
      comment: "",
      tags: "",
    },
  });

  // Create spot mutation
  const createSpotMutation = useMutation({
    mutationFn: async (data: InsertSpot) => {
      const response = await apiRequest("POST", "/api/spots", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spots"] });
      form.reset();
      toast({
        title: "スポットが追加されました",
        description: "新しいスポットが正常に追加されました！",
      });
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
    createSpotMutation.mutate(data as any);
  };

  const handleDelete = (id: number) => {
    deleteSpotMutation.mutate(id);
  };

  const handleSearch = async () => {
    if (!searchTag.trim()) {
      setDisplayedSpots(spots);
      return;
    }

    try {
      const response = await fetch(`/api/spots/search?tag=${encodeURIComponent(searchTag.trim())}`);
      if (response.ok) {
        const searchResults = await response.json();
        setDisplayedSpots(searchResults);
      }
    } catch (error) {
      toast({
        title: "検索エラー",
        description: "タグ検索に失敗しました。",
        variant: "destructive",
      });
    }
  };

  const resetSearch = () => {
    setSearchTag("");
    setDisplayedSpots(spots);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-800 text-center md:text-left flex items-center justify-center md:justify-start">
            <MapPin className="text-blue-600 mr-3 h-8 w-8" />
            おすすめスポットログ
          </h1>
          <p className="text-slate-600 mt-2 text-center md:text-left">
            あなたのお気に入りの場所を記録・共有しましょう
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                  <Plus className="text-blue-600 mr-2 h-5 w-5" />
                  新しいスポットを追加
                </h2>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 flex items-center">
                            <Globe className="text-slate-400 mr-1 h-4 w-4" />
                            地域
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="例：関東地方"
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
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 flex items-center">
                            <MessageCircle className="text-slate-400 mr-1 h-4 w-4" />
                            タイトル
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="例：美味しいラーメン店"
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
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 flex items-center">
                            <MapPin className="text-slate-400 mr-1 h-4 w-4" />
                            場所
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="例：東京都渋谷区"
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
                            おすすめ理由
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="このスポットをおすすめする理由を教えてください..."
                              rows={4}
                              className="px-4 py-3 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 flex items-center">
                            <Tag className="text-slate-400 mr-1 h-4 w-4" />
                            タグ（カンマ区切り）
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="例：ラーメン, 安い, 駅近"
                              className="px-4 py-3 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
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
                      {createSpotMutation.isPending ? "追加中..." : "スポットを追加"}
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
                投稿されたスポット
              </h2>
              <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {displayedSpots.length} 件のスポット
              </div>
            </div>

            {/* Search Bar */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Input
                      placeholder="タグで検索..."
                      value={searchTag}
                      onChange={(e) => setSearchTag(e.target.value)}
                      className="border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    検索
                  </Button>
                  <Button
                    onClick={resetSearch}
                    variant="outline"
                    className="border-slate-300 text-slate-600 hover:bg-slate-50"
                  >
                    リセット
                  </Button>
                </div>
              </CardContent>
            </Card>

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
            ) : displayedSpots.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-200">
                <CardContent className="text-center py-12">
                  <MapPin className="text-slate-300 h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">
                    {searchTag ? "検索結果が見つかりませんでした" : "まだスポットが投稿されていません"}
                  </h3>
                  <p className="text-slate-500">
                    {searchTag ? "別のタグで検索してみてください" : "左のフォームから最初のスポットを追加してみましょう！"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {displayedSpots.map((spot) => (
                  <Card key={spot.id} className="shadow-lg hover:shadow-xl transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-800 mb-2">
                            {spot.title}
                          </h3>
                          <div className="flex items-center text-slate-600 mb-2">
                            <Globe className="text-green-500 mr-2 h-4 w-4" />
                            <span className="font-medium text-sm">{spot.region}</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full ml-4">
                          {spot.createdAt}
                        </span>
                      </div>

                      <div className="flex items-center text-slate-600 mb-3">
                        <MapPin className="text-blue-500 mr-2 h-4 w-4" />
                        <span className="font-medium">{spot.location}</span>
                      </div>

                      <p className="text-slate-700 leading-relaxed mb-4">
                        {spot.comment}
                      </p>

                      {/* Tags */}
                      {spot.tags && spot.tags.length > 0 && (
                        <div className="flex items-center flex-wrap gap-2 mb-4">
                          <Tag className="text-slate-400 h-4 w-4" />
                          {spot.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center text-slate-500 text-sm">
                          <Calendar className="mr-1 h-4 w-4" />
                          投稿日: {spot.createdAt}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              削除
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
                              <AlertDialogAction
                                onClick={() => handleDelete(spot.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <p>&copy; 2024 おすすめスポットログ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
