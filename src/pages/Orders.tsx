import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react";

type OrderItem = {
  id: string;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  status: string;
};
type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  buyer_note: string | null;
  order_items: OrderItem[];
};

const statusBadge = (status: string) => {
  const map: Record<string, { icon: any; cls: string; label: string }> = {
    pending: { icon: Clock, cls: "text-amber-500 bg-amber-500/10", label: "Pending" },
    confirmed: { icon: CheckCircle, cls: "text-primary bg-primary/10", label: "Confirmed" },
    ready: { icon: Truck, cls: "text-primary bg-primary/10", label: "Ready" },
    completed: { icon: CheckCircle, cls: "text-success bg-success/10", label: "Completed" },
    cancelled: { icon: XCircle, cls: "text-destructive bg-destructive/10", label: "Cancelled" },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>
      <Icon className="h-3 w-3" /> {s.label}
    </span>
  );
};

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("orders")
        .select("id, total, status, created_at, buyer_note, order_items(id, product_name, product_image, unit_price, quantity, status)")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data as any) || []);
      setLoading(false);
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Please log in to see your orders</p>
          <button onClick={() => navigate("/auth")} className="mt-4 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold text-foreground">My Orders</h1>
        <p className="mb-6 text-sm text-muted-foreground">Track the orders you've placed.</p>

        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Start shopping
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                  </div>
                  {statusBadge(o.status)}
                </div>
                <div className="space-y-2">
                  {o.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                        {item.product_image ? (
                          <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty {item.quantity} · R{item.unit_price}
                        </p>
                      </div>
                      {statusBadge(item.status)}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-lg font-extrabold text-primary">R{Number(o.total).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
