import { Link } from "@tanstack/react-router";
import { useMyVendor } from "@/lib/my-vendor";
import { BarChart3, Store } from "lucide-react";
export function VendorBar() {
  const { vendor } = useMyVendor();
  if (!vendor) return null;
  return (
    <div className="border-t border-primary/20 bg-primary/5">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 text-xs font-semibold">
        <span className="shrink-0 text-muted-foreground">Seller tools:</span>
        <Link to="/vendor" className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1 text-primary-foreground"><Store className="size-3.5" /> Shop dashboard</Link>
        <Link to="/pos" className="shrink-0 rounded-full bg-secondary px-3 py-1">POS & Receipts</Link>
        <Link to="/chats" className="shrink-0 rounded-full bg-secondary px-3 py-1">Customer chats</Link>
        <Link to="/profile" className="shrink-0 rounded-full bg-secondary px-3 py-1">My profile</Link>
        {vendor.subscription_plan === "pro" ? <Link to="/pro" className="flex shrink-0 items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-accent-deep"><BarChart3 className="size-3.5" /> Pro Studio</Link> : null}
      </div>
    </div>
  );
}
