import { useState } from "react";
import { useParams } from "wouter";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  User as UserIcon, 
  MapPin, 
  Calendar, 
  Users, 
  UserPlus, 
  UserMinus, 
  Edit, 
  Globe,
  Tag,
  MessageCircle
} from "lucide-react";

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const profileUserId = id || currentUser?.id;
  const isOwnProfile = !id || id === currentUser?.id;

  // Fetch user profile
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users", profileUserId],
    enabled: !!profileUserId,
  });

  // Fetch user spots
  const { data: spots = [], isLoading: spotsLoading } = useQuery<Spot[]>({
    queryKey: ["/api/users", profileUserId, "spots"],
    enabled: !!profileUserId,
  });

  // Fetch follow status
  const { data: followStatus } = useQuery<{ isFollowing: boolean }>({
    queryKey: ["/api/users", profileUserId, "follow-status"],
    enabled: !!profileUserId && !isOwnProfile,
  });

  // Fetch follow counts
  const { data: followCounts } = useQuery<{ followers: number; following: number }>({
    queryKey: ["/api/users", profileUserId, "follow-counts"],
    enabled: !!profileUserId,
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (followStatus?.isFollowing) {
        await apiRequest("DELETE", `/api/users/${profileUserId}/follow`);
      } else {
        await apiRequest("POST", `/api/users/${profileUserId}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", profileUserId, "follow-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", profileUserId, "follow-counts"] });
      toast({
        title: followStatus?.isFollowing ? "フォローを解除しました" : "フォローしました",
        description: followStatus?.isFollowing ? "フォローを解除しました" : "フォローを開始しました",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "フォローの更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  // Profile update form
  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
      location: user?.location || "",
      isPublic: user?.isPublic ?? true,
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const response = await apiRequest("PUT", "/api/users/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", profileUserId] });
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

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">ユーザーが見つかりません</h1>
          <p className="text-slate-600">指定されたユーザーは存在しません</p>
        </div>
      </div>
    );
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email || "Unknown User";

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback>
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{displayName}</h1>
                {user.location && (
                  <div className="flex items-center text-slate-600 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isOwnProfile ? (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
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
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>名前</FormLabel>
                              <FormControl>
                                <Input placeholder="太郎" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>姓</FormLabel>
                              <FormControl>
                                <Input placeholder="田中" {...field} />
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
                              <FormLabel>自己紹介</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="自己紹介を書いてください..." 
                                  rows={3}
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
                              <FormLabel>場所</FormLabel>
                              <FormControl>
                                <Input placeholder="東京都" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="isPublic"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <FormLabel>プロフィールを公開</FormLabel>
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "更新中..." : "更新"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  variant={followStatus?.isFollowing ? "outline" : "default"}
                >
                  {followStatus?.isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      フォロー解除
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      フォロー
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  プロフィール情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.bio && (
                  <div>
                    <h4 className="font-medium text-slate-800 mb-2">自己紹介</h4>
                    <p className="text-slate-600">{user.bio}</p>
                  </div>
                )}
                
                {followCounts && (
                  <div className="flex justify-between text-center">
                    <div>
                      <div className="text-2xl font-bold text-slate-800">
                        {followCounts.followers}
                      </div>
                      <div className="text-sm text-slate-600">フォロワー</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">
                        {followCounts.following}
                      </div>
                      <div className="text-sm text-slate-600">フォロー中</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">
                        {spots.length}
                      </div>
                      <div className="text-sm text-slate-600">スポット</div>
                    </div>
                  </div>
                )}

                {user.createdAt && (
                  <div className="flex items-center text-slate-600 text-sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Spots */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  投稿されたスポット ({spots.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {spotsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-6 bg-slate-200 rounded mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded mb-2"></div>
                        <div className="h-20 bg-slate-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : spots.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="text-slate-300 h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">
                      まだスポットが投稿されていません
                    </h3>
                    <p className="text-slate-500">
                      {isOwnProfile ? "最初のスポットを追加してみましょう" : "このユーザーはまだスポットを投稿していません"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {spots.map((spot) => (
                      <Card key={spot.id} className="border border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-bold text-slate-800">
                              {spot.title}
                            </h3>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              {spot.createdAt ? new Date(spot.createdAt).toLocaleDateString('ja-JP') : ''}
                            </span>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex items-center text-slate-600 text-sm">
                              <Globe className="text-green-500 mr-2 h-4 w-4" />
                              <span>{spot.region}</span>
                            </div>
                            <div className="flex items-center text-slate-600 text-sm">
                              <MapPin className="text-blue-500 mr-2 h-4 w-4" />
                              <span>{spot.location}</span>
                            </div>
                          </div>

                          <p className="text-slate-700 mb-3">{spot.comment}</p>


                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}