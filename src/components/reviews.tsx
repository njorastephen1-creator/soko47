import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={"inline-flex items-center gap-0.5 " + (className || "")}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={"size-3.5 " + (i <= Math.round(value) ? "fill-warning text-warning" : "text-muted-foreground/40")} />
      ))}
    </span>
  );
}
export function ratingOf(v: any): { avg: number; count: number } {
  const count = Number(v ? v.rating_count : 0 || 0);
  const sum = Number(v ? v.rating_sum : 0 || 0);
  return { avg: count > 0 ? sum / count : 0, count };
}
export function ReviewsSection({ vendor }: { vendor: any }) {
  const { session } = useSession();
  const qc = useQueryClient();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const { data: reviews } = useQuery({
    queryKey: ["reviews", vendor.id],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("*").eq("vendor_id", vendor.id).order("created_at", { ascending: false });
      return data || [];
    },
  });
  const submit = async () => {
    if (!session) return toast.error("Sign in to leave a review");
    const { error } = await supabase.from("reviews").insert({ vendor_id: vendor.id, user_id: session.user.id, rating: stars, comment: comment.trim() || null, reviewer_name: (session.user_metadata?.full_name as string) || (session.user.email || "buyer").split("@")[0] });
    if (error) return toast.error(error.message.includes("duplicate") ? "You already reviewed this shop - asante!" : error.message);
    setComment("");
    qc.invalidateQueries();
    toast.success("Review published - asante!");
  };
  const r = ratingOf(vendor);
  return (
    <div className="mt-10">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold">Reviews {r.count > 0 ? <span className="text-sm font-normal text-muted-foreground">· {r.avg.toFixed(1)} / 5 ({r.count})</span> : null}</h2>
      {r.count > 0 ? <Stars value={r.avg} className="mt-1" /> : null}
      <div className="mt-4 rounded-3xl border border-border bg-card p-5">
        <p className="font-semibold">{session ? "Rate this trader" : "Sign in to rate this trader"}</p>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} onClick={() => setStars(i)} aria-label={i + " stars"}>
              <Star className={"size-6 " + (i <= stars ? "fill-warning text-warning" : "text-muted-foreground/40")} />
            </button>
          ))}
        </div>
        <Textarea className="mt-3" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the produce? The service? Tell other buyers..." />
        <Button className="mt-3" onClick={submit}>Publish review</Button>
      </div>
      <div className="mt-4 space-y-3">
        {(reviews || []).map((rv: any) => (
          <div key={rv.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{rv.reviewer_name}</p>
              <span className="text-xs text-muted-foreground">{new Date(rv.created_at).toLocaleDateString()}</span>
            </div>
            <Stars value={rv.rating} className="mt-1" />
            {rv.comment ? <p className="mt-2 text-sm text-muted-foreground">{rv.comment}</p> : null}
          </div>
        ))}
        {(reviews || []).length === 0 ? <p className="text-sm text-muted-foreground">No reviews yet - be the first!</p> : null}
      </div>
    </div>
  );
}
