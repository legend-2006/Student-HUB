import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, Store, Info } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import heroBuyer from "@/assets/hero-marketplace.jpg";
import heroSeller from "@/assets/hero-seller.jpg";

const slides = [
  {
    key: "buyer",
    badge: "🎓 For Student Buyers",
    title: "Discover, Shop, and Support Student Businesses on Campus",
    subtitle: "Shop affordable. Support your peers. Grow together.",
    info: "Every purchase you make on Student Hub is more than just a transaction — it's an investment in a student's journey. Behind each product or service is a student working hard to build a business, gain independence, and create opportunities for their future. By choosing to shop here, you are not only getting convenient, affordable products on campus; you are directly supporting your peers, empowering small student businesses, and strengthening your campus community. Buy what you need. Support who you believe in. Grow together.",
    cta: { label: "Start Shopping", to: "#products" },
    icon: ShoppingBag,
    image: heroBuyer,
    gradient: "from-blue-600/90 via-blue-500/70 to-blue-400/30",
  },
  {
    key: "seller",
    badge: "🛍️ For Student Sellers",
    title: "Reach More and Earn More",
    subtitle: "Grow your business. Reach more students. Earn more.",
    info: "Grow your student business by expanding your reach on campus. Our platform connects you directly with a wider student audience that is actively looking for products and services like yours. Instead of spending heavily on traditional advertising, you can promote your offerings at a much lower cost while increasing your visibility across campus. This means more potential customers, more consistent sales, and a real opportunity to scale your business faster. Our platform is designed to help you grow efficiently — reaching more students, building your brand, and improving your profit margins without the high expenses.",
    cta: { label: "Join Now", to: "/auth?intent=seller" },
    icon: Store,
    image: heroSeller,
    gradient: "from-primary/90 via-primary/70 to-primary/30",
  },
];

const HeroBanner = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, []);

  const go = (dir: 1 | -1) =>
    setIndex((i) => (i + dir + slides.length) % slides.length);

  // basic touch swipe
  let startX = 0;
  const onTouchStart = (e: React.TouchEvent) => (startX = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  return (
    <section
      className="relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Horizontal swipe track — each slide is its own full-width page */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${index * (100 / slides.length)}%)`,
        }}
      >
        {slides.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              className="relative shrink-0"
              style={{ width: `${100 / slides.length}%` }}
            >
              <div className="absolute inset-0">
                <img
                  src={s.image}
                  alt={s.title}
                  width={1920}
                  height={1024}
                  className="h-full w-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${s.gradient}`} />
              </div>
              <div className="container relative mx-auto px-4 py-20 md:py-32">
                <div className="max-w-lg">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/20 px-4 py-1.5 text-sm font-semibold text-primary-foreground backdrop-blur-sm border border-primary-foreground/30">
                    <Icon className="h-4 w-4" /> {s.badge}
                  </span>
                  <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-primary-foreground md:text-4xl lg:text-5xl">
                    {s.title}
                  </h1>
                  <p className="mt-4 text-base md:text-lg text-primary-foreground/90">
                    {s.subtitle}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    {s.cta.to.startsWith("#") ? (
                      <a
                        href={s.cta.to}
                        className="inline-block rounded-lg bg-primary-foreground px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary-foreground/90"
                      >
                        {s.cta.label}
                      </a>
                    ) : (
                      <Link
                        to={s.cta.to}
                        className="inline-block rounded-lg bg-primary-foreground px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary-foreground/90"
                      >
                        {s.cta.label}
                      </Link>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/40 bg-primary-foreground/10 px-5 py-3 text-sm font-semibold text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/20"
                        >
                          <Info className="h-4 w-4" /> Info
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{s.title}</DialogTitle>
                          <DialogDescription className="pt-2 text-sm leading-relaxed text-foreground/80">
                            {s.info}
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls overlaid on the carousel */}
      <div className="container mx-auto px-4">
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-3 md:justify-start md:px-8">
          <button
            onClick={() => go(-1)}
            aria-label="Previous"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/20"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="ml-2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-primary-foreground"
                    : "w-2 bg-primary-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
