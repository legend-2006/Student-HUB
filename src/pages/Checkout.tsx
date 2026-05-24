import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CartItemWithProduct {
  id: string;
  quantity: number;
  product_id: string;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    seller_id: string;
  };
}

const Checkout = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [campus, setCampus] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("cart_items")
        .select("id, quantity, product_id, products(id, name, price, image_url, seller_id)")
        .eq("user_id", user.id);
      setItems((data as any) || []);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
      setWhatsapp(profile.whatsapp || "");
      setCampus(profile.campus || "");
    }
  }, [profile]);

  const total = items.reduce((sum, i) => sum + (i.products?.price || 0) * i.quantity, 0);

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone.trim() && !whatsapp.trim()) {
      toast.error("Provide a phone or WhatsApp so the seller can reach you");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setSubmitting(true);

    const { data: order, error: orderErr } = await (supabase as any)
      .from("orders")
      .insert({
        buyer_id: user.id,
        buyer_name: name.trim(),
        buyer_phone: phone.trim() || null,
        buyer_whatsapp: whatsapp.trim() || null,
        buyer_campus: campus.trim() || null,
        buyer_note: note.trim() || null,
        total,
        status: "pending",
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error("Order insert error:", orderErr);
      toast.error(orderErr?.message || "Could not create order");
      setSubmitting(false);
      return;
    }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      seller_id: i.products.seller_id,
      product_name: i.products.name,
      product_image: i.products.image_url,
      unit_price: i.products.price,
      quantity: i.quantity,
      status: "pending",
    }));

    const { error: itemsErr } = await (supabase as any).from("order_items").insert(orderItems);
    if (itemsErr) {
      console.error("Order items insert error:", itemsErr);
      toast.error(itemsErr?.message || "Could not save order items");
      setSubmitting(false);
      return;
    }

    // Clear cart
    await supabase.from("cart_items").delete().eq("user_id", user.id);

    toast.success("Order placed! Sellers have been notified.");
    setSubmitting(false);
    navigate("/orders");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">Please log in to checkout</p>
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
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to cart
        </button>

        <h1 className="mb-1 text-2xl font-bold text-foreground">Checkout</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Confirm your contact details so the seller can reach you to arrange payment & collection.
        </p>

        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Browse products
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-bold text-foreground">Order summary</h2>
              <div className="space-y-2.5">
                {items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {i.products?.image_url ? (
                        <img src={i.products.image_url} alt={i.products.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{i.products?.name}</p>
                      <p className="text-xs text-muted-foreground">Qty {i.quantity} · R{i.products?.price}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">R{((i.products?.price || 0) * i.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-xl font-extrabold text-primary">R{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-1 text-sm font-bold text-foreground">Your contact details</h2>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0XX XXX XXXX"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">WhatsApp</label>
                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0XX XXX XXXX"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Campus / location</label>
                <input
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Note for seller (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Preferred pickup time, delivery address, etc."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Place order · R{total.toFixed(2)}
                </>
              )}
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              No payment is taken now. The seller will contact you to arrange payment & collection.
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default Checkout;
