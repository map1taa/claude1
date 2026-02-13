import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

  const japanPrefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ];

  const overseasCountries = [
    "韓国", "台湾", "香港", "マカオ", "中国", "タイ", "ベトナム", "シンガポール", "マレーシア", "インドネシア", "フィリピン", "インド", "ネパール", "スリランカ", "ミャンマー", "カンボジア", "ラオス", "バングラデシュ", "ブータン", "モルディブ",
    "イタリア", "フランス", "スペイン", "ドイツ", "イギリス", "オランダ", "ベルギー", "スイス", "オーストリア", "ポルトガル", "ギリシャ", "チェコ", "ハンガリー", "ポーランド", "クロアチア", "スロベニア", "スロバキア", "ルーマニア", "ブルガリア", "セルビア", "モンテネグロ", "ボスニア・ヘルツェゴビナ", "北マケドニア", "アルバニア", "コソボ", "ノルウェー", "スウェーデン", "デンマーク", "フィンランド", "アイスランド", "エストニア", "ラトビア", "リトアニア", "ベラルーシ", "ウクライナ", "モルドバ", "ロシア", "マルタ", "キプロス", "ルクセンブルク", "モナコ", "リヒテンシュタイン", "サンマリノ", "バチカン", "アンドラ",
    "アメリカ", "カナダ", "メキシコ", "グアテマラ", "ベリーズ", "エルサルバドル", "ホンジュラス", "ニカラグア", "コスタリカ", "パナマ", "キューバ", "ジャマイカ", "ハイチ", "ドミニカ共和国", "プエルトリコ", "バハマ", "バルバドス", "トリニダード・トバゴ", "セントルシア", "セントビンセント・グレナディーン", "グレナダ", "ドミニカ国", "アンティグア・バーブーダ", "セントクリストファー・ネイビス",
    "ブラジル", "アルゼンチン", "チリ", "ペルー", "コロンビア", "ベネズエラ", "エクアドル", "ボリビア", "パラグアイ", "ウルグアイ", "ガイアナ", "スリナム", "フランス領ギアナ",
    "オーストラリア", "ニュージーランド", "フィジー", "パプアニューギニア", "バヌアツ", "ソロモン諸島", "ニューカレドニア", "タヒチ", "グアム", "サイパン", "パラオ", "ミクロネシア", "マーシャル諸島", "ナウル", "キリバス", "ツバル", "サモア", "トンガ", "クック諸島",
    "エジプト", "モロッコ", "チュニジア", "アルジェリア", "リビア", "南アフリカ", "ケニア", "タンザニア", "ウガンダ", "ルワンダ", "エチオピア", "ガーナ", "ナイジェリア", "セネガル", "マリ", "ブルキナファソ", "コートジボワール", "トーゴ", "ベナン", "ニジェール", "チャド", "カメルーン", "中央アフリカ", "ガボン", "赤道ギニア", "コンゴ共和国", "コンゴ民主共和国", "アンゴラ", "ザンビア", "ジンバブエ", "ボツワナ", "ナミビア", "レソト", "スワジランド", "マラウイ", "モザンビーク", "マダガスカル", "モーリシャス", "セーシェル", "コモロ", "ジブチ", "ソマリア", "エリトリア", "スーダン", "南スーダン", "リベリア", "シエラレオネ", "ギニア", "ギニアビサウ", "カーボベルデ", "サントメ・プリンシペ",
    "トルコ", "イスラエル", "パレスチナ", "ヨルダン", "レバノン", "シリア", "イラク", "イラン", "サウジアラビア", "UAE", "オマーン", "カタール", "バーレーン", "クウェート", "イエメン", "アフガニスタン", "パキスタン", "アゼルバイジャン", "アルメニア", "ジョージア",
    "その他"
  ];

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
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-xl font-bold cursor-pointer hover:opacity-70 transition-opacity tracking-wider">
                  あしあと
                </h1>
              </Link>
            </div>

            <Button asChild size="sm" className="bg-primary text-primary-foreground">
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

            <div className="space-y-3">
              <p className="section-header">地域カテゴリー</p>
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
                    className="flex items-center justify-center border-2 border-foreground/30 p-4 rounded-lg hover:bg-muted peer-data-[state=checked]:border-foreground peer-data-[state=checked]:bg-muted cursor-pointer transition-all"
                  >
                    <MapPin className="mr-2 h-5 w-5" />
                    日本
                  </label>
                </div>
                <div>
                  <RadioGroupItem value="overseas" id="overseas" className="peer sr-only" />
                  <label
                    htmlFor="overseas"
                    className="flex items-center justify-center border-2 border-foreground/30 p-4 rounded-lg hover:bg-muted peer-data-[state=checked]:border-foreground peer-data-[state=checked]:bg-muted cursor-pointer transition-all"
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
                  <FormLabel className="font-bold">
                    {selectedCategory === "japan" ? "都道府県" : "国名"}
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
                      {(selectedCategory === "japan" ? japanPrefectures : overseasCountries).map((location: string) => (
                        <div key={location}>
                          <RadioGroupItem value={location} id={location} className="peer sr-only" />
                          <label
                            htmlFor={location}
                            className="flex items-center justify-center border border-foreground/30 px-3 py-2 text-sm rounded-lg hover:bg-muted peer-data-[state=checked]:border-foreground peer-data-[state=checked]:bg-muted peer-data-[state=checked]:font-bold cursor-pointer transition-all"
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
