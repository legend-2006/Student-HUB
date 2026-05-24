import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Package, Clock, CheckCircle, XCircle, Truck, Phone, MessageCircle, MapPin, Inbox } from "lucide-react";

type IncomingItem = {
  id: string;
  order_id: string;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  status: string;
  created_at: string;
  orders: {
    id: string;
    buyer_name: string;
    buyer_phone: string | null;
    buyer_whatsapp: string | null;
    buyer_campus: string | null;
    buyer_note: string | null;
    created_at: string;
  } | null;
};

const STATUSES = ["pending", "confirmed", "ready", "completed", "cancelled"] as const;
type Status = typeof STATUSES[number];

const statusStyle = (status: string) => {
  const map: Record<string, { icon: any; cls: string }> = {
    pending: { icon: Clock, cls: "text-amber-500 bg-amber-500/10" },
    confirmed: { icon: CheckCircle, cls: "text-primary bg-primary/10" },
    ready: { icon: Truck, cls: "text-primary bg-primary/10" },
    completed: { icon: CheckCircle, cls: "text-success bg-success/10" },
    cancelled: { icon: XCircle, cls: "text-destructive bg-destructive/10" },
  };
  return map[status] || map.pending;
};

const SellerOrders = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<IncomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("order_items")
      .select(`
        id, order_id, product_name, product_image, unit_price, quantity, status, created_at,
        orders ( id, buyer_name, buyer_phone, buyer_whatsapp, buyer_campus, buyer_note, created_at )
      `)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateStatus = async (item: IncomingItem, status: Status) => {
    setUpdatingId(item.id);
    const { error } = await (supabase as any)
      .from("order_items")
      .update({ status })
      .eq("id", item.id);
    if (error) {
      toast.error("Could not update");
      setUpdatingId(null);
      return;
    }
    toast.success(`Marked as ${status}`);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)));
    setUpdatingId(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Please sign in.</p>
          <button onClick={() => navigate("/auth")} className="mt-4 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (role !== "seller" && role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-md px-4 py-20 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Sellers only</h1>
          <p className="mt-2 text-sm text-muted-foreground">Become a seller to receive and manage orders.</p>
        </div>
      </div>
    );
  }

  const filtered = items.filter((i) => (filter === "all" ? true : i.status === filter));
  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 py-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Inbox className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Incoming Orders</h1>
            <p className="text-xs text-muted-foreground">{pendingCount} new to action</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["pending", "confirmed", "ready", "completed", "cancelled", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No orders here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const s = statusStyle(item.status);
              const StatusIcon = s.icon;
              const buyer = item.orders;
              const waNumber = (buyer?.buyer_whatsapp || "").replace(/\D/g, "");
              return (
                <div key={item.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Order #{item.order_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${s.cls}`}>
                      <StatusIcon className="h-3 w-3" /> {item.status}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-3">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-foreground">{item.product_name}</h3>
                      <p className="text-xs text-muted-foreground">Qty {item.quantity} · R{item.unit_price}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        Subtotal R{(item.unit_price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {buyer && (
                    <div className="mt-3 rounded-xl bg-secondary/40 p-3">
                      <p className="text-xs font-bold text-foreground">{buyer.buyer_name}</p>
                      {buyer.buyer_campus && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {buyer.buyer_campus}
                        </p>
                      )}
                      {buyer.buyer_note && (
                        <p className="mt-1 text-xs italic text-muted-foreground">"{buyer.buyer_note}"</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {buyer.buyer_phone && (
                          <a
                            href={`tel:${buyer.buyer_phone}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                          >
                            <Phone className="h-3 w-3" /> Call
                          </a>
                        )}
                        {waNumber && (
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/20"
                          >
                            <MessageCircle className="h-3 w-3" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {STATUSES.filter((s) => s !== item.status).map((s) => (
                      <button
                        key={s}
                        disabled={updatingId === item.id}
                        onClick={() => updateStatus(item, s)}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold capitalize text-foreground hover:bg-secondary disabled:opacity-60"
                      >
                        Mark {s}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SellerOrders;
