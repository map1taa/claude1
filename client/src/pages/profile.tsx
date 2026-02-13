import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type User, type Spot, type UpdateProfile } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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

  const { data: spots = [], isLoading: spotsLoading } = useQuery<(Spot & { user: User })[]>({
    queryKey: ["/api/spots"],
  });

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
        <div className="animate-spin h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  const displayName = (user as any)?.username ||
    ((user as any)?.firstName && (user as any)?.lastName ? `${(user as any).firstName} ${(user as any).lastName}` :
    (user as any)?.firstName || (user as any)?.lastName || "Unknown User");

  const listGroups = spots.reduce((acc, spot) => {
    const key = `${spot.listName}-${spot.region}`;
    if (!acc[key]) {
      acc[key] = { listName: spot.listName, region: spot.region, spots: [] };
    }
    acc[key].spots.push(spot);
    return acc;
  }, {} as Record<string, { listName: string; region: string; spots: (Spot & { user: User })[] }>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-foreground bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button size="sm" className="bg-primary text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                ホームに戻る
              </Button>
            </Link>
            <h1 className="text-xl font-bold">プロフィール</h1>
            <div></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* User Profile Section */}
          <div className="flex items-center justify-between border-b-2 border-foreground pb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                <AvatarFallback className="text-lg font-bold bg-foreground text-background">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{displayName}</h2>
                {(user as any)?.bio && (
                  <p className="text-muted-foreground mt-1">{(user as any).bio}</p>
                )}
              </div>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center bg-primary text-primary-foreground"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  プロフィール編集
                </Button>
              </DialogTrigger>
              <DialogContent className="border-2 border-foreground">
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
              </DialogContent>
            </Dialog>
          </div>

          {/* Lists Overview Section */}
          <div>
            <p className="section-header mb-4">
              作成したリスト一覧 ({Object.keys(listGroups).length}個)
            </p>
            <div className="border-t-2 border-foreground">
              {spotsLoading ? (
                <div className="space-y-4 pt-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-6 bg-muted mb-2"></div>
                      <div className="h-4 bg-muted mb-2"></div>
                    </div>
                  ))}
                </div>
              ) : Object.keys(listGroups).length === 0 ? (
                <div className="text-center py-12">
                  <List className="text-muted-foreground h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">
                    まだリストが作成されていません
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    最初のリストを作成してみましょう
                  </p>
                  <Link href="/">
                    <Button className="bg-primary text-primary-foreground font-bold">
                      リストを作成する
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-foreground/20">
                  {Object.entries(listGroups).map(([key, list]) => (
                    <div key={key} className="flex items-center justify-between py-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4" />
                        <div>
                          <h3 className="text-lg font-bold">
                            {list.listName}
                          </h3>
                          <span className="text-sm text-muted-foreground">{list.region}</span>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground border border-foreground/30 px-2 py-1">
                        {list.spots.length}件
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
