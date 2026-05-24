import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ReviewSection from "@/components/ReviewSection";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Truck,
  TruckIcon,
} from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const { data: prod } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (prod) {
        setProduct(prod);
        const { data: sellerProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", prod.seller_id)
          .single();
        setSeller(sellerProfile);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please log in to add items to cart");
      navigate("/auth");
      return;
    }
    setAddingToCart(true);
    try {
      const { error } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1,
      });
      if (error) throw error;
      toast.success("Added to cart! 🛒");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingToCart(false);
    }
  };

  const openWhatsApp = () => {
    if (!seller?.whatsapp && !seller?.phone) {
      toast.error("Seller has no WhatsApp number");
      return;
    }
    const num = (seller.whatsapp || seller.phone).replace(/\D/g, "");
    const formattedNum = num.startsWith("0") ? "27" + num.slice(1) : num;
    const msg = encodeURIComponent(`Hi! I'm interested in your "${product.name}" listed on Student Hub for R${product.price}.`);
    window.open(`https://wa.me/${formattedNum}?text=${msg}`, "_blank");
  };

  const openChat = async () => {
    if (!user) {
      toast.error("Please sign in to chat");
      navigate("/auth");
      return;
    }
    if (user.id === product.seller_id) {
      toast.error("That's your own listing");
      return;
    }
    const { data: subData } = await (supabase as any).rpc("is_seller_subscribed", {
      _seller_id: product.seller_id,
    });
    if (!subData) {
      toast.error("This seller doesn't have an active subscription for in-app chat. Use WhatsApp instead.");
      return;
    }
    const { data: existing } = await (supabase as any)
      .from("conversations")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("seller_id", product.seller_id)
      .eq("product_id", product.id)
      .maybeSingle();
    if (existing?.id) {
      navigate(`/chat/${existing.id}`);
      return;
    }
    const { data: created, error } = await (supabase as any)
      .from("conversations")
      .insert({ buyer_id: user.id, seller_id: product.seller_id, product_id: product.id })
      .select()
      .single();
    if (error || !created) {
      toast.error("Could not start chat");
      return;
    }
    navigate(`/chat/${created.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Product not found</p>
          <button onClick={() => navigate("/")} className="mt-4 text-primary hover:underline">
            Go back to browse
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

        <div className="grid gap-8 md:grid-cols-2">
          {/* Product Image */}
          <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover aspect-square"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {product.category}
              </span>
              <h1 className="mt-3 text-3xl font-bold text-foreground">{product.name}</h1>
              <p className="mt-2 text-3xl font-extrabold text-primary">R{product.price}</p>
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Delivery info */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-3">
              {product.delivers ? (
                <>
                  <Truck className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium text-success">Delivery available</span>
                </>
              ) : (
                <>
                  <TruckIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Collection only</span>
                </>
              )}
              {product.location && (
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {product.location}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <ShoppingCart className="h-5 w-5" />
                {addingToCart ? "Adding..." : "Add to Cart"}
              </button>

              <button
                onClick={openWhatsApp}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-success bg-success/10 py-3.5 text-sm font-bold text-success transition-colors hover:bg-success/20"
              >
                <MessageCircle className="h-5 w-5" />
                Contact on WhatsApp
              </button>

              <button
                onClick={openChat}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary bg-primary/10 py-3.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
              >
                <MessageSquare className="h-5 w-5" />
                Message seller in-app
              </button>
            </div>

            {/* Seller Info */}
            {seller && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground">Seller Details</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {seller.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                    <span className="font-medium">{seller.full_name}</span>
                  </p>
                  {seller.email && (
                    <a href={`mailto:${seller.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                      <Mail className="h-4 w-4" /> {seller.email}
                    </a>
                  )}
                  {seller.phone && (
                    <a href={`tel:${seller.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                      <Phone className="h-4 w-4" /> {seller.phone}
                    </a>
                  )}
                  {seller.location && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {seller.location}
                    </p>
                  )}
                  {seller.delivers && (
                    <p className="flex items-center gap-2 text-success">
                      <Truck className="h-4 w-4" /> Offers delivery
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <ReviewSection productId={product.id} sellerId={product.seller_id} />
      </main>
    </div>
  );
};

export default ProductDetail;
