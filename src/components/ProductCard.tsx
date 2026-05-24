import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Phone, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    category: string;
    location?: string | null;
    delivers?: boolean | null;
    seller_id?: string;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();

  const [sellerCache, setSellerCache] = useState<{ whatsapp: string | null; phone: string | null } | null>(null);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);

  useEffect(() => {
    if (!product.seller_id) return;
    supabase
      .from("reviews")
      .select("rating")
      .eq("seller_id", product.seller_id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
          setRating({ avg: Math.round(avg * 10) / 10, count: data.length });
        }
      });
  }, [product.seller_id]);

  const fetchSeller = async () => {
    if (sellerCache) return sellerCache;
    if (!product.seller_id) return null;
    const { data } = await supabase
      .from("profiles")
      .select("whatsapp, phone")
      .eq("user_id", product.seller_id)
      .single();
    if (data) setSellerCache(data);
    return data;
  };

  const handleWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const seller = await fetchSeller();
    const num = seller?.whatsapp || seller?.phone;
    if (!num) { toast.error("Seller has no WhatsApp number"); return; }
    const cleaned = num.replace(/\D/g, "");
    const formatted = cleaned.startsWith("0") ? "27" + cleaned.slice(1) : cleaned;
    const msg = encodeURIComponent(
      `Hi! I'm interested in your "${product.name}" listed on Student Hub for R${product.price}.`
    );
    window.open(`https://wa.me/${formatted}?text=${msg}`, "_blank");
  };

  const handleCall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const seller = await fetchSeller();
    const num = seller?.phone || seller?.whatsapp;
    if (!num) { toast.error("Seller has no phone number"); return; }
    window.open(`tel:${num}`, "_self");
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-medium text-primary">{product.category}</p>
        <h3 className="mt-1 font-semibold text-foreground line-clamp-1">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">R{product.price}</span>
          <div className="flex items-center gap-1">
            {rating ? (
              <>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-foreground">{rating.avg}</span>
                <span className="text-xs text-muted-foreground">({rating.count})</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No reviews</span>
            )}
          </div>
        </div>
        {product.delivers && (
          <span className="mt-1 inline-block text-xs text-success font-medium">🚚 Delivers</span>
        )}
        <div className="mt-3 flex gap-2">
          <button className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            View Details
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-success bg-success/10 px-3 py-2.5 text-sm font-semibold text-success transition-colors hover:bg-success/20"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            onClick={handleCall}
            className="flex items-center justify-center rounded-lg border-2 border-primary bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <Phone className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
