import fs from 'fs';
let c = fs.readFileSync('src/routes/_authenticated/orders.tsx', 'utf8');

// 1) Add imports
const OLD_IMPORTS = 'import {ReceiptText, Trash2, MessageCircle } from "lucide-react";';
const NEW_IMPORTS = 'import {ReceiptText, Trash2, MessageCircle, Star } from "lucide-react";';
c = c.split(OLD_IMPORTS).join(NEW_IMPORTS);

// 2) Add useSession import already exists, add Textarea
const OLD_BTN = 'import { Button } from "@/components/ui/button";';
const NEW_BTN = 'import { Button } from "@/components/ui/button";\nimport { Textarea } from "@/components/ui/textarea";';
c = c.split(OLD_BTN).join(NEW_BTN);

// 3) Add reviewed-vendors query after the allItems query
const ANCHOR = 'const remove = async (id: string) => {';
const ADD = `const { data: reviewedSet } = useQuery({
    queryKey: ["reviewed-vendors", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("vendor_id").eq("user_id", session!.user.id);
      return new Set((data || []).map((r: any) => r.vendor_id));
    },
  });
  const [rateFor, setRateFor] = useState<string | null>(null);
  const [rateStars, setRateStars] = useState(5);
  const [rateComment, setRateComment] = useState("");
  const submitReview = async (vendorId: string) => {
    const { error } = await supabase.from("reviews").insert({ vendor_id: vendorId, user_id: session!.user.id, rating: rateStars, comment: rateComment.trim() || null, reviewer_name: (session!.user_metadata?.full_name as string) || (session!.user.email || "buyer").split("@")[0] });
    if (error) return toast.error(error.message.includes("duplicate") ? "You already reviewed this shop - asante!" : error.message);
    setRateFor(null);
    setRateComment("");
    setRateStars(5);
    qc.invalidateQueries();
    toast.success("Review published - asante!");
  };n  `;
c = c.split(ANCHOR).join(ADD + ANCHOR);

// 4) Add inline review card to fulfilled orders
const BTN_BLOCK = '{deletable ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(o.id)}><Trash2 className="size-4" /> Delete order</Button> : null}\n              </div>\n            </div>';
const BTN_BLOCK_NEW = `{deletable ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(o.id)}><Trash2 className="size-4" /> Delete order</Button> : null}
              </div>
              {o.status === "fulfilled" && lines[0] && reviewedSet && !reviewedSet.has(lines[0].vendor_id) && (
                <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-4">
                  {rateFor !== o.id ? (
                    <button onClick={() => setRateFor(o.id)} className="flex w-full items-center justify-between text-sm font-semibold">
                      <span>Rate this trader</span>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={"size-4 " + (i <= 5 ? "fill-warning text-warning" : "text-muted-foreground/30")} />)}</div>
                    </button>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold">How was your order?</p>
                      <div className="mt-2 flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <button key={i} onClick={() => setRateStars(i)} aria-label={i + " stars"}>
                            <Star className={"size-6 " + (i <= rateStars ? "fill-warning text-warning" : "text-muted-foreground/40")} />
                          </button>
                        ))}
                      </div>
                      <Textarea className="mt-3" rows={2} value={rateComment} onChange={(e) => setRateComment(e.target.value)} placeholder="How was the service? The produce?" />
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={() => submitReview(lines[0].vendor_id)}>Publish review</Button>
                        <Button size="sm" variant="outline" onClick={() => setRateFor(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>`;
c = c.split(BTN_BLOCK).join(BTN_BLOCK_NEW);

fs.writeFileSync('src/routes/_authenticated/orders.tsx', c);
console.log('orders.tsx updated with inline review flow');