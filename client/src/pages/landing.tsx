import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Heart, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1eee9' }}>
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="text-[#fb5722] mr-3 h-8 w-8" />
              <h1 className="text-3xl font-bold text-slate-800">
                あしあと
              </h1>
            </div>
            <Button asChild>
              <a href="/api/login" className="bg-[#fb5722] hover:bg-[#e74c20] text-white">
                ログインして始める
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* ヒーローセクション */}
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold text-slate-800 mb-6">
            あなたの
            <span className="text-[#fb5722]">お気に入りの場所</span>
            を
            <br />
            みんなと共有しましょう
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            素敵な場所を発見したら、写真と一緒に投稿。
            友達のおすすめスポットもチェックして、新しい発見を楽しもう。
          </p>
          <Button size="lg" asChild className="bg-[#fb5722] hover:bg-[#e74c20] text-white px-8 py-4 text-lg">
            <a href="/api/login">
              <MapPin className="mr-2 h-5 w-5" />
              今すぐ始める
            </a>
          </Button>
        </section>

        {/* 機能紹介セクション */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="mx-auto bg-#feb8a0 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-[#fb5722]" />
              </div>
              <CardTitle className="text-xl text-slate-800">スポット投稿</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                お気に入りの場所を写真と一緒に投稿。
                地域、場所、おすすめポイントを詳しく記録できます。
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-slate-800">フォロー機能</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                気になるユーザーをフォローして、
                その人のおすすめスポットをいち早くチェック。
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="mx-auto bg-purple-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-slate-800">発見と共有</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                新しい場所を発見して、
                あなたの体験を多くの人と共有しましょう。
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 使い方セクション */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-16">
          <h3 className="text-3xl font-bold text-slate-800 text-center mb-8">
            使い方はとても簡単
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-[#fb5722] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">ログイン</h4>
              <p className="text-slate-600">
                Google、GitHub、またはメールアドレスで
                簡単にログインできます
              </p>
            </div>
            <div className="text-center">
              <div className="bg-[#fb5722] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">投稿</h4>
              <p className="text-slate-600">
                お気に入りの場所を写真と一緒に投稿。
                おすすめポイントも詳しく書きましょう
              </p>
            </div>
            <div className="text-center">
              <div className="bg-[#fb5722] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">発見</h4>
              <p className="text-slate-600">
                他のユーザーの投稿をチェックして
                新しいスポットを発見しよう
              </p>
            </div>
          </div>
        </section>

        {/* CTA セクション */}
        <section className="text-center bg-[#fb5722] text-white rounded-lg p-12">
          <h3 className="text-3xl font-bold mb-4">
            今すぐ始めて、素敵な場所を共有しませんか？
          </h3>
          <p className="text-xl text-#feb8a0 mb-8">
            無料で利用できます。アカウント作成も簡単です。
          </p>
          <Button size="lg" variant="secondary" asChild className="bg-white text-[#fb5722] hover:bg-slate-50 px-8 py-4 text-lg">
            <a href="/api/login">
              <Star className="mr-2 h-5 w-5" />
              無料で始める
            </a>
          </Button>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-slate-800 text-slate-300 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="text-#fb8c69 mr-2 h-6 w-6" />
            <span className="text-lg font-semibold">あしあと</span>
          </div>
          <p className="text-sm">
            あなたのお気に入りの場所を記録・共有するプラットフォーム
          </p>
        </div>
      </footer>
    </div>
  );
}