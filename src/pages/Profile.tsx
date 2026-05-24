import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Mail, Phone, MapPin, GraduationCap, Save, ShieldCheck, Store, ShoppingBag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const universities = [
  "CPUT", "UCT", "UWC", "Stellenbosch University", "UNISA", "Wits", "UJ", "UP",
  "DUT", "TUT", "UKZN", "NWU", "UFS", "Other",
];

const Profile = () => {
  const { user, profile, role, refreshProfile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [campus, setCampus] = useState("");
  const [delivers, setDelivers] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setWhatsapp(profile.whatsapp || "");
      setLocation(profile.location || "");
      setCampus(profile.campus || "");
      setDelivers(!!profile.delivers);
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Please sign in to view your profile.</p>
          <button onClick={() => navigate("/auth")} className="mt-4 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        location: location.trim() || null,
        campus: campus || null,
        delivers,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save profile");
      return;
    }
    toast.success("Profile updated");
    await refreshProfile();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = (fullName || user.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-5 text-lg font-bold text-foreground">My Profile</h1>

        {/* Identity card */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-foreground">{fullName || "Unnamed"}</h2>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  {role === "admin" ? <ShieldCheck className="h-3 w-3" /> : role === "seller" ? <Store className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                  {role || "no role"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-5">
          <Field icon={<User className="h-4 w-4" />} label="Full name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              placeholder="Your full name"
            />
          </Field>

          <Field icon={<Mail className="h-4 w-4" />} label="Email">
            <input
              value={user.email || ""}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground"
            />
          </Field>

          <Field icon={<Phone className="h-4 w-4" />} label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              placeholder="e.g. 0721234567"
            />
          </Field>

          <Field icon={<Phone className="h-4 w-4" />} label="WhatsApp">
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              placeholder="WhatsApp number"
            />
          </Field>

          <Field icon={<GraduationCap className="h-4 w-4" />} label="Campus">
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">Select campus</option>
              {universities.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </Field>

          <Field icon={<MapPin className="h-4 w-4" />} label="Location / residence">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              placeholder="e.g. Cape Town, Obs"
            />
          </Field>

          {role === "seller" && (
            <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={delivers}
                onChange={(e) => setDelivers(e.target.checked)}
                className="h-4 w-4"
              />
              I offer delivery
            </label>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        {role === "admin" && (
          <button
            onClick={() => navigate("/admin")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-bold text-foreground hover:bg-secondary"
          >
            <ShieldCheck className="h-4 w-4" /> Open Admin Panel
          </button>
        )}

        <button
          onClick={handleSignOut}
          className="mt-4 w-full rounded-xl border border-border bg-card py-3 text-sm font-semibold text-destructive hover:bg-destructive/10"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

const Field = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div>
    <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      {icon} {label}
    </label>
    {children}
  </div>
);

export default Profile;