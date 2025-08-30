import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Globe, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";

const listFormSchema = z.object({
  listName: z.string().min(1, "リスト名を入力してください"),
  region: z.string().min(1, "地域を選択してください"),
});

type ListFormData = z.infer<typeof listFormSchema>;

export default function CreateList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<"japan" | "overseas">("japan");
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const form = useForm<ListFormData>({
    resolver: zodResolver(listFormSchema),
    defaultValues: {
      listName: "",
      region: "",
    },
  });

  // Japan prefectures data
  const japanPrefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ];

  // Overseas regions data
  const overseasRegions = [
    "アジア", "ヨーロッパ", "北アメリカ", "南アメリカ", "オセアニア", "アフリカ", "中東"
  ];

  const onSubmit = (data: ListFormData) => {
    // Store the list data in sessionStorage to pass to home page
    sessionStorage.setItem('newListToView', JSON.stringify(data));
    
    toast({
      title: "リストが作成されました",
      description: `${data.listName} (${data.region}) への場所の追加を開始してください。`,
    });
    
    // Navigate back to home with the new list
    setLocation('/');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1eee9' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 
                  className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: '#4FAEC0' }}
                >
                  あしあと
                </h1>
              </Link>
            </div>
            
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                ホームに戻る
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Plus className="mr-2 h-6 w-6" style={{ color: '#4FAEC0' }} />
              新しいリストを作成
            </CardTitle>
            <CardDescription>
              お気に入りの場所をまとめるリストを作成しましょう
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="listName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">リスト名</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例：東京のおすすめカフェ"
                          className="px-4 py-3 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">地域カテゴリー</label>
                  <RadioGroup
                    value={selectedCategory}
                    onValueChange={(value: "japan" | "overseas") => {
                      setSelectedCategory(value);
                      setSelectedLocation("");
                      form.setValue("region", "");
                    }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="japan" id="japan" className="peer sr-only" />
                      <label
                        htmlFor="japan"
                        className="flex items-center justify-center rounded-lg border-2 border-slate-200 p-4 hover:bg-slate-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                      >
                        <MapPin className="mr-2 h-5 w-5" />
                        日本
                      </label>
                    </div>
                    <div>
                      <RadioGroupItem value="overseas" id="overseas" className="peer sr-only" />
                      <label
                        htmlFor="overseas"
                        className="flex items-center justify-center rounded-lg border-2 border-slate-200 p-4 hover:bg-slate-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                      >
                        <Globe className="mr-2 h-5 w-5" />
                        海外
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">
                        {selectedCategory === "japan" ? "都道府県" : "地域"}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedLocation(value);
                          }}
                          className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1"
                        >
                          {(selectedCategory === "japan" ? japanPrefectures : overseasRegions).map((location) => (
                            <div key={location}>
                              <RadioGroupItem value={location} id={location} className="peer sr-only" />
                              <label
                                htmlFor={location}
                                className="flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:text-blue-700 cursor-pointer transition-all"
                              >
                                {location}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  style={{ backgroundColor: '#4FAEC0', color: 'white' }}
                  size="lg"
                >
                  リストを作成
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}