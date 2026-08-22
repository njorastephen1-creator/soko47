import { Link } from "@tanstack/react-router";
import { useMyVendor } from "@/lib/my-vendor";
export function VendorBar() {
  const { vendor } = useMyVendor();
  if (!vendor) return null;
  return (
    <div className="bg-primary">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 text-xs font-semibold">
        <span className="shrink-0 text-white/70">Seller tools:</span>
        <Link to="/vendor" className="shrink-0 cursor-pointer rounded-full bg-white px-3 py-1 text-primary">Shop dashboard</Link>
        <Link to="/pos" className="shrink-0 cursor-pointer rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/25">POS & Receipts</Link>
        <Link to="/chats" className="shrink-0 cursor-pointer rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/25">Customer chats</Link>
        <Link to="/profile" className="shrink-0 cursor-pointer rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/25">My profile</Link>
        {vendor.subscription_plan === "pro" ? <Link to="/pro" className="shrink-0 cursor-pointer rounded-full bg-accent px-3 py-1 text-white">Pro Studio</Link> : null}
      </div>
    </div>
  );
}
