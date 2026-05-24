import { ShoppingBag, Store, Menu, X, ShoppingCart, LogOut, User, Sun, Moon, Scissors, ShieldCheck, Package, Inbox } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle: toggleTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ShoppingBag className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            Student Hub
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive("/")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            Browse
          </Link>
          {user && role === "seller" && (
            <Link
              to="/sell"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive("/sell")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Store className="h-4 w-4" /> Sell
              </span>
            </Link>
          )}
          {user && (role === "seller" || role === "admin") && (
            <Link
              to="/seller/orders"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive("/seller/orders")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Inbox className="h-4 w-4" /> Orders
              </span>
            </Link>
          )}
          {user && role !== "seller" && (
            <Link
              to="/?become=seller#become-seller"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Store className="h-4 w-4" /> Become a Seller
              </span>
            </Link>
          )}
          <Link
            to="/services"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive("/services")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Scissors className="h-4 w-4" /> Services
            </span>
          </Link>
          {user && (
            <Link
              to="/cart"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive("/cart")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShoppingCart className="h-4 w-4" /> Cart
              </span>
            </Link>
          )}
          {user && (
            <Link
              to="/orders"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive("/orders")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Package className="h-4 w-4" /> My Orders
              </span>
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <>
              {role === "admin" && (
                <Link
                  to="/admin"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive("/admin")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  title="Admin"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </span>
                </Link>
              )}
              <Link
                to="/profile"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive("/profile")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                title="Profile"
              >
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" /> Profile
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="ml-1 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="ml-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" /> Sign In
              </span>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 pb-4 md:hidden">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
            Browse
          </Link>
          {user && role === "seller" && (
            <Link to="/sell" onClick={() => setMobileOpen(false)} className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
              Sell on Student Hub
            </Link>
          )}
          <Link to="/services" onClick={() => setMobileOpen(false)} className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
            Services
          </Link>
          {user && (
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
              My Cart
            </Link>
          )}
          {user && (
            <Link to="/orders" onClick={() => setMobileOpen(false)} className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
              📦 My Orders
            </Link>
          )}
          {user && (role === "seller" || role === "admin") && (
            <Link to="/seller/orders" onClick={() => setMobileOpen(false)} className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
              📥 Incoming Orders
            </Link>
          )}
          <button onClick={toggleTheme} className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
                👤 My Profile
              </Link>
              {role === "admin" && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary">
                  🛡️ Admin Panel
                </Link>
              )}
              <button onClick={handleSignOut} className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-destructive hover:bg-secondary">
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)} className="block rounded-lg px-4 py-3 text-sm font-bold text-primary hover:bg-secondary">
              Sign In / Sign Up
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
