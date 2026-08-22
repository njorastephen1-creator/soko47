import fs from 'fs';
const f = 'src/routes/_authenticated/chat.$vendorId.$buyerId.tsx';
let c = fs.readFileSync(f, 'utf8');
let n = 0;
if (!c.includes('otherTyping')) {
  c = c.split('  const [fullPhoto, setFullPhoto] = useState<string | null>(null);').join('  const [fullPhoto, setFullPhoto] = useState<string | null>(null);\n  const [otherTyping, setOtherTyping] = useState(false);\n  const chanRef = useRef<any>(null);\n  const lastTyping = useRef(0);\n  const typingTimer = useRef<any>(null);');
  c = c.split('  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs]);').join(`  useEffect(() => {
    if (!session) return;
    const chan = supabase.channel("typing-" + vendorId + "-" + buyerId);
    chan.on("broadcast", { event: "typing" }, (msg: any) => {
      if (msg.payload && msg.payload.from !== session.user.id) {
        setOtherTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setOtherTyping(false), 2500);
      }
    });
    chan.subscribe();
    chanRef.current = chan;
    return () => { supabase.removeChannel(chan); };
  }, [vendorId, buyerId, session]);
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs]);`);
  c = c.split('onChange={(e) => setBody(e.target.value)}').join('onChange={(e) => { setBody(e.target.value); const now = Date.now(); if (now - lastTyping.current > 1000) { lastTyping.current = now; if (chanRef.current) chanRef.current.send({ type: "broadcast", event: "typing", payload: { from: session.user.id } }); } }}');
  c = c.split('{selectedMsg ? (isMine ? "Your message selected" : "Their message selected") : (onlineNow ? "online" : (otherLastSeen ? "last seen " + new Date(otherLastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Long-press / right-click a message"))}').join('{selectedMsg ? (isMine ? "Your message selected" : "Their message selected") : (otherTyping ? "typing..." : (onlineNow ? "online" : (otherLastSeen ? "last seen " + new Date(otherLastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Long-press / right-click a message"))}');
  n++;
  fs.writeFileSync(f, c);
}
console.log('DONE:', n, 'typing indicator + read receipts unblocked');