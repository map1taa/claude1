import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type User, type Spot, type UpdateProfile } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User as UserIcon, 
  MapPin, 
  Edit, 
  List,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch user spots
  const { data: spots = [], isLoading: spotsLoading } = useQuery<(Spot & { user: User })[]>({
    queryKey: ["/api/spots"],
  });

  // Profile update form
  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: (user as any)?.username || `${(user as any)?.firstName || ""} ${(user as any)?.lastName || ""}`.trim() || "",
      bio: (user as any)?.bio || "",
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      await apiRequest("PUT", "/api/users/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditDialogOpen(false);
      toast({
        title: "プロフィールを更新しました",
        description: "プロフィール情報が正常に更新されました",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "プロフィールの更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateProfile) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#0294b5' }}></div>
      </div>
    );
  }

  const displayName = (user as any)?.username || 
    ((user as any)?.firstName && (user as any)?.lastName ? `${(user as any).firstName} ${(user as any).lastName}` : 
    (user as any)?.firstName || (user as any)?.lastName || "Unknown User");

  // Group spots by list
  const listGroups = spots.reduce((acc, spot) => {
    const key = `${spot.listName}-${spot.region}`;
    if (!acc[key]) {
      acc[key] = { listName: spot.listName, region: spot.region, spots: [] };
    }
    acc[key].spots.push(spot);
    return acc;
  }, {} as Record<string, { listName: string; region: string; spots: (Spot & { user: User })[] }>);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1eee9' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                ホームに戻る
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-slate-800">プロフィール</h1>
            <div></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* User Profile Card */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                    <AvatarFallback className="text-lg font-bold" style={{ backgroundColor: '#fb5722', color: 'white' }}>
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{displayName}</h2>
                    {(user as any)?.bio && (
                      <p className="text-slate-600 mt-1">{(user as any).bio}</p>
                    )}
                  </div>
                </div>
                
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      className="flex items-center"
                      style={{ borderColor: '#fb5722', color: '#fb5722' }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      プロフィール編集
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>プロフィール編集</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ユーザーネーム</FormLabel>
                              <FormControl>
                                <Input placeholder="あなたの名前" {...field} />
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
                              <FormLabel>ひとことプロフィール</FormLabel>
                              <FormControl>
                                <Input placeholder="自分について一言どうぞ" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full text-white"
                          style={{ backgroundColor: '#fb5722' }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#e74c20'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#fb5722'}
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "更新中..." : "更新"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Lists Overview */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <List className="h-5 w-5 mr-2" style={{ color: '#0294b5' }} />
                作成したリスト一覧 ({Object.keys(listGroups).length}個)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {spotsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-6 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded mb-2"></div>
                      <div className="h-16 bg-slate-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : Object.keys(listGroups).length === 0 ? (
                <div className="text-center py-12">
                  <List className="text-slate-300 h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">
                    まだリストが作成されていません
                  </h3>
                  <p className="text-slate-500 mb-4">
                    最初のリストを作成してみましょう
                  </p>
                  <Link href="/">
                    <Button style={{ backgroundColor: '#0294b5' }} className="text-white">
                      リストを作成する
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(listGroups).map(([key, list]) => (
                    <Card key={key} className="border border-slate-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">
                              {list.listName}
                            </h3>
                            <div className="flex items-center text-slate-600 text-sm">
                              <MapPin className="h-4 w-4 mr-1" style={{ color: '#0294b5' }} />
                              <span>{list.region}</span>
                            </div>
                          </div>
                          <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {list.spots.length}件
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-slate-700">場所一覧:</h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {list.spots.slice(0, 3).map((spot) => (
                              <div key={spot.id} className="flex items-center text-sm text-slate-600">
                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#0294b5' }}></div>
                                <span className="truncate">{spot.placeName}</span>
                              </div>
                            ))}
                            {list.spots.length > 3 && (
                              <div className="text-xs text-slate-500 ml-4">
                                他 {list.spots.length - 3} 件...
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}