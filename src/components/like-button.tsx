import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
export function LikeButton({ productId, likes = 0, className = "" }: { productId: string; likes?: number; className?: string }) {
  const { session } = useSession();
  const qc = useQueryClient();
  const { data: liked } = useQuery({
    queryKey: ["like", productId, session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("product_likes").select("product_id").eq("user_id", session!.user.id).eq("product_id", productId).maybeSingle();
      return !!data;
    },
  });
  const toggle = async () => {
    if (!session) return toast.error("Sign in to like products");
    if (liked) {
      await supabase.from("product_likes").delete().eq("user_id", session.user.id).eq("product_id", productId);
    } else {
      const { error } = await supabase.from("product_likes").insert({ user_id: session.user.id, product_id: productId });
      if (error) return toast.error(error.message);
      toast.success("Added to your likes");
    }
    qc.invalidateQueries({ queryKey: ["like", productId] });
  };
  return (
    <button onClick={toggle} aria-label="Like product" className={"flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1.5 text-xs font-medium shadow-soft transition-transform hover:scale-105 " + (liked ? "text-destructive" : "text-muted-foreground") + " " + className}>
      <Heart className={"size-4 " + (liked ? "fill-current" : "")} />{likes > 0 ? " " + likes : ""}
    </button>
  );
}