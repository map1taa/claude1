import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Home as HomeIcon } from "lucide-react";

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
    sessionStorage.setItem('editingList', JSON.stringify({ listName: data.listName, region: data.region }));

    toast({
      title: "リストが作成されました",
    });

    setLocation('/edit-list');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <button
              onClick={() => setLocation('/')}
              className="cursor-pointer hover:opacity-70 transition-opacity"
            >
              <HomeIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-3">
                <FormField
                  control={form.control}
                  name="listName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="タイトル"
                          className="px-3 py-2 border-2 border-foreground bg-background text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <span className="text-xl font-bold shrink-0">/</span>
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="場所名"
                          className="px-3 py-2 border-2 border-foreground bg-background text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
    </div>
  );
}
