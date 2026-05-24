import { useEffect, useState } from "react";
import { MessageCircle, Phone, Search, Scissors } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const serviceCategories = ["All", "Hair", "Tutoring", "Photography", "Repairs", "Food", "Design", "Other"];

const Services = () => {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      let query = (supabase as any)
        .from("service_listings")
        .select("*")
        .eq("is_active", true)
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });

      if (category !== "All") query = query.eq("category", category);
      if (search.trim()) query = query.or(`title.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);

      const { data } = await query;
      setServices(data || []);
      setLoading(false);
    };

    const debounce = setTimeout(fetchServices, 300);
    return () => clearTimeout(debounce);
  }, [category, search]);

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
      <main className="container mx-auto px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Scissors className="h-4 w-4" /> Student services
            </div>
            <h1 className="text-3xl font-bold text-foreground">Services on Student Hub</h1>
            <p className="mt-1 text-muted-foreground">Find hairdressers, tutors, photographers, food sellers, and campus side-hustles.</p>
          </div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              className="w-full rounded-xl border border-input bg-card py-3.5 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-input bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            {serviceCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : services.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">No approved services yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="aspect-video bg-secondary">
                  {service.image_url ? <img src={service.image_url} alt={service.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>}
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-xs font-semibold text-primary">{service.category}</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">{service.title}</h2>
                    {service.price !== null && <p className="mt-1 font-bold text-primary">From R{service.price}</p>}
                  </div>
                  {service.description && <p className="line-clamp-3 text-sm text-muted-foreground">{service.description}</p>}
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
          </div>
        )}
      </main>
    </div>
  );
};

export default Services;