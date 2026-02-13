import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Auth() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsPending(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      await apiRequest("POST", endpoint, { email: email.trim() });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: isLogin ? "ログインしました" : "アカウントを作成しました" });
    } catch (error: any) {
      const message = error?.message || (isLogin ? "ログインに失敗しました" : "登録に失敗しました");
      toast({ title: "エラー", description: message, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center">
            <h1 className="text-xl font-bold tracking-wider">あしあと</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <h2 className="text-2xl font-bold text-center">
            {isLogin ? "ログイン" : "アカウント作成"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border-2 border-foreground bg-background text-lg"
              required
            />
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-bold tracking-wide"
              size="lg"
              disabled={isPending}
            >
              {isPending
                ? "処理中..."
                : isLogin
                ? "ログイン"
                : "アカウントを作成"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground underline hover:opacity-70 transition-opacity"
            >
              {isLogin
                ? "アカウントをお持ちでない方はこちら"
                : "すでにアカウントをお持ちの方はこちら"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
