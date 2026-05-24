import { useState } from "react";
import { Store, Scissors, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const BecomeSellerCTA = () => {
  const { user, role, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Already a seller — don't show the CTA.
  if (role === "seller") return null;

  const handleBecomeSeller = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "seller" });
      if (error && !error.message.toLowerCase().includes("duplicate")) {
        throw error;
      }
      await refreshProfile();
      toast.success("You're now a seller on Student Hub!");
      navigate("/sell");
    } catch (err: any) {
      toast.error(err.message || "Could not switch to seller");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="become-seller" className="my-10 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Store className="h-5 w-5" />
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Scissors className="h-5 w-5" />
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground sm:text-2xl">
            Sell a product or offer a service
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell Student Hub you sell items (clothes, books, snacks) or run a campus service
            (hair, tutoring, photography). You'll unlock the Seller Hub to upload listings.
          </p>
        </div>
        <button
          onClick={handleBecomeSeller}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Store className="h-4 w-4" />
          )}
          {user ? "I sell or offer a service" : "Sign in to start selling"}
        </button>
      </div>
    </section>
  );
};

export default BecomeSellerCTA;