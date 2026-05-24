import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Package, Wrench, ShieldCheck, Users, Search, CreditCard } from "lucide-react";

type PendingItem = {
  id: string;
  kind: "product" | "service";
  title: string;
  price: number | null;
  image_url: string | null;
  category: string;
  description: string | null;
  seller_id: string;
  approval_status: string;
  created_at: string;
};

type AppRole = "buyer" | "seller" | "admin";

type ManagedUser = {
  user_id: string;
  full_name: string;
  email: string | null;
  campus: string | null;
  roles: AppRole[];
};

type Subscription = {
  id: string;
  seller_id: string;
  tier: "basic" | "pro" | "premium";
  status: "active" | "expired" | "cancelled";
  expires_at: string | null;
  amount: number | null;
};

type SellerWithSub = ManagedUser & { subscription: Subscription | null };

const Admin = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [tab, setTab] = useState<"listings" | "users" | "subscriptions">("listings");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [sellers, setSellers] = useState<SellerWithSub[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subSearch, setSubSearch] = useState("");
  const [savingSubId, setSavingSubId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: products }, { data: services }] = await Promise.all([
      (supabase as any).from("products").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("service_listings").select("*").order("created_at", { ascending: false }),
    ]);
    const merged: PendingItem[] = [
      ...(products || []).map((p: any) => ({
        id: p.id,
        kind: "product" as const,
        title: p.name,
        price: p.price,
        image_url: p.image_url,
        category: p.category,
        description: p.description,
        seller_id: p.seller_id,
        approval_status: p.approval_status,
        created_at: p.created_at,
      })),
      ...(services || []).map((s: any) => ({
        id: s.id,
        kind: "service" as const,
        title: s.title,
        price: s.price,
        image_url: s.image_url,
        category: s.category,
        description: s.description,
        seller_id: s.seller_id,
        approval_status: s.approval_status,
        created_at: s.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(merged);
    setLoading(false);
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    const [{ data: profilesData }, { data: rolesData }] = await Promise.all([
      (supabase as any).from("profiles").select("user_id, full_name, email, campus").order("created_at", { ascending: false }),
      (supabase as any).from("user_roles").select("user_id, role"),
    ]);
    const rolesByUser = new Map<string, AppRole[]>();
    (rolesData || []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) || [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    const merged: ManagedUser[] = (profilesData || []).map((p: any) => ({
      user_id: p.user_id,
      full_name: p.full_name || "(no name)",
      email: p.email,
      campus: p.campus,
      roles: rolesByUser.get(p.user_id) || [],
    }));
    setUsers(merged);
    setUsersLoading(false);
  };

  const setUserRole = async (u: ManagedUser, newRole: AppRole) => {
    setSavingUserId(u.user_id);
    // Remove existing non-admin roles, keep admin if present (admin is sticky — must be removed explicitly)
    const toRemove = u.roles.filter((r) => r !== "admin" && r !== newRole);
    if (toRemove.length > 0) {
      const { error: delErr } = await (supabase as any)
        .from("user_roles")
        .delete()
        .eq("user_id", u.user_id)
        .in("role", toRemove);
      if (delErr) {
        toast.error("Failed to update role");
        setSavingUserId(null);
        return;
      }
    }
    if (!u.roles.includes(newRole)) {
      const { error: insErr } = await (supabase as any)
        .from("user_roles")
        .insert({ user_id: u.user_id, role: newRole });
      if (insErr) {
        toast.error("Failed to assign role");
        setSavingUserId(null);
        return;
      }
    }
    toast.success(`Role set to ${newRole}`);
    const nextRoles = Array.from(new Set([...u.roles.filter((r) => r === "admin" || r === newRole), newRole])) as AppRole[];
    setUsers((prev) => prev.map((x) => (x.user_id === u.user_id ? { ...x, roles: nextRoles } : x)));
    setSavingUserId(null);
  };

  const toggleAdmin = async (u: ManagedUser) => {
    setSavingUserId(u.user_id);
    if (u.roles.includes("admin")) {
      const { error } = await (supabase as any)
        .from("user_roles")
        .delete()
        .eq("user_id", u.user_id)
        .eq("role", "admin");
      if (error) {
        toast.error("Failed to remove admin");
        setSavingUserId(null);
        return;
      }
      toast.success("Admin access removed");
      setUsers((prev) => prev.map((x) => (x.user_id === u.user_id ? { ...x, roles: x.roles.filter((r) => r !== "admin") } : x)));
    } else {
      const { error } = await (supabase as any)
        .from("user_roles")
        .insert({ user_id: u.user_id, role: "admin" });
      if (error) {
        toast.error("Failed to grant admin");
        setSavingUserId(null);
        return;
      }
      toast.success("Admin access granted");
      setUsers((prev) => prev.map((x) => (x.user_id === u.user_id ? { ...x, roles: [...x.roles, "admin"] } : x)));
    }
    setSavingUserId(null);
  };

  useEffect(() => {
    if (role !== "admin") return;
    if (tab === "listings") fetchAll();
    if (tab === "users") fetchUsers();
    if (tab === "subscriptions") fetchSellersWithSubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, tab]);

  const fetchSellersWithSubs = async () => {
    setSubLoading(true);
    const [{ data: sellerRoles }, { data: profilesData }, { data: subs }] = await Promise.all([
      (supabase as any).from("user_roles").select("user_id").eq("role", "seller"),
      (supabase as any).from("profiles").select("user_id, full_name, email, campus"),
      (supabase as any).from("seller_subscriptions").select("*"),
    ]);
    const sellerIds = new Set<string>((sellerRoles || []).map((r: any) => r.user_id));
    const subBySeller = new Map<string, Subscription>();
    (subs || []).forEach((s: any) => subBySeller.set(s.seller_id, s));
    const list: SellerWithSub[] = (profilesData || [])
      .filter((p: any) => sellerIds.has(p.user_id))
      .map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name || "(no name)",
        email: p.email,
        campus: p.campus,
        roles: ["seller"],
        subscription: subBySeller.get(p.user_id) || null,
      }));
    setSellers(list);
    setSubLoading(false);
  };

  const activatePlan = async (sellerId: string, tier: "basic" | "pro" | "premium", months: number, amount: number) => {
    setSavingSubId(sellerId);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);
    const payload = {
      seller_id: sellerId,
      tier,
      status: "active" as const,
      activated_by: user?.id,
      activated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      amount,
    };
    const existing = sellers.find((s) => s.user_id === sellerId)?.subscription;
    const { error } = existing
      ? await (supabase as any).from("seller_subscriptions").update(payload).eq("seller_id", sellerId)
      : await (supabase as any).from("seller_subscriptions").insert(payload);
    if (error) {
      toast.error(error.message || "Failed to activate plan");
      setSavingSubId(null);
      return;
    }
    toast.success(`Activated ${tier} plan for ${months} month(s)`);
    await fetchSellersWithSubs();
    setSavingSubId(null);
  };

  const cancelPlan = async (sellerId: string) => {
    setSavingSubId(sellerId);
    const { error } = await (supabase as any)
      .from("seller_subscriptions")
      .update({ status: "cancelled" })
      .eq("seller_id", sellerId);
    if (error) {
      toast.error("Failed to cancel");
    } else {
      toast.success("Subscription cancelled");
      await fetchSellersWithSubs();
    }
    setSavingSubId(null);
  };

  const updateStatus = async (item: PendingItem, status: "approved" | "rejected" | "pending") => {
    const table = item.kind === "product" ? "products" : "service_listings";
    const { error } = await (supabase as any)
      .from(table)
      .update({ approval_status: status })
      .eq("id", item.id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    toast.success(`Listing ${status}`);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, approval_status: status } : i)));
  };

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
          <p className="text-lg text-muted-foreground">Please sign in to access the admin panel.</p>
          <button onClick={() => navigate("/auth")} className="mt-4 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-md px-4 py-20 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Admin only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is restricted to administrators. Ask the platform owner to grant your account the admin role.
          </p>
        </div>
      </div>
    );
  }

  const filtered = items.filter((i) => (filter === "all" ? true : i.approval_status === filter));
  const pendingCount = items.filter((i) => i.approval_status === "pending").length;
  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.campus || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">
              {tab === "listings" ? `${pendingCount} pending review` : `${users.length} users`}
            </p>
          </div>
        </div>

        <div className="mb-4 flex gap-2 border-b border-border">
          <button
            onClick={() => setTab("listings")}
            className={`flex items-center gap-1.5 px-3 pb-2 text-sm font-semibold transition-colors ${
              tab === "listings" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Package className="h-4 w-4" /> Listings
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-1.5 px-3 pb-2 text-sm font-semibold transition-colors ${
              tab === "users" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Users className="h-4 w-4" /> Users
          </button>
          <button
            onClick={() => setTab("subscriptions")}
            className={`flex items-center gap-1.5 px-3 pb-2 text-sm font-semibold transition-colors ${
              tab === "subscriptions" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <CreditCard className="h-4 w-4" /> Plans
          </button>
        </div>

        {tab === "listings" && (
        <>
        <div className="mb-4 flex gap-2">
          {(["pending", "approved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
            Nothing here.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex gap-3">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {item.kind === "product" ? <Package className="h-6 w-6 text-muted-foreground" /> : <Wrench className="h-6 w-6 text-muted-foreground" />}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-bold text-foreground">{item.title}</h3>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        {item.kind}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                    {item.price ? <p className="mt-1 text-sm font-semibold text-foreground">R{item.price}</p> : null}
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                    <span
                      className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${
                        item.approval_status === "approved"
                          ? "text-success"
                          : item.approval_status === "rejected"
                          ? "text-destructive"
                          : "text-amber-500 dark:text-amber-400"
                      }`}
                    >
                      {item.approval_status === "approved" ? (
                        <><CheckCircle className="h-3 w-3" /> Approved</>
                      ) : item.approval_status === "rejected" ? (
                        <><XCircle className="h-3 w-3" /> Rejected</>
                      ) : (
                        <><Clock className="h-3 w-3" /> Pending</>
                      )}
                    </span>
                  </div>
                </div>

                {item.approval_status !== "approved" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => updateStatus(item, "approved")}
                      className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(item, "rejected")}
                      className="flex-1 rounded-lg border border-border bg-card py-2 text-sm font-semibold text-foreground hover:bg-secondary"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {item.approval_status === "approved" && (
                  <div className="mt-3">
                    <button
                      onClick={() => updateStatus(item, "pending")}
                      className="w-full rounded-lg border border-border bg-card py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary"
                    >
                      Move back to pending
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </>
        )}

        {tab === "users" && (
          <>
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, campus…"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {usersLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
                No users found.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((u) => {
                  const current: AppRole = u.roles.includes("seller")
                    ? "seller"
                    : u.roles.includes("buyer")
                    ? "buyer"
                    : "buyer";
                  const isAdmin = u.roles.includes("admin");
                  const saving = savingUserId === u.user_id;
                  return (
                    <div key={u.user_id} className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold text-foreground">{u.full_name}</h3>
                          {u.email && <p className="truncate text-xs text-muted-foreground">{u.email}</p>}
                          {u.campus && <p className="truncate text-xs text-muted-foreground">{u.campus}</p>}
                        </div>
                        {isAdmin && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                            Admin
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Account plan
                        </p>
                        <div className="flex gap-2">
                          {(["buyer", "seller"] as const).map((r) => (
                            <button
                              key={r}
                              disabled={saving || current === r}
                              onClick={() => setUserRole(u, r)}
                              className={`flex-1 rounded-lg py-2 text-sm font-bold capitalize transition-colors disabled:opacity-60 ${
                                current === r
                                  ? "bg-primary text-primary-foreground"
                                  : "border border-border bg-card text-foreground hover:bg-secondary"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        disabled={saving}
                        onClick={() => toggleAdmin(u)}
                        className="mt-2 w-full rounded-lg border border-border bg-card py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-60"
                      >
                        {isAdmin ? "Revoke admin access" : "Grant admin access"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "subscriptions" && (
          <>
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                placeholder="Search sellers…"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            {subLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-3">
                {sellers
                  .filter((s) => {
                    if (!subSearch.trim()) return true;
                    const q = subSearch.toLowerCase();
                    return (
                      s.full_name.toLowerCase().includes(q) ||
                      (s.email || "").toLowerCase().includes(q) ||
                      (s.campus || "").toLowerCase().includes(q)
                    );
                  })
                  .map((s) => {
                    const sub = s.subscription;
                    const isActive =
                      sub?.status === "active" && (!sub.expires_at || new Date(sub.expires_at) > new Date());
                    const saving = savingSubId === s.user_id;
                    return (
                      <div key={s.user_id} className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-bold text-foreground">{s.full_name}</h3>
                            {s.email && <p className="truncate text-xs text-muted-foreground">{s.email}</p>}
                            {s.campus && <p className="truncate text-xs text-muted-foreground">{s.campus}</p>}
                          </div>
                          {isActive ? (
                            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                              {sub!.tier} · active
                            </span>
                          ) : (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                              No plan
                            </span>
                          )}
                        </div>
                        {sub?.expires_at && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {isActive ? "Expires " : "Expired "} {new Date(sub.expires_at).toLocaleDateString()}
                          </p>
                        )}

                        <p className="mt-3 text-[11px] font-medium text-muted-foreground">
                          Approve after WhatsApp payment is received:
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            disabled={saving}
                            onClick={() => activatePlan(s.user_id, "basic", 1, 75)}
                            className="rounded-lg border border-border bg-card py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-60"
                          >
                            Approve Basic<br /><span className="text-[10px] font-normal text-muted-foreground">R75 · 10 uploads / 1mo</span>
                          </button>
                          <button
                            disabled={saving}
                            onClick={() => activatePlan(s.user_id, "premium", 1, 150)}
                            className="rounded-lg border-2 border-primary bg-primary/10 py-2 text-xs font-bold text-primary hover:bg-primary/20 disabled:opacity-60"
                          >
                            Approve Premium<br /><span className="text-[10px] font-normal opacity-80">R150 · Unlimited / 1mo</span>
                          </button>
                        </div>

                        {isActive && (
                          <button
                            disabled={saving}
                            onClick={() => cancelPlan(s.user_id)}
                            className="mt-2 w-full rounded-lg border border-border bg-card py-2 text-xs font-semibold text-destructive hover:bg-secondary disabled:opacity-60"
                          >
                            Cancel subscription
                          </button>
                        )}
                      </div>
                    );
                  })}
                {sellers.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
                    No sellers yet.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;