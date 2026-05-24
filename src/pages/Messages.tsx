import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { MessageCircle, Users, Phone, Camera } from "lucide-react";

type Tab = "chats" | "status" | "communities" | "calls";

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("chats");
  const [conversations, setConversations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });
      const convos = data || [];
      setConversations(convos);
      const otherIds = Array.from(
        new Set(convos.map((c: any) => (c.buyer_id === user.id ? c.seller_id : c.buyer_id)))
      );
      if (otherIds.length) {
        const { data: pData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", otherIds as string[]);
        const map: Record<string, any> = {};
        (pData || []).forEach((p: any) => (map[p.user_id] = p));
        setProfiles(map);
      }
      setLoading(false);
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Sign in to view your chats.</p>
          <button onClick={() => navigate("/auth")} className="mt-4 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
            Sign in
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const tabs: { id: Tab; icon: any; label: string }[] = [
    { id: "chats", icon: MessageCircle, label: "Chats" },
    { id: "status", icon: Camera, label: "Status" },
    { id: "communities", icon: Users, label: "Communities" },
    { id: "calls", icon: Phone, label: "Calls" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="border-b border-border bg-card">
        <div className="container mx-auto flex max-w-2xl gap-1 px-2">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-1 border-b-2 px-3 py-3 text-xs font-semibold transition-colors ${
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="container mx-auto max-w-2xl px-4 py-4">
        {tab === "chats" && (
          loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
              No chats yet. Open a product and tap "Message seller" to start a conversation.
            </p>
          ) : (
            <ul className="space-y-2">
              {conversations.map((c: any) => {
                const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
                const p = profiles[otherId];
                return (
                  <li key={c.id}>
                    <Link
                      to={`/chat/${c.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-secondary"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                        {(p?.full_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{p?.full_name || "User"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {new Date(c.last_message_at).toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )
        )}
        {tab !== "chats" && (
          <p className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
            {tab.charAt(0).toUpperCase() + tab.slice(1)} coming soon.
          </p>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Messages;