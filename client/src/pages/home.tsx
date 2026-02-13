import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Spot, type User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, User as UserIcon, LogOut, Edit2 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // State management
  const [viewingList, setViewingList] = useState<{ listName: string; region: string } | null>(null);

  // Fetch spots
  const { data: spots = [], isLoading } = useQuery<(Spot & { user: User })[]>({
    queryKey: ["/api/spots"],
  });

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1
                onClick={() => setViewingList(null)}
                className="text-xl font-bold cursor-pointer hover:opacity-70 transition-opacity tracking-wider"
              >
                あしあと
              </h1>
            </div>

            {isAuthenticated && (
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-foreground text-background text-xs">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 border-2 border-foreground" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        プロフィール
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      await apiRequest("POST", "/api/auth/logout");
                      queryClient.clear();
                      window.location.href = "/";
                    }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      ログアウト
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
        <div>
          {/* Main Content Area */}
          <div className="space-y-6">
            {viewingList ? (
              <>
                {/* Viewing specific list */}
                <div>
                  <div className="mb-6 border-2 border-foreground rounded-lg px-4 py-3">
                    <h2 className="text-xl font-bold">
                      {viewingList.listName}
                    </h2>
                    <p className="text-sm text-muted-foreground">{viewingList.region}</p>
                  </div>

                  {/* Places List Section */}
                  <div className="border-t-2 border-foreground pt-6">
                    <p className="section-header mb-4">場所一覧</p>
                    <div className="border-t border-foreground/30">
                      {isLoading ? (
                        <div className="space-y-3 pt-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-4 bg-muted w-3/4 mb-2"></div>
                              <div className="h-3 bg-muted w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      ) : spots.filter(spot =>
                        spot.listName === viewingList.listName &&
                        spot.region === viewingList.region
                      ).length === 0 ? (
                        <p className="text-muted-foreground text-sm pt-4">このリストには場所が登録されていません</p>
                      ) : (
                        <div className="space-y-3">
                          {spots.filter(spot =>
                            spot.listName === viewingList.listName &&
                            spot.region === viewingList.region
                          ).map((spot) => (
                            <div key={spot.id} className="border-2 border-foreground rounded-lg px-4 py-3">
                              <div className="flex-1">
                                {spot.url ? (
                                  <a
                                    href={spot.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold underline hover:opacity-70 transition-opacity"
                                  >
                                    {spot.placeName || 'タイトルなし'}
                                  </a>
                                ) : (
                                  <h5 className="font-bold">{spot.placeName || 'タイトルなし'}</h5>
                                )}
                                <p className="text-sm text-muted-foreground mt-1">{spot.comment}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 下部ボタン */}
                  <div className="flex justify-center mt-10">
                    <Button
                      variant="outline"
                      onClick={() => {
                        sessionStorage.setItem('editingList', JSON.stringify({ listName: viewingList.listName, region: viewingList.region }));
                        setLocation('/edit-list');
                      }}
                      className="bg-primary text-primary-foreground px-8"
                      size="lg"
                    >
                      <Edit2 className="mr-2 h-5 w-5" />
                      編集
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* リスト一覧の表示 */}
                <div>
                  <div className="mb-4">
                    <p className="section-header">作成済みリスト一覧</p>
                  </div>
                  <div className="border-t-2 border-foreground">
                    {spots.length === 0 ? (
                      <p className="text-muted-foreground text-sm pt-4">まだリストがありません</p>
                    ) : (
                      <div className="space-y-3 pt-3">
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
                          <div key={key} className="w-full flex items-center border-2 border-foreground rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors">
                            <button
                              onClick={() => setViewingList({ listName: list.listName, region: list.region })}
                              className="flex-1 text-left"
                            >
                              <h3 className="text-lg font-bold">{list.listName}</h3>
                              <p className="text-sm text-muted-foreground">{list.region}</p>
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 p-1"
                              onClick={() => {
                                sessionStorage.setItem('editingList', JSON.stringify({ listName: list.listName, region: list.region }));
                                setLocation('/edit-list');
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* リスト作成ボタン */}
          {isAuthenticated && !viewingList && (
            <div className="flex justify-center mt-10">
              <Button asChild size="lg" className="bg-primary text-primary-foreground px-8">
                <Link href="/create-list">
                  <Plus className="mr-2 h-5 w-5" />
                  リスト作成
                </Link>
              </Button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
