import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [convo, setConvo] = useState<any>(null);
  const [other, setOther] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: c } = await (supabase as any).from("conversations").select("*").eq("id", id).single();
      if (!c) {
        toast.error("Conversation not found");
        navigate("/messages");
        return;
      }
      setConvo(c);
      const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", otherId).single();
      setOther(p);
      const { data: msgs } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      setMessages(msgs || []);
    })();
  }, [id, user, navigate]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => (prev.find((m) => m.id === (payload.new as any).id) ? prev : [...prev, payload.new]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body || !user || !id) return;
    setSending(true);
    const { error } = await (supabase as any).from("messages").insert({
      conversation_id: id,
      sender_id: user.id,
      body,
    });
    if (error) {
      toast.error("Could not send. The seller may not have an active subscription.");
      setSending(false);
      return;
    }
    await (supabase as any).from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
    setText("");
    setSending(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Sign in to chat.</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button onClick={() => navigate("/messages")} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {(other?.full_name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{other?.full_name || "User"}</p>
          {other?.campus && <p className="truncate text-xs text-muted-foreground">{other.campus}</p>}
        </div>
      </div>

      <main className="container mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4">
        <div className="flex-1 space-y-2 overflow-y-auto pb-4">
          {messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-card border border-border text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background py-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Type a message"
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Chat;