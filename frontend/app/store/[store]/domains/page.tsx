"use client";

import React from "react";
import { useStoreCtx } from "../../../../contexts/StoreContext";
import MerchantAPI from "../../../../lib/merchant-api";
import Icon from "../../../../components/AppIcon";

type TabKey = "connect" | "transfer" | "manage";

interface DomainRecord {
  id: string;
  domain: string;
  type: "custom" | "system";
  status: string;
  isPrimary: boolean;
  sslStatus: string;
  verificationToken?: string;
  createdAt?: string;
  verifiedAt?: string;
}

interface DnsInstructions {
  txt: { name: string; type: string; value: string; description: string };
  cname: { name: string; type: string; value: string; description: string };
  aRecords: Array<{ type: string; value: string; description: string }>;
  instructions: string[];
}

export default function Page() {
  const [active, setActive] = React.useState<TabKey>("manage");
  const { storeSlug, setPageTitle } = useStoreCtx();
  const [fetchedStore, setFetchedStore] = React.useState<any>(null);
  const [loadingStore, setLoadingStore] = React.useState<boolean>(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Use the slug from the URL/Context to fetch correct store details
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!storeSlug) return;
      try {
        setLoadingStore(true);
        const response: any = await MerchantAPI.store.getBySlug(storeSlug);
        if (mounted) setFetchedStore(response?.data || response);
      } catch (err) {
        console.error("Error fetching store by slug:", err);
      } finally {
        if (mounted) setLoadingStore(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [storeSlug]);

  React.useEffect(() => {
    setPageTitle("Domains & Connectivity");
  }, [setPageTitle]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  function deriveStoreSlug(store: any): string | undefined {
    if (!store) return undefined;
    return (
      store?.slug ||
      store?.storeSlug ||
      store?.name?.toString()?.toLowerCase()?.replace(/\s+/g, "-") ||
      undefined
    );
  }

  const displaySlug = storeSlug || deriveStoreSlug(fetchedStore);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header inside content */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
            <Icon name="Globe" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Domains & Connectivity</h1>
            <p className="text-slate-500 font-medium">Connect, transfer, and manage your store domains.</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3">
          <button
            onClick={() => setActive("manage")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${active === 'manage' ? 'bg-[#1a2333] text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Manage Domains
          </button>
          <button
            onClick={() => setActive("connect")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${active === 'connect' ? 'bg-[#1a2333] text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Connect Domain
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          onClick={() => setActive("connect")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Connect existing
        </button>
        <button
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          onClick={() => alert("Buy new domain (coming soon)")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Buy new domain
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {[
            { key: "connect", label: "Connect domain" },
            { key: "transfer", label: "Transfer domain" },
            { key: "manage", label: "Manage" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${active === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActive(tab.key as TabKey)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {active === "connect" && <ConnectDomainForm onSuccess={handleRefresh} />}
        {active === "transfer" && <TransferDomainForm onSuccess={handleRefresh} />}
        {active === "manage" && <ManageDomains refreshKey={refreshKey} />}
      </div>
    </div>
  );
}

function ConnectDomainForm({ onSuccess }: { onSuccess: () => void }) {
  const [domain, setDomain] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [dnsInstructions, setDnsInstructions] = React.useState<DnsInstructions | null>(null);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setDnsInstructions(null);

    try {
      const res: any = await MerchantAPI.domains.connect({ domain });
      const data = res?.data || res;

      if (data?.dns) {
        setDnsInstructions(data.dns);
        setSuccess(res?.message || "Domain added successfully! Configure the DNS records below.");
        onSuccess();
      } else {
        setSuccess("Domain added successfully!");
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed to connect domain");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleConnect} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Domain Name</label>
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="www.example.com"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          required
        />
        <p className="mt-2 text-xs text-gray-500">Enter your domain without http:// or https://</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Connecting..." : "Get connection instructions"}
      </button>

      {dnsInstructions && <DnsInstructionsPanel dns={dnsInstructions} />}
    </form>
  );
}

function DnsInstructionsPanel({ dns }: { dns: DnsInstructions }) {
  return (
    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-6">
      <h3 className="font-semibold text-gray-900">DNS Configuration Required</h3>
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <span className="text-xs font-semibold text-blue-600 uppercase">TXT Record</span>
        <div className="grid grid-cols-3 gap-4 text-sm mt-2">
          <div><span className="text-gray-500 text-xs text-nowrap">Name</span><p className="font-mono">{dns.txt.name}</p></div>
          <div><span className="text-gray-500 text-xs">Type</span><p className="font-mono">{dns.txt.type}</p></div>
          <div className="col-span-3">
            <span className="text-gray-500 text-xs">Value</span>
            <p className="font-mono text-xs break-all bg-gray-50 p-2 rounded mt-1">{dns.txt.value}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <span className="text-xs font-semibold text-orange-600 uppercase">CNAME Record</span>
        <div className="grid grid-cols-3 gap-4 text-sm mt-2">
          <div><span className="text-gray-500 text-xs">Name</span><p className="font-mono">{dns.cname.name}</p></div>
          <div><span className="text-gray-500 text-xs">Type</span><p className="font-mono">{dns.cname.type}</p></div>
          <div><span className="text-gray-500 text-xs">Points to</span><p className="font-mono">{dns.cname.value}</p></div>
        </div>
      </div>
      <div className="text-sm text-gray-600">
        <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
        <ol className="list-decimal pl-5 space-y-1">
          {dns.instructions.map((inst, i) => <li key={i}>{inst}</li>)}
        </ol>
      </div>
    </div>
  );
}

function TransferDomainForm({ onSuccess }: { onSuccess: () => void }) {
  const [domain, setDomain] = React.useState("");
  const [authCode, setAuthCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res: any = await MerchantAPI.domains.transfer({ domain, authCode });
      setSuccess(res?.message || "Domain transfer initiated successfully!");
      setDomain("");
      setAuthCode("");
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed to initiate transfer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleTransfer} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Domain Name</label>
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Authorization Code (EPP)</label>
        <input
          value={authCode}
          onChange={(e) => setAuthCode(e.target.value)}
          placeholder="XXXX-XXXX-XXXX"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          required
        />
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}
      <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-5 py-3 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {loading ? "Starting transfer..." : "Start transfer"}
      </button>
    </form>
  );
}

function ManageDomains({ refreshKey }: { refreshKey: number }) {
  const { storeSlug, storeId } = useStoreCtx();
  const [domains, setDomains] = React.useState<DomainRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [initializing, setInitializing] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (storeSlug && storeId) {
      setInitializing(false);
      loadDomains();
    }
  }, [refreshKey, storeSlug, storeId]);

  async function loadDomains() {
    if (!storeSlug || !storeId) return;
    setLoading(true);
    try {
      const d: any = await MerchantAPI.domains.list();
      const payload = d?.data || d || {};
      setDomains(payload.domains || []);
    } catch (err) {
      console.error("Error loading domains:", err);
      // If we get an error, we still want to show the system domain fallback
      setDomains([]);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  }

  const systemDomain = `${process.env.NEXT_PUBLIC_PLATFORM_URL || "localhost:3000"}/hub/${storeSlug}/live`;
  const connected: DomainRecord[] = domains.length ? domains : [
    { id: "system", domain: systemDomain, status: "Connected", type: "system", isPrimary: true, sslStatus: "active" }
  ];

  async function handleAction(type: string, id: string, domain: string) {
    setActionLoading(`${type}-${id}`);
    try {
      if (type === 'primary') await MerchantAPI.domains.setPrimary(domain);
      if (type === 'verify') await MerchantAPI.domains.verify(domain);
      if (type === 'delete') await MerchantAPI.domains.delete(id);
      await loadDomains();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  if (initializing) return (
    <div className="py-20 text-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-slate-500 font-medium">Syncing store configuration...</p>
    </div>
  );

  if (loading && domains.length === 0) return (
    <div className="py-20 text-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-slate-500 font-medium">Loading domains...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Connected domains</h2>
      <div className="divide-y border rounded-xl overflow-hidden">
        {connected.map((d) => (
          <div key={d.id || d.domain} className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div>
              <p className="font-medium text-gray-900">{d.domain}</p>
              <div className="flex gap-2 mt-1">
                {d.isPrimary && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Primary</span>}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${d.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {d.status === "Pending" && d.type !== "system" && (
                <button className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50" onClick={() => handleAction('verify', d.id, d.domain)} disabled={!!actionLoading}>Verify</button>
              )}
              {d.status === "Connected" && !d.isPrimary && (
                <button className="text-xs border px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50" onClick={() => handleAction('primary', d.id, d.domain)} disabled={!!actionLoading}>Set primary</button>
              )}
              {d.type !== "system" && (
                <button className="text-xs text-red-600 hover:text-red-700 p-2" onClick={() => handleAction('delete', d.id, d.domain)} disabled={!!actionLoading}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DnsInstructionsPanelWrapper({ dns }: { dns: DnsInstructions }) {
  return <DnsInstructionsPanel dns={dns} />;
}
