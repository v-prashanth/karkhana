"use client";

import { useEffect, useState } from "react";
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Ticket, 
  Loader2, 
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar,
  Lock,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";

interface ApiKeyData {
  id: string;
  key_prefix: string;
  name: string;
  scopes: string[];
  last_used_at: string | null;
  created_at: string;
}

export default function IntegrationsPage() {
  const { organization, setOrganization } = useStore();
  const { toast } = useToast();
  
  // State
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  
  const [keyName, setKeyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Fetch API Keys
  const fetchApiKeys = async () => {
    try {
      setIsLoadingKeys(true);
      const res = await fetch("/api/settings/api-keys");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load API keys");
      setKeys(data.keys || []);
    } catch (err: any) {
      toast(err.message || "Could not retrieve API keys", "error");
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  // Generate Key
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      toast("Please provide a name for this API key", "error");
      return;
    }
    if (keys.length >= 5) {
      toast("Maximum limit of 5 active keys reached", "error");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create API key");
      
      setGeneratedKey(data.key);
      setKeyName("");
      toast("API key created successfully", "success");
      fetchApiKeys();
    } catch (err: any) {
      toast(err.message || "Failed to generate API key", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Revoke Key
  const handleRevokeKey = async () => {
    if (!revokingKeyId) return;
    try {
      setIsRevoking(true);
      const res = await fetch("/api/settings/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: revokingKeyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke API key");
      
      toast("API key revoked successfully", "success");
      setRevokingKeyId(null);
      fetchApiKeys();
    } catch (err: any) {
      toast(err.message || "Could not revoke API key", "error");
    } finally {
      setIsRevoking(false);
    }
  };

  // Apply Coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      toast("Please enter a coupon code", "error");
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const res = await fetch("/api/settings/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply coupon");
      
      toast(data.message || "Coupon successfully applied!", "success");
      setCouponCode("");
      
      // Refresh organization settings in Zustand store
      const profileRes = await fetch("/api/auth/profile");
      const profileData = await profileRes.json();
      if (profileData.organization) {
        setOrganization(profileData.organization);
      }
    } catch (err: any) {
      toast(err.message || "Could not apply coupon", "error");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Copy Key Utility
  const copyToClipboard = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setIsCopied(true);
    toast("API key copied to clipboard", "success");
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Format Date Helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <PageHeader 
        title="API & Integrations" 
        subtitle="Connect third-party modules and websites to your workspace" 
        backHref="/settings" 
      />

      <div className="px-5 space-y-8 max-w-4xl mx-auto py-6">
        
        {/* Plan & Coupon Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Subscription Card */}
          <Card className="glass-panel border-accent/20 bg-accent/5">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-[#888]">Subscription Plan</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(255,107,43,0.3)]">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold capitalize text-foreground">
                    {organization?.plan || "Free"} Workspace Plan
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {organization?.plan === "pro" || organization?.plan === "business" || organization?.plan === "starter"
                      ? "Premium features enabled" 
                      : "Upgrade for API integrations & network visibility"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Plan Valid Until:</span>
                <span className="font-semibold text-foreground">
                  {organization?.plan_expires_at ? new Date(organization.plan_expires_at).toLocaleDateString() : "Lifetime"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Coupon Activation Card */}
          <Card className="glass border-white/5 bg-white/[0.01]">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-[#888]">Redeem Coupon</CardTitle>
              <CardDescription>Activate trial plans or promo discounts</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="text"
                    placeholder="e.g. AQUAELITE2025" 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="pl-11 uppercase font-mono tracking-wider border-white/10"
                    disabled={isApplyingCoupon}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isApplyingCoupon || !couponCode.trim()} 
                  className="px-6 h-12 bg-white text-black hover:bg-white/90"
                >
                  {isApplyingCoupon ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Generate API Key Card */}
        <Card className="glass border-white/5 bg-white/[0.01]">
          <CardHeader className="p-6 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Active API Keys</CardTitle>
                <CardDescription>Create tokens to programmatically synchronize leads and query products.</CardDescription>
              </div>
              <span className="text-xs bg-white/5 font-mono px-3 py-1 rounded-full text-muted-foreground border border-white/5">
                Keys: {keys.length} / 5
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">
            
            {/* Generate Key Inline Form */}
            {keys.length < 5 ? (
              <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                <div className="flex-1">
                  <Input
                    placeholder="API Key Name (e.g., WordPress Site)"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    disabled={isGenerating}
                    className="border-white/5 bg-background/50 h-12 text-sm"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isGenerating || !keyName.trim()} 
                  className="sm:w-auto h-12 bg-accent text-white flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Key
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] text-amber-400 text-xs">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>
                  You have reached the maximum of 5 active API keys. Please revoke an existing key to generate a new one.
                </p>
              </div>
            )}

            {/* List Keys */}
            {isLoadingKeys ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Retrieving access keys...</p>
              </div>
            ) : keys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/5 rounded-2xl bg-white/[0.005]">
                <Key className="h-8 w-8 text-muted-foreground mb-3 opacity-60" />
                <p className="text-sm font-bold text-foreground">No active API keys found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[280px] text-center">Generate an API key to securely connect external systems.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div 
                    key={key.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{key.name}</span>
                        <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                          Active
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-mono text-white/50">{key.key_prefix}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Last used: {formatDate(key.last_used_at)}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRevokingKeyId(key.id)}
                      className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-white rounded-xl h-10 w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SHOW GENERATED KEY ONCE MODAL OVERLAY */}
      {generatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-background/80 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/10 bg-[#0c0c0c] p-6 shadow-2xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center shadow-[0_0_25px_rgba(34,197,94,0.25)]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">API Key Generated</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
                Copy this key now. For security purposes, it will never be displayed again.
              </p>
            </div>

            {/* Key Field Display */}
            <div className="flex items-center gap-2 p-3 rounded-xl border border-white/10 bg-black/60">
              <code className="flex-1 text-xs select-all break-all text-white font-mono text-center">
                {generatedKey}
              </code>
              <Button 
                onClick={copyToClipboard}
                size="icon" 
                variant="outline" 
                className="h-10 w-10 shrink-0 border-white/10 text-muted-foreground hover:text-white"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Warnings Alert */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] text-amber-400 text-xs leading-relaxed">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Anyone with access to this key can programmatically register leads into your workspace. Do not share it in open repositories.
              </p>
            </div>

            {/* Dismiss Button */}
            <Button
              onClick={() => {
                setGeneratedKey(null);
                setIsCopied(false);
              }}
              className="w-full h-12 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-white/90"
            >
              I've copied it securely
            </Button>
          </div>
        </div>
      )}

      {/* CONFIRM REVOCATION MODAL OVERLAY */}
      {revokingKeyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-background/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[24px] border border-red-500/20 bg-[#0c0c0c] p-6 shadow-2xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.25)]">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Revoke Access Key?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
                Any website or application currently utilizing this API key will lose permission to connect immediately.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setRevokingKeyId(null)}
                disabled={isRevoking}
                className="flex-1 h-12 border-white/10 text-muted-foreground hover:bg-white/5 text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevokeKey}
                disabled={isRevoking}
                className="flex-1 h-12 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                {isRevoking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Revoke Key
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
