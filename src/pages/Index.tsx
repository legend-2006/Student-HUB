import { useState, useEffect } from "react";
import { Search, Scissors, ArrowRight, MessageCircle, Phone, ChevronDown, GraduationCap, Camera, Wrench, UtensilsCrossed, Palette, Sparkles, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Index = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [serviceType, setServiceType] = useState<string | null>(null);

  const serviceTypes = [
    { name: "Hair", icon: Scissors },
    { name: "Tutoring", icon: GraduationCap },
    { name: "Photography", icon: Camera },
    { name: "Repairs", icon: Wrench },
    { name: "Food", icon: UtensilsCrossed },
    { name: "Design", icon: Palette },
    { name: "Beauty", icon: Sparkles },
    { name: "Other", icon: MoreHorizontal },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      if (category === "Services") {
        let q = (supabase as any)
          .from("service_listings")
          .select("*")
          .eq("is_active", true)
          .eq("approval_status", "approved")
          .order("created_at", { ascending: false });
        if (serviceType) {
          q = q.eq("category", serviceType);
        }
        if (search.trim()) {
          q = q.or(`title.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
        }
        const { data } = await q;
        setServices(data || []);
        setLoading(false);
        return;
      }
      let query = supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (category !== "All") {
        query = query.eq("category", category);
      }
      if (search.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%`);
      }
      const { data } = await query;
      setProducts(data || []);
      setLoading(false);
    };
    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [category, search, serviceType]);

  // Logged-out visitors only see top 3 trending; rest is gated behind auth
  const isGated = !user;
  const visibleProducts = isGated ? products.slice(0, 3) : products;
  const visibleServices = isGated ? services.slice(0, 3) : services;

  const openWhatsApp = (service: any) => {
    const num = service.whatsapp || service.phone;
    if (!num) {
      toast.error("No WhatsApp number added");
      return;
    }
    const cleaned = num.replace(/\D/g, "");
    const formatted = cleaned.startsWith("0") ? `27${cleaned.slice(1)}` : cleaned;
    const msg = encodeURIComponent(`Hi! I saw your ${service.title} service on Student Hub.`);
    window.open(`https://wa.me/${formatted}?text=${msg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {!user && <HeroBanner />}

      <main id="products" className="container mx-auto px-4 py-10 pb-24 md:pb-10">
        {user && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or category..."
                className="w-full rounded-xl border border-input bg-card pl-12 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {category === "Services" ? "Student Services" : "Trending on Student Hub"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {category === "Services" ? "Hairdressers, tutors, photographers and more" : "Fresh finds and student-run services"}
            </p>
          </div>
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        ) : category === "Services" ? (
          <>
            <button
              onClick={() => setServicesOpen((o) => !o)}
              className="mb-4 flex w-full items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-secondary"
              aria-expanded={servicesOpen}
            >
              <span className="font-semibold text-foreground">
                {servicesOpen ? "Hide services" : `Show services (${visibleServices.length})`}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${servicesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {servicesOpen && (
              <>
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 animate-fade-in">
                  <button
                    onClick={() => setServiceType(null)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      serviceType === null ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-secondary"
                    }`}
                  >
                    All
                  </button>
                  {serviceTypes.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => setServiceType(name)}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        serviceType === name ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {name}
                    </button>
                  ))}
                </div>
            <div className="flex max-h-[70vh] snap-y snap-mandatory flex-col gap-4 overflow-y-auto pr-1 animate-fade-in">
              {visibleServices.map((service) => (
                <article key={service.id} className="snap-start overflow-hidden rounded-xl border border-border bg-card">
                  <div className="aspect-video bg-secondary">
                    {service.image_url ? (
                      <img src={service.image_url} alt={service.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="text-xs font-semibold text-primary">{service.category}</p>
                      <h3 className="mt-1 text-lg font-bold text-foreground">{service.title}</h3>
                      {service.price !== null && service.price !== undefined && (
                        <p className="mt-1 font-bold text-primary">From R{service.price}</p>
                      )}
                    </div>
                    {service.description && (
                      <p className="line-clamp-3 text-sm text-muted-foreground">{service.description}</p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => openWhatsApp(service)} className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-success bg-success/10 py-2.5 text-sm font-semibold text-success hover:bg-success/20">
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </button>
                      {(service.phone || service.whatsapp) && (
                        <a href={`tel:${service.phone || service.whatsapp}`} className="flex items-center justify-center rounded-lg border-2 border-primary bg-primary/10 px-3 py-2.5 text-primary hover:bg-primary/20">
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
              {visibleServices.length === 0 && (
                <p className="py-20 text-center text-muted-foreground">No {serviceType || "approved"} services yet.</p>
              )}
            </div>
              </>
            )}
            {servicesOpen && isGated && services.length > 3 && (
              <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">Sign in or create an account to see all services.</p>
                <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
                  See more <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {isGated && products.length > 3 && (
              <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {search.trim()
                    ? `Showing 3 of ${products.length} matches. Sign in or create an account to see all results.`
                    : "Sign in or create an account to see all listings."}
                </p>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  See more <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </>
        )}

        {!loading && category !== "Services" && visibleProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">
              No products yet. Be the first to sell! 🚀
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Student Hub. All rights reserved.</p>
          <p className="mt-1">Built for campus students 🎓</p>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
};

export default Index;
