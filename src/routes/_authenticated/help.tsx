import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LifeBuoy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
export const Route = createFileRoute("/_authenticated/help")({ component: HelpDesk });
function HelpDesk() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ subject: "", message: "" });
  const { data: tickets } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: async () => {
      const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.subject.trim().length < 3) return toast.error("Give your request a short subject");
    if (form.message.trim().length < 10) return toast.error("Describe the issue a little more");
    const { error } = await supabase.from("support_tickets").insert({ subject: form.subject.trim(), message: form.message.trim() });
    if (error) return toast.error(error.message);
    toast.success("Ticket sent - we will reply soon");
    setForm({ subject: "", message: "" });
    qc.invalidateQueries({ queryKey: ["my-tickets"] });
  };
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold"><LifeBuoy className="size-7 text-accent-deep" /> Help & support</h1>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
        <Input placeholder="Subject - e.g. Payment issue, listing problem..." value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <Textarea placeholder="Tell us what happened..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <Button type="submit">Send ticket</Button>
      </form>
      <h2 className="mt-8 text-xl font-semibold">Your tickets</h2>
      <div className="mt-3 space-y-2">
        {(tickets || []).map((t: any) => (
          <div key={t.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">{t.subject}</p>
              <span className={"rounded-full px-2 py-0.5 text-xs capitalize " + (t.status === "open" ? "bg-warning/20 text-warning" : "bg-secondary")}>{t.status}</span>
            </div>
            <p className="mt-1 text-muted-foreground">{t.message}</p>
          </div>
        ))}
        {(tickets || []).length === 0 && <p className="text-sm text-muted-foreground">No tickets yet.</p>}
      </div>
    </div>
  );
}