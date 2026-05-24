import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
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
    category: string;
  };
}

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("cart_items")
      .select("id, quantity, product_id, products(id, name, price, image_url, category)")
      .eq("user_id", user.id);
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const removeItem = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    setItems(items.filter((i) => i.id !== id));
    toast.success("Removed from cart");
  };

  const total = items.reduce((sum, item) => sum + (item.products?.price || 0) * item.quantity, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">Please log in to view your cart</p>
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
      <main className="container mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="mb-6 text-2xl font-bold text-foreground">Your Cart</h1>

        {loading ? (
          <div className="py-20 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-lg text-muted-foreground">Your cart is empty</p>
            <button onClick={() => navigate("/")} className="mt-4 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                <div className="h-20 w-20 overflow-hidden rounded-lg bg-secondary">
                  {item.products?.image_url ? (
                    <img src={item.products.image_url} alt={item.products.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No img</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className="font-semibold text-foreground cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/product/${item.product_id}`)}
                  >
                    {item.products?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.products?.category}</p>
                  <p className="mt-1 text-lg font-bold text-primary">R{item.products?.price}</p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between text-lg">
                <span className="font-medium text-foreground">Total</span>
                <span className="text-2xl font-extrabold text-primary">R{total.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Contact sellers directly to arrange payment & collection</p>
              <button
                onClick={() => navigate("/checkout")}
                className="mt-4 w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Place Order
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
