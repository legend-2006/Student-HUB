import { useState } from "react";
import {
  Package,
  Wrench,
  ImagePlus,
  ArrowLeft,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const productCategories = [
  "Fashion",
  "Books",
  "Electronics",
  "Accessories",
  "Dorm Essentials",
  "Food & Snacks",
];
const serviceCategories = [
  "Hair",
  "Tutoring",
  "Photography",
  "Repairs",
  "Food",
  "Design",
  "Other",
];

type ListingKind = "product" | "service";

interface Props {
  onPublished: () => void;
  onClose?: () => void;
}

const MAX_IMAGES = 4;

const GuidedListingFlow = ({ onPublished, onClose }: Props) => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<ListingKind | null>(null);

  // Images (multiple, first is primary)
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);

  // Shared
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  // Product-only
  const [costPrice, setCostPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [delivers, setDelivers] = useState(false);

  // Service-only
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setStep(0);
    setKind(null);
    setImages([]);
    setName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setLocation("");
    setCostPrice("");
    setStockQuantity("1");
    setDelivers(false);
    setPhone("");
    setWhatsapp("");
    setDone(false);
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} photos`);
      return;
    }
    const next: { file: File; preview: string }[] = [];
    files.slice(0, room).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is over 5MB`);
        return;
      }
      next.push({ file, preview: URL.createObjectURL(file) });
    });
    setImages((p) => [...p, ...next]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadImages = async () => {
    if (!user || images.length === 0) return null;
    // Upload only the primary image (DB stores a single image_url)
    const first = images[0].file;
    const ext = first.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(filePath, first);
    if (error) throw error;
    return supabase.storage.from("product-images").getPublicUrl(filePath).data
      .publicUrl;
  };

  const canAdvance = (): boolean => {
    if (step === 0) return kind !== null;
    if (step === 1) return images.length > 0; // require ≥1 photo per mockup
    if (step === 2) {
      if (!name.trim() || !category) return false;
      if (kind === "product" && !price.trim()) return false;
      return true;
    }
    return true;
  };

  const handlePublish = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    setSubmitting(true);
    try {
      const imageUrl = await uploadImages();
      if (kind === "product") {
        const { error } = await (supabase as any).from("products").insert({
          seller_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          price: parseFloat(price),
          cost_price: parseFloat(costPrice || "0"),
          stock_quantity: Math.max(0, parseInt(stockQuantity || "0", 10)),
          units_sold: 0,
          category,
          location: location.trim() || null,
          delivers,
          image_url: imageUrl,
          listing_type: "product",
          approval_status: "pending",
          is_active: true,
        });
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("service_listings")
          .insert({
            seller_id: user.id,
            title: name.trim(),
            description: description.trim() || null,
            category,
            price: price ? parseFloat(price) : null,
            location: location.trim() || null,
            phone: phone.trim() || profile?.phone || null,
            whatsapp: whatsapp.trim() || profile?.whatsapp || null,
            image_url: imageUrl,
            approval_status: "pending",
            is_active: true,
          });
        if (error) throw error;
      }
      onPublished();
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || "Could not publish");
    } finally {
      setSubmitting(false);
    }
  };

  const categories = kind === "service" ? serviceCategories : productCategories;
  const totalSteps = 4;

  // Success screen
  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="relative mx-auto h-24 w-24">
          <div className="absolute inset-0 animate-ping rounded-full bg-success/20" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-success">
            <CheckCircle2 className="h-12 w-12 text-success-foreground" strokeWidth={2.5} />
          </div>
          <PartyPopper className="absolute -right-2 -top-2 h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-foreground">
          Listing submitted!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your listing is pending approval from admin.
        </p>
        <p className="text-sm text-muted-foreground">
          You'll be notified once it goes live.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose?.();
            }}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to My Listings
          </button>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl border border-border bg-background py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  const stepTitles = [
    "Choose what you want to list",
    "Add photos of your item",
    "Add details",
    "Review your listing",
  ];
  const stepSubs = [
    "You can sell products or offer services.",
    "Upload at least one clear photo.",
    "Tell buyers more about your item.",
    "Check everything before publishing.",
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (step === 0 ? onClose?.() : setStep((s) => s - 1))}
          disabled={submitting}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-foreground">Create Listing</h1>
      </div>

      {/* Progress */}
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Step {step + 1} of {totalSteps}
      </p>
      <div className="mb-6 flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      {/* Title block */}
      <h2 className="text-2xl font-bold text-foreground">{stepTitles[step]}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{stepSubs[step]}</p>

      {/* Step 0 — pick type */}
      {step === 0 && (
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => setKind("product")}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
              kind === "product"
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-foreground">Product</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Sell physical items like books, gadgets, clothes, etc.
              </p>
            </div>
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                kind === "product"
                  ? "border-primary bg-primary"
                  : "border-border"
              }`}
            >
              {kind === "product" && (
                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setKind("service")}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
              kind === "service"
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-foreground">Service</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Offer your skills or services like tutoring, photography, etc.
              </p>
            </div>
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                kind === "service"
                  ? "border-primary bg-primary"
                  : "border-border"
              }`}
            >
              {kind === "service" && (
                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              )}
            </div>
          </button>
        </div>
      )}

      {/* Step 1 — images */}
      {step === 1 && (
        <div className="mt-6">
          {images.length === 0 ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary/30 py-16 transition-colors hover:border-primary/60 hover:bg-secondary/60">
              <ImagePlus className="mb-3 h-10 w-10 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Tap to upload
              </span>
              <span className="text-xs text-muted-foreground">
                or drag and drop
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                className="hidden"
              />
            </label>
          ) : (
            <>
              <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-6">
                <div className="mx-auto flex h-32 w-full max-w-xs items-center justify-center rounded-lg bg-secondary/60">
                  <img
                    src={images[0].preview}
                    alt="Primary"
                    className="h-full w-full rounded-lg object-cover"
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary"
                  >
                    <img
                      src={img.preview}
                      alt={`Photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-background transition-colors hover:border-primary hover:bg-secondary/40">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2 — details */}
      {step === 2 && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                kind === "product"
                  ? "e.g. Casio Calculator fx-82ZA"
                  : "e.g. Maths tutor"
              }
              maxLength={120}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Price (R) {kind === "product" ? "*" : "(optional)"}
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Description {kind === "product" ? "*" : ""}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell buyers more about it..."
              rows={4}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {kind === "product" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Cost price (R)
                </label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Stock qty
                </label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="1"
                  min="0"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              {kind === "product" ? "Pickup location" : "Where you operate"}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. CPUT Bellville"
              maxLength={120}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {kind === "product" && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
              <input
                type="checkbox"
                checked={delivers}
                onChange={(e) => setDelivers(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <span className="text-sm text-foreground">
                I offer delivery on campus
              </span>
            </label>
          )}

          {kind === "service" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={profile?.phone || "0XX XXX XXXX"}
                  maxLength={20}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder={profile?.whatsapp || "0XX XXX XXXX"}
                  maxLength={20}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3 — review */}
      {step === 3 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
              {images[0] ? (
                <img
                  src={images[0].preview}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No photo
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-bold text-foreground">
                {name || "Untitled"}
              </h3>
              {price && (
                <p className="text-sm font-semibold text-foreground">R{price}</p>
              )}
              <span className="mt-1 inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                {category || "No category"}
              </span>
            </div>
          </div>

          {description && (
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs font-semibold text-muted-foreground">
                Description
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                {description}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">
                Type
              </p>
              <span className="text-sm font-semibold text-foreground">
                {kind === "product" ? "Product" : "Service"}
              </span>
            </div>
            {kind === "product" && (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">
                  Stock
                </p>
                <span className="text-sm font-semibold text-foreground">
                  {stockQuantity || 0}
                  {delivers ? " · Delivers" : ""}
                </span>
              </div>
            )}
            {location && (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">
                  Location
                </p>
                <span className="text-sm font-semibold text-foreground">
                  {location}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Primary action */}
      <div className="mt-8">
        {step < totalSteps - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
              </>
            ) : (
              "Publish Listing"
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default GuidedListingFlow;
