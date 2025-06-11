import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-slate-300">404</h1>
          <h2 className="text-2xl font-semibold text-slate-700 mt-4">
            ページが見つかりません
          </h2>
          <p className="text-slate-500 mt-2">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
        </div>
        
        <div className="space-x-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              <MapPin className="mr-2 h-4 w-4" />
              ホーム
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
