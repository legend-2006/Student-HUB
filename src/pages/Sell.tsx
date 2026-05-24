import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import GuidedListingFlow from "@/components/GuidedListingFlow";
import {
  Trash2,
  Clock,
  CheckCircle,
  Package,
  Wrench,
  Plus,
  ArrowLeft,
  ListChecks,
  Boxes,
  LineChart,
  Crown,
  Sparkles,
  Lock,
  ShieldCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

type View = "hub" | "create" | "listings" | "stock" | "analytics" | "plans";

const Sell = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [view, setView] = useState<View>("hub");
  const [tab, setTab] = useState<"all" | "pending" | "active" | "sold">("all");
  const [activeTier, setActiveTier] = useState<"free" | "basic" | "premium">("free");

  const fetchMyProducts = async () => {
    if (!user) return;
    setLoadingProducts(true);
    const [{ data: products }, { data: services }] = await Promise.all([
      (supabase as any)
        .from("products")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false }),
      (supabase as any)
        .from("service_listings")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setMyProducts(products || []);
    setMyServices(services || []);
    setLoadingProducts(false);
  };

  useEffect(() => {
    fetchMyProducts();
  }, [user]);

  useEffect(() => {
    const fetchSub = async () => {
      if (!user) return;
      const { data } = await (supabase as any)
        .from("seller_subscriptions")
        .select("tier,status,expires_at")
        .eq("seller_id", user.id)
        .eq("status", "active")
        .order("activated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && (!data.expires_at || new Date(data.expires_at) > new Date())) {
        if (data.tier === "premium" || data.tier === "basic") {
          setActiveTier(data.tier);
          return;
        }
      }
      setActiveTier("free");
    };
    fetchSub();
  }, [user]);

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) {
      toast.error("Failed to delete product");
      return;
    }
    setMyProducts(myProducts.filter((p) => p.id !== productId));
    toast.success("Product deleted");
  };

  const updateUnitsSold = async (product: any, change: number) => {
    const nextSold = Math.max(0, Number(product.units_sold || 0) + change);
    const nextStock = Math.max(0, Number(product.stock_quantity || 0) - change);
    const { error } = await (supabase as any)
      .from("products")
      .update({ units_sold: nextSold, stock_quantity: nextStock })
      .eq("id", product.id);
    if (error) {
      toast.error("Could not update stock");
      return;
    }
    setMyProducts((items) =>
      items.map((p) =>
        p.id === product.id
          ? { ...p, units_sold: nextSold, stock_quantity: nextStock }
          : p
      )
    );
    toast.success("Stock tracker updated");
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm("Delete this service ad?")) return;
    const { error } = await (supabase as any)
      .from("service_listings")
      .delete()
      .eq("id", serviceId);
    if (error) {
      toast.error("Failed to delete service");
      return;
    }
    setMyServices(myServices.filter((service) => service.id !== serviceId));
    toast.success("Service ad deleted");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">
            Please log in as a seller to list products
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-4 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (role !== "seller") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">
            Only seller accounts can list products and services
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // Plan + listings stats
  const PLANS = [
    {
      id: "free",
      name: "Starter",
      price: 0,
      limit: 3,
      icon: Sparkles,
      tagline: "Perfect to get started.",
      perks: ["3 free uploads"],
    },
    {
      id: "basic",
      name: "Basic",
      price: 75,
      limit: 10,
      icon: Package,
      tagline: "Great for regular sellers.",
      perks: ["10 uploads / month"],
    },
    {
      id: "premium",
      name: "Premium",
      price: 150,
      limit: Infinity,
      icon: Crown,
      tagline: "For serious sellers.",
      perks: ["Unlimited uploads"],
    },
  ] as const;
  const currentPlan = PLANS.find((p) => p.id === activeTier) ?? PLANS[0];
  const totalListings = myProducts.length + myServices.length;
  const limitReached = totalListings >= currentPlan.limit;

  const totalRevenue = myProducts.reduce(
    (sum, p) => sum + Number(p.price || 0) * Number(p.units_sold || 0),
    0
  );
  const totalProfit = myProducts.reduce(
    (sum, p) =>
      sum +
      (Number(p.price || 0) - Number(p.cost_price || 0)) *
        Number(p.units_sold || 0),
    0
  );
  const totalSold = myProducts.reduce(
    (sum, p) => sum + Number(p.units_sold || 0),
    0
  );
  const bestSeller = [...myProducts].sort(
    (a, b) => Number(b.units_sold || 0) - Number(a.units_sold || 0)
  )[0];

  const activeProducts = myProducts.filter(
    (p) => p.approval_status === "approved"
  ).length;
  const activeServices = myServices.filter(
    (s) => s.approval_status === "approved"
  ).length;

  // Combined listings list for the My Listings view
  const allListings = [
    ...myProducts.map((p) => ({
      id: p.id,
      kind: "product" as const,
      title: p.name,
      price: p.price,
      image_url: p.image_url,
      approval_status: p.approval_status,
      units_sold: p.units_sold || 0,
      created_at: p.created_at,
      raw: p,
    })),
    ...myServices.map((s) => ({
      id: s.id,
      kind: "service" as const,
      title: s.title,
      price: s.price,
      image_url: s.image_url,
      approval_status: s.approval_status,
      units_sold: 0,
      created_at: s.created_at,
      raw: s,
    })),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const filteredListings = allListings.filter((l) => {
    if (tab === "all") return true;
    if (tab === "pending") return l.approval_status !== "approved";
    if (tab === "active") return l.approval_status === "approved";
    if (tab === "sold") return l.kind === "product" && l.units_sold > 0;
    return true;
  });

  const upgradeHref = (planName: string) =>
    `https://wa.me/27724282520?text=${encodeURIComponent(
      `Hi Admin, I want to activate the ${planName} seller plan on Student Hub.`
    )}`;

  // ---------- VIEWS ----------

  const SubHeader = ({ title }: { title: string }) => (
    <div className="mb-5 flex items-center gap-3">
      <button
        onClick={() => setView("hub")}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-base font-bold text-foreground">{title}</h1>
    </div>
  );

  const renderHub = () => {
    const usedPct = currentPlan.limit === Infinity
      ? 0
      : Math.min(100, (totalListings / currentPlan.limit) * 100);
    return (
      <>
        <h1 className="mb-5 text-center text-base font-bold text-foreground sm:text-left sm:text-lg">
          Seller Hub
        </h1>

        {/* Plan card */}
        <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90">
            🎓 Student Hub
          </p>
        </div>

        <div className="mt-3 rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-bold text-foreground">
            {currentPlan.name} Plan {currentPlan.price === 0 ? "(Free)" : ""}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {currentPlan.limit === Infinity
              ? "Unlimited uploads"
              : `${currentPlan.limit} free uploads`}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {totalListings} /{" "}
              {currentPlan.limit === Infinity ? "∞" : currentPlan.limit} used
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => setView("plans")}
            className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View Plans
          </button>
        </div>

        {/* Action grid */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => setView("listings")}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ListChecks className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground">My Listings</h4>
              <p className="text-xs text-muted-foreground">
                {activeProducts + activeServices} active
              </p>
            </div>
          </button>

          <button
            onClick={() => setView("listings")}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground">My Services</h4>
              <p className="text-xs text-muted-foreground">
                {activeServices} active
              </p>
            </div>
          </button>

          <button
            onClick={() => setView("stock")}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Boxes className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground">My Stock</h4>
              <p className="text-xs text-muted-foreground">Manage inventory</p>
            </div>
          </button>

          <button
            onClick={() => setView("analytics")}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <LineChart className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground">Sales Analytics</h4>
              <p className="text-xs text-muted-foreground">Track performance</p>
            </div>
          </button>
        </div>

        {/* Big CTA */}
        <button
          onClick={() => {
            if (limitReached) {
              setView("plans");
              toast.error("Upload limit reached — upgrade to keep listing");
              return;
            }
            setView("create");
          }}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" /> Create New Listing
        </button>

        {/* Recent listings */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Recent Listings
            </h2>
            <button
              onClick={() => setView("listings")}
              className="text-sm font-semibold text-primary hover:underline"
            >
              See all
            </button>
          </div>

          {loadingProducts ? (
            <div className="py-8 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : allListings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card py-8 text-center text-sm text-muted-foreground">
              No listings yet. Tap "Create New Listing" to start.
            </p>
          ) : (
            <div className="space-y-3">
              {allListings.slice(0, 3).map((l) => (
                <ListingRow key={`${l.kind}-${l.id}`} l={l} />
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  const ListingRow = ({ l }: { l: typeof allListings[number] }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
        {l.image_url ? (
          <img src={l.image_url} alt={l.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            {l.kind === "product" ? (
              <Package className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Wrench className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-foreground">{l.title}</h3>
        {l.price ? (
          <p className="text-sm font-semibold text-foreground">R{l.price}</p>
        ) : null}
        <span
          className={`mt-0.5 inline-flex items-center gap-1 text-xs font-medium ${
            l.approval_status === "approved"
              ? "text-success"
              : "text-amber-500 dark:text-amber-400"
          }`}
        >
          {l.approval_status === "approved" ? (
            <>
              <CheckCircle className="h-3 w-3" /> Active
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" /> Pending approval
            </>
          )}
        </span>
      </div>
      <button
        onClick={() =>
          l.kind === "product" ? handleDelete(l.id) : deleteService(l.id)
        }
        className="flex-shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const renderListings = () => (
    <>
      <SubHeader title="My Listings" />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(["all", "pending", "active", "sold"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loadingProducts ? (
        <div className="py-8 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredListings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredListings.map((l) => (
            <div
              key={`${l.kind}-${l.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
                {l.image_url ? (
                  <img
                    src={l.image_url}
                    alt={l.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {l.kind === "product" ? (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-foreground">
                  {l.title}
                </h3>
                {l.price ? (
                  <p className="text-sm font-semibold text-foreground">
                    R{l.price}
                  </p>
                ) : null}
                <span
                  className={`mt-0.5 inline-flex items-center gap-1 text-xs font-medium ${
                    l.approval_status === "approved"
                      ? "text-success"
                      : "text-amber-500 dark:text-amber-400"
                  }`}
                >
                  {l.approval_status === "approved" ? (
                    <>
                      <CheckCircle className="h-3 w-3" /> Active
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" /> Pending approval
                    </>
                  )}
                </span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() =>
                  l.kind === "product"
                    ? handleDelete(l.id)
                    : deleteService(l.id)
                }
                className="flex-shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderStock = () => (
    <>
      <SubHeader title="My Stock" />
      {loadingProducts ? (
        <div className="py-8 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : myProducts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
          You haven't listed any products yet.
        </p>
      ) : (
        <div className="space-y-3">
          {myProducts.map((p) => {
            const profit =
              (Number(p.price || 0) - Number(p.cost_price || 0)) *
              Number(p.units_sold || 0);
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-foreground">
                      {p.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Stock {p.stock_quantity} · Sold {p.units_sold || 0} ·
                      Profit R{profit.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateUnitsSold(p, 1)}
                    className="rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    + Mark Sale
                  </button>
                  <button
                    onClick={() => updateUnitsSold(p, -1)}
                    className="rounded-xl border border-border bg-background py-2 text-sm font-semibold text-foreground hover:bg-secondary"
                  >
                    Undo Sale
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  const renderAnalytics = () => (
    <>
      <SubHeader title="Sales Analytics" />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            R{totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Profit</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            R{totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Units sold</p>
          <p className="mt-1 text-xl font-bold text-foreground">{totalSold}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Top seller</p>
          <p className="mt-1 truncate text-base font-bold text-foreground">
            {bestSeller?.units_sold ? bestSeller.name : "—"}
          </p>
        </div>
      </div>
    </>
  );

  const renderPlans = () => (
    <>
      <SubHeader title="Subscription Plans" />
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground">
          Choose a plan that works for you
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          More uploads, more selling.
        </p>
      </div>

      <div className="space-y-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan.id;
          const isHighlight = plan.id === "premium";
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border-2 p-5 transition-all ${
                isHighlight
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="mt-1">
                    <span className="text-xl font-bold text-foreground">
                      R{plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-foreground">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-success" /> {perk}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.tagline}
                  </p>
                </div>
                {isCurrent ? (
                  <span className="flex-shrink-0 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                    Current Plan
                  </span>
                ) : (
                  <a
                    href={upgradeHref(plan.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Upgrade
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Secure payments via admin
        approval
      </p>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
        {view === "hub" && renderHub()}
        {view === "create" && (
          <>
            {limitReached ? (
              <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-8 text-center">
                <Lock className="mx-auto h-10 w-10 text-primary" />
                <h3 className="mt-3 text-xl font-bold text-foreground">
                  Free upload limit reached
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Upgrade your plan to keep adding listings.
                </p>
                <button
                  onClick={() => setView("plans")}
                  className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                >
                  View plans
                </button>
              </div>
            ) : (
              <GuidedListingFlow
                onPublished={fetchMyProducts}
                onClose={() => setView("listings")}
              />
            )}
          </>
        )}
        {view === "listings" && renderListings()}
        {view === "stock" && renderStock()}
        {view === "analytics" && renderAnalytics()}
        {view === "plans" && renderPlans()}
      </main>
    </div>
  );
};

export default Sell;
