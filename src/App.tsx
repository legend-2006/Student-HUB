import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Sell from "./pages/Sell";
import Auth from "./pages/Auth";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Services from "./pages/Services";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import SellerOrders from "./pages/SellerOrders";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const MissingSupabaseConfig = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
    <div className="max-w-lg rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
      <h1 className="text-2xl font-bold">Student Hub needs setup</h1>
      <p className="mt-3 text-muted-foreground">
        Add your Supabase environment variables in Netlify, then redeploy the site.
      </p>
      <div className="mt-5 rounded-xl bg-muted p-4 text-left text-sm font-mono">
        <p>VITE_SUPABASE_URL</p>
        <p>VITE_SUPABASE_PUBLISHABLE_KEY</p>
        <p>VITE_SUPABASE_PROJECT_ID</p>
      </div>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {isSupabaseConfigured ? (
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/sell" element={<Sell />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/seller/orders" element={<SellerOrders />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/services" element={<Services />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      ) : (
        <MissingSupabaseConfig />
      )}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
