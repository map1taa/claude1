import { useState } from "react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Edit2, Trash2, MessageCircle, Link2, Plus, X } from "lucide-react";
import { useLocation } from "wouter";

type FormData = {
  placeName: string;
  url: string;
  comment: string;
};

function EditSpotOverlay({
  spot,
  onClose,
  onSave,
  onDelete,
  isPending,
}: {
  spot: Spot & { user: User };
  onClose: () => void;
  onSave: (data: { placeName: string; url: string; comment: string }) => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const [placeName, setPlaceName] = useState(spot.placeName || "");
  const [url, setUrl] = useState(spot.url || "");
  const [comment, setComment] = useState(spot.comment || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background border-2 border-foreground rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">場所を編集</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="flex items-center font-bold text-sm mb-2">
              <Link2 className="mr-1 h-4 w-4" />
              URL
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="px-3 py-2 border-2 border-foreground bg-background"
            />
          </div>
          <div>
            <label className="flex items-center font-bold text-sm mb-2">
              <MapPin className="mr-1 h-4 w-4" />
              場所名
            </label>
            <Input
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="例：スターバックス コーヒー 渋谷店"
              className="px-3 py-2 border-2 border-foreground bg-background"
            />
          </div>
          <div>
            <label className="flex items-center font-bold text-sm mb-2">
              <MessageCircle className="mr-1 h-4 w-4" />
              コメント
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="この場所についてのコメントを入力..."
              className="px-3 py-2 border-2 border-foreground bg-background"
            />
          </div>
          <Button
            onClick={() => onSave({ placeName, url, comment })}
            className="w-full py-3 font-bold tracking-wide bg-primary text-primary-foreground"
            disabled={isPending}
          >
            {isPending ? "更新中..." : "更新"}
          </Button>
          {!showDeleteConfirm ? (
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              この場所を削除
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border-2 border-foreground"
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={onDelete}
                className="flex-1"
              >
                削除する
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EditList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSpot, setEditingSpot] = useState<(Spot & { user: User }) | null>(null);

  // Get list info from sessionStorage
  const listData = JSON.parse(sessionStorage.getItem('editingList') || '{}');
  const [listName] = useState(listData.listName || '');
  const [region] = useState(listData.region || '');

  // Redirect if no list data
  if (!listName || !region) {
    setLocation('/');
    return null;
  }

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

  // Edit list name form
  const editForm = useForm<{ listName: string }>({
    defaultValues: {
      listName: listName,
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

  // Update spot mutation
  const updateSpotMutation = useMutation({
    mutationFn: async (data: { id: number; placeName: string; url: string; comment: string }): Promise<void> => {
      await apiRequest("PUT", `/api/spots/${data.id}`, {
        placeName: data.placeName,
        url: data.url,
        comment: data.comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spots"] });
      setEditingSpot(null);
      toast({ title: "場所が更新されました" });
    },
    onError: (error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/spots"] });
      toast({ title: "保存しました" });
      // Navigate to the list view on home
      sessionStorage.setItem('newListToView', JSON.stringify({ listName: variables.newListName, region }));
      setLocation('/');
    },
  });

  const onSpotSubmit = (data: FormData) => {
    createSpotMutation.mutate({
      ...data,
      listName,
      region,
    });
  };

  const onEditSubmit = (data: { listName: string }) => {
    editListMutation.mutate({
      oldListName: listName,
      newListName: data.listName,
      region,
    });
  };

  const handleDelete = (id: number) => {
    deleteSpotMutation.mutate(id);
  };

  const filteredSpots = spots.filter(spot =>
    spot.listName === listName && spot.region === region
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <h1
              onClick={() => setLocation('/')}
              className="text-xl font-bold cursor-pointer hover:opacity-70 transition-opacity tracking-wider"
            >
              あしあと
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* List Name Edit */}
        <div className="mb-8">
          <p className="section-header mb-4">リスト名</p>
          <div className="border-t border-foreground/30 pt-4">
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex gap-3">
                <FormField
                  control={editForm.control}
                  name="listName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          className="px-3 py-2 border-2 border-foreground bg-background text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground"
                  disabled={editListMutation.isPending}
                >
                  {editListMutation.isPending ? "更新中..." : "更新"}
                </Button>
              </form>
            </Form>
            <p className="text-sm text-muted-foreground mt-2">{region}</p>
          </div>
        </div>

        {/* Existing Places */}
        <div className="mb-8">
          <p className="section-header mb-4">登録済みの場所</p>
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
            ) : filteredSpots.length === 0 ? (
              <p className="text-muted-foreground text-sm pt-4">このリストには場所が登録されていません</p>
            ) : (
              <div className="divide-y divide-foreground/20">
                {filteredSpots.map((spot) => (
                  <div key={spot.id} className="py-3">
                    <div className="flex items-start justify-between">
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
                      {(user as any)?.id === spot.userId && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingSpot(spot)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Place Button */}
        <div className="flex justify-center mt-10">
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-primary text-primary-foreground px-8"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            場所を追加
          </Button>
        </div>

        {/* Save Button */}
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => {
              const currentName = editForm.getValues("listName");
              if (currentName !== listName) {
                editForm.handleSubmit(onEditSubmit)();
              } else {
                sessionStorage.setItem('newListToView', JSON.stringify({ listName, region }));
                setLocation('/');
              }
            }}
            className="bg-primary text-primary-foreground px-8"
            size="lg"
            disabled={editListMutation.isPending}
          >
            {editListMutation.isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      {/* Edit Spot Overlay */}
      {editingSpot && (
        <EditSpotOverlay
          spot={editingSpot}
          onClose={() => setEditingSpot(null)}
          onSave={(data) => updateSpotMutation.mutate({ id: editingSpot.id, ...data })}
          onDelete={() => {
            deleteSpotMutation.mutate(editingSpot.id);
            setEditingSpot(null);
          }}
          isPending={updateSpotMutation.isPending}
        />
      )}

      {/* Add Place Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddForm(false)} />
          <div className="relative bg-background border-2 border-foreground rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">場所を追加</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => {
                onSpotSubmit(data);
                setShowAddForm(false);
              })} className="space-y-4">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center font-bold">
                        <Link2 className="mr-1 h-4 w-4" />
                        URL <span className="text-xs text-muted-foreground ml-2 font-normal">(場所の情報を自動入力)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="https://example.com"
                            className="px-3 py-2 border-2 border-foreground bg-background"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleUrlChange(e.target.value);
                            }}
                          />
                          {extractUrlMutation.isPending && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin h-4 w-4 border-b-2 border-foreground"></div>
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
                      <FormLabel className="flex items-center font-bold">
                        <MapPin className="mr-1 h-4 w-4" />
                        場所名
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例：スターバックス コーヒー 渋谷店"
                          className="px-3 py-2 border-2 border-foreground bg-background"
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
                      <FormLabel className="flex items-center font-bold">
                        <MessageCircle className="mr-1 h-4 w-4" />
                        コメント
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="この場所についてのコメントを入力..."
                          className="px-3 py-2 border-2 border-foreground bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full py-3 font-bold tracking-wide bg-primary text-primary-foreground"
                  disabled={createSpotMutation.isPending}
                >
                  {createSpotMutation.isPending ? "追加中..." : "場所を追加"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
