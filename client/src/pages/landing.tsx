import { Button } from "@/components/ui/button";
import { MapPin, Users, Heart, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b-2 border-foreground bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold tracking-wider">
                あしあと
              </h1>
            </div>
            <Button asChild className="bg-primary text-primary-foreground font-bold">
              <a href="/api/login">
                ログインして始める
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* ヒーローセクション */}
        <section className="text-center mb-16 border-b-2 border-foreground pb-16">
          <h2 className="text-4xl font-bold mb-6">
            あなたのお気に入りの場所を
            <br />
            みんなと共有しましょう
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            素敵な場所を発見したら、記録して共有。
            友達のおすすめスポットもチェックして、新しい発見を楽しもう。
          </p>
          <Button size="lg" asChild className="bg-primary text-primary-foreground font-bold tracking-wide px-8">
            <a href="/api/login">
              <MapPin className="mr-2 h-5 w-5" />
              今すぐ始める
            </a>
          </Button>
        </section>

        {/* 機能紹介セクション */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center border-2 border-foreground p-6">
            <MapPin className="h-8 w-8 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">スポット投稿</h3>
            <p className="text-sm text-muted-foreground">
              お気に入りの場所を記録。
              地域、場所、おすすめポイントを詳しく記録できます。
            </p>
          </div>

          <div className="text-center border-2 border-foreground p-6">
            <Users className="h-8 w-8 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">フォロー機能</h3>
            <p className="text-sm text-muted-foreground">
              気になるユーザーをフォローして、
              その人のおすすめスポットをいち早くチェック。
            </p>
          </div>

          <div className="text-center border-2 border-foreground p-6">
            <Heart className="h-8 w-8 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">発見と共有</h3>
            <p className="text-sm text-muted-foreground">
              新しい場所を発見して、
              あなたの体験を多くの人と共有しましょう。
            </p>
          </div>
        </section>

        {/* 使い方セクション */}
        <section className="border-2 border-foreground p-8 mb-16">
          <p className="section-header text-center mb-8">使い方</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-foreground text-background w-10 h-10 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <h4 className="text-lg font-bold mb-2">ログイン</h4>
              <p className="text-sm text-muted-foreground">
                簡単にログインできます
              </p>
            </div>
            <div className="text-center">
              <div className="bg-foreground text-background w-10 h-10 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <h4 className="text-lg font-bold mb-2">投稿</h4>
              <p className="text-sm text-muted-foreground">
                お気に入りの場所を記録。
                おすすめポイントも詳しく書きましょう
              </p>
            </div>
            <div className="text-center">
              <div className="bg-foreground text-background w-10 h-10 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <h4 className="text-lg font-bold mb-2">発見</h4>
              <p className="text-sm text-muted-foreground">
                他のユーザーの投稿をチェックして
                新しいスポットを発見しよう
              </p>
            </div>
          </div>
        </section>

        {/* CTA セクション */}
        <section className="text-center border-2 border-foreground p-12 bg-foreground text-background">
          <h3 className="text-2xl font-bold mb-4">
            今すぐ始めて、素敵な場所を共有しませんか？
          </h3>
          <p className="text-lg mb-8 opacity-70">
            無料で利用できます。
          </p>
          <Button size="lg" variant="outline" asChild className="border-2 border-background text-background hover:bg-background hover:text-foreground font-bold px-8">
            <a href="/api/login">
              <Star className="mr-2 h-5 w-5" />
              無料で始める
            </a>
          </Button>
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t-2 border-foreground py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <span className="text-lg font-bold tracking-wider">あしあと</span>
          <p className="text-sm text-muted-foreground mt-2">
            あなたのお気に入りの場所を記録・共有するプラットフォーム
          </p>
        </div>
      </footer>
    </div>
  );
}
