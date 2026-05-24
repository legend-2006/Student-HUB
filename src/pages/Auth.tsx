import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingBag, Store, User, Mail, Lock, Phone, MapPin, CheckCircle, GraduationCap, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Step = "login" | "forgot" | "signup" | "check-email" | "complete-profile";

const universities = [
  "CPUT",
  "UCT",
  "UWC",
  "Stellenbosch University",
  "UNISA",
  "Wits",
  "UJ",
  "UP",
  "DUT",
  "TUT",
  "UKZN",
  "NWU",
  "UFS",
  "Other",
];

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("login");
  const [role, setRole] = useState<"seller" | "buyer">("buyer");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [campus, setCampus] = useState("");
  const [delivers, setDelivers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Honor ?intent=seller|buyer — jump straight into signup with that role
  useEffect(() => {
    const intent = searchParams.get("intent");
    if (intent === "seller" || intent === "buyer") {
      setRole(intent);
      setStep("signup");
    }
  }, [searchParams]);

  // If user becomes authenticated (e.g. clicked email link), move to complete-profile or home
  useEffect(() => {
    if (user) {
      if (step === "check-email" || step === "signup") {
        setStep("complete-profile");
      } else if (step === "login") {
        navigate("/");
      }
    }
  }, [user, step]);

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Your account has been deleted. We're sorry to see you go!");
      setDeleteOpen(false);
      setDeleteConfirm("");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role, campus, phone, whatsapp: whatsapp || phone },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast.success("Account created! Check your email for the confirmation link.");
      setStep("check-email");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back! 🎉");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success("Password reset link sent! Check your email.");
      setStep("login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const { error } = await supabase.from("profiles").update({
        phone,
        whatsapp: whatsapp || phone,
        location,
        campus: campus || null,
        delivers,
      }).eq("user_id", currentUser.id);

      if (error) throw error;
      toast.success("Profile complete! Welcome to Student Hub 🎓");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const skipToLogin = () => {
    setStep("login");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <ShoppingBag className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Hub</h1>
          <p className="text-xs text-muted-foreground">For university students everywhere</p>
        </div>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        {/* Tabs (only on login & signup screens) */}
        {(step === "login" || step === "signup") && (
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-secondary/60 p-1">
            <button
              type="button"
              onClick={() => setStep("login")}
              className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                step === "login"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setStep("signup")}
              className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                step === "signup"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create account
            </button>
          </div>
        )}

        {/* Signup */}
        {step === "signup" && (
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Create your account</h2>
              <p className="mt-1 text-sm text-muted-foreground">Fill in your details to get started</p>
            </div>

            {/* Role toggle */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">I want to…</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("buyer")}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    role === "buyer"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary/40 hover:border-primary/40"
                  }`}
                >
                  <ShoppingBag className={`h-6 w-6 ${role === "buyer" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-bold text-foreground">Buy</span>
                  <span className="text-[11px] text-muted-foreground text-center">Browse & buy from students</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("seller")}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    role === "seller"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary/40 hover:border-primary/40"
                  }`}
                >
                  <Store className={`h-6 w-6 ${role === "seller" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-bold text-foreground">Sell</span>
                  <span className="text-[11px] text-muted-foreground text-center">List & sell your products</span>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="h-4 w-4 text-primary" /> Full Name
              </label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Thabo Mokoena" required className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="h-4 w-4 text-primary" /> Email
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.ac.za" required className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <Lock className="h-4 w-4 text-primary" /> Password
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <Phone className="h-4 w-4 text-primary" /> Phone Number
              </label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712345678" required className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <Phone className="h-4 w-4 text-green-500" /> WhatsApp Number
              </label>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Same as phone or different" className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <GraduationCap className="h-4 w-4 text-primary" /> University
              </label>
              <select value={campus} onChange={(e) => setCampus(e.target.value)} required className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select your university</option>
                {universities.map((uni) => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Login */}
        {step === "login" && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Welcome back!</h2>
              <p className="mt-1 text-sm text-muted-foreground">Log in to your account</p>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="h-4 w-4 text-primary" /> Email
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.ac.za" required className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <Lock className="h-4 w-4 text-primary" /> Password
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Logging in..." : "Log In"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("forgot")}
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {/* Forgot password */}
        {step === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Reset your password</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll email you a link to set a new password.
              </p>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="h-4 w-4 text-primary" /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.ac.za"
                required
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <button
              type="button"
              onClick={() => setStep("login")}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back to login
            </button>
          </form>
        )}

        {/* Check Email - replaces OTP screen */}
        {step === "check-email" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Check your email</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to <strong className="text-foreground">{email}</strong>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Click the link in the email to verify your account. This page will update automatically.
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground">
                💡 Don't see it? Check your spam folder or wait a minute and try again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep("signup")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Go back to signup
            </button>
          </div>
        )}

        {/* Complete Profile */}
        {step === "complete-profile" && (
          <form onSubmit={handleCompleteProfile} className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Complete your profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">Help others find and contact you</p>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <Phone className="h-4 w-4 text-primary" /> Phone Number
              </label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712345678" className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <Phone className="h-4 w-4 text-success" /> WhatsApp Number
              </label>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Same as phone or different" className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <GraduationCap className="h-4 w-4 text-primary" /> University
              </label>
              <select value={campus} onChange={(e) => setCampus(e.target.value)} className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select your university</option>
                {universities.map((uni) => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Your Location
              </label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bellville Campus, Res Block C" className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {role === "seller" && (
              <label className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-4 py-3">
                <input type="checkbox" checked={delivers} onChange={(e) => setDelivers(e.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-ring" />
                <span className="text-sm text-foreground">I offer delivery on campus</span>
              </label>
            )}

            <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Saving..." : "Complete Setup"}
            </button>

            <button type="button" onClick={() => navigate("/")} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
              Skip for now
            </button>
          </form>
        )}

        {/* Danger Zone — visible to any signed-in user */}
        {user && (
          <div className="mt-8 border-t border-border pt-6">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground">Danger zone</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Permanently delete your Student Hub account, listings, reviews, and cart. This cannot be undone.
                  </p>
                  <AlertDialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteConfirm(""); }}>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground transition-colors hover:bg-destructive/90"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete my account
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove your profile, all your products, reviews, and cart items. You won't be able to recover this data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Type <span className="font-bold text-destructive">DELETE</span> to confirm
                        </label>
                        <input
                          type="text"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="DELETE"
                          autoComplete="off"
                          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
                          disabled={loading || deleteConfirm !== "DELETE"}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                        >
                          {loading ? "Deleting..." : "Yes, delete forever"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">🎓 For university students everywhere</p>
    </div>
  );
};

export default Auth;
