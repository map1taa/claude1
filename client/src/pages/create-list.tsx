import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";

const listFormSchema = z.object({
  listName: z.string().min(1, "リスト名を入力してください"),
  region: z.string().min(1, "地域を選択してください"),
});

type ListFormData = z.infer<typeof listFormSchema>;

export default function CreateList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<ListFormData>({
    resolver: zodResolver(listFormSchema),
    defaultValues: {
      listName: "",
      region: "",
    },
  });

  const onSubmit = (data: ListFormData) => {
    sessionStorage.setItem('newListToView', JSON.stringify(data));

    toast({
      title: "リストが作成されました",
      description: `${data.listName} (${data.region}) への場所の追加を開始してください。`,
    });

    setLocation('/');
  };

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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="listName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <Plus className="h-6 w-6 shrink-0" />
                      <Input
                        placeholder="新しいリスト名を入力"
                        className="px-3 py-2 border-2 border-foreground bg-background text-lg"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="地域を入力（例：東京都、韓国）"
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
              className="w-full bg-primary text-primary-foreground font-bold tracking-wide"
              size="lg"
            >
              リストを作成
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
