import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
  reviewer_name?: string;
}

interface ReviewSectionProps {
  productId: string;
  sellerId: string;
}

const ReviewSection = ({ productId, sellerId }: ReviewSectionProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOwnProduct = user?.id === sellerId;
  const hasReviewed = reviews.some((r) => r.reviewer_id === user?.id);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (data) {
        const reviewerIds = [...new Set(data.map((r) => r.reviewer_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", reviewerIds);

        const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
        setReviews(
          data.map((r) => ({ ...r, reviewer_name: nameMap.get(r.reviewer_id) || "Anonymous" }))
        );
      }
      setLoading(false);
    };
    fetchReviews();
  }, [productId]);

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in to leave a review"); return; }
    if (newRating === 0) { toast.error("Please select a rating"); return; }

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      seller_id: sellerId,
      reviewer_id: user.id,
      rating: newRating,
      comment: newComment.trim() || null,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Review submitted! ⭐");
      setNewRating(0);
      setNewComment("");
      // Refetch
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (data) {
        const reviewerIds = [...new Set(data.map((r) => r.reviewer_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", reviewerIds);
        const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
        setReviews(data.map((r) => ({ ...r, reviewer_name: nameMap.get(r.reviewer_id) || "Anonymous" })));
      }
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <span className="text-lg font-bold text-foreground">{avgRating}</span>
            <span className="text-sm text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
          </div>
        )}
      </div>

      {/* Write a review */}
      {user && !isOwnProduct && !hasReviewed && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Leave a review</h3>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    star <= (hoverRating || newRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/60 stroke-current"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            placeholder="Share your experience (optional)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || newRating === 0}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {review.reviewer_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                  <span className="text-sm font-medium text-foreground">{review.reviewer_name}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;