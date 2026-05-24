import { Home, Grid3x3, MessageCircle, ShoppingCart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/services", icon: Grid3x3, label: "Categories" },
  { to: "/messages", icon: MessageCircle, label: "Chats", auth: true },
  { to: "/cart", icon: ShoppingCart, label: "Cart", auth: true },
  { to: "/profile", icon: User, label: "Profile", auth: true },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
        {tabs.map(({ to, icon: Icon, label, auth }) => {
          const target = auth && !user ? "/auth" : to;
          const active = pathname === to;
          return (
            <li key={label} className="flex-1">
              <Link
                to={target}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;