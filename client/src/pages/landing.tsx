import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Globe, Heart } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-800 mb-6 flex items-center justify-center">
            <MapPin className="text-blue-600 mr-4 h-12 w-12" />
            おすすめスポットログ
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            あなたのお気に入りの場所を記録・共有し、他のユーザーをフォローして新しいスポットを発見しましょう
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
          >
            Replit でログイン
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <MapPin className="text-blue-600 h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">スポット記録</h3>
              <p className="text-slate-600">
                地域、タイトル、場所、おすすめ理由、タグを使ってお気に入りのスポットを詳細に記録できます
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <Users className="text-green-600 h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">フォロー機能</h3>
              <p className="text-slate-600">
                他のユーザーをフォローして、彼らがおすすめするスポットを発見しましょう
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <Globe className="text-purple-600 h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">検索・発見</h3>
              <p className="text-slate-600">
                タグやキーワードで検索して、新しいおすすめスポットを簡単に見つけることができます
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">
            みんなでスポットを共有しましょう
          </h2>
          <div className="flex items-center justify-center space-x-8 text-slate-600">
            <div className="flex items-center">
              <Heart className="text-red-500 mr-2 h-5 w-5" />
              <span>お気に入りスポットを保存</span>
            </div>
            <div className="flex items-center">
              <Users className="text-blue-500 mr-2 h-5 w-5" />
              <span>コミュニティと共有</span>
            </div>
            <div className="flex items-center">
              <MapPin className="text-green-500 mr-2 h-5 w-5" />
              <span>新しい場所を発見</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}