import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const listFormSchema = z.object({
  listName: z.string().min(1, "ジャンルを入力してください"),
  region: z.string().min(1, "場所名を入力してください"),
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
    sessionStorage.setItem('newListToView', JSON.stringify({ listName: data.listName, region: data.region }));

    toast({
      title: "リストが作成されました",
    });

    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-[#E9BC4F] text-black flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#E9BC4F]">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <button
              onClick={() => setLocation('/')}
              className="cursor-pointer hover:opacity-70 transition-opacity"
            >
              <span className="text-2xl font-black tracking-widest">レコメン</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[7rem]">
                      <FormControl>
                        <Input
                          placeholder="場所名"
                          className="px-3 py-2 border-2 border-black bg-white rounded-xl text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <span className="text-lg font-bold shrink-0">でおすすめの</span>
                <FormField
                  control={form.control}
                  name="listName"
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[7rem]">
                      <FormControl>
                        <Input
                          placeholder="ジャンル"
                          className="px-3 py-2 border-2 border-black bg-white rounded-xl text-lg"
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
                className="w-full bg-black text-white hover:bg-black/80 font-bold tracking-wide rounded-xl"
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
