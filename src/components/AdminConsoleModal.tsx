import React, { useState } from 'react';
import { UserAccount, SavedConfiguration, SubdomainConfig } from '../types';
import { BrandLogo } from './BrandLogo';
import { 
  ShieldCheck, 
  Users, 
  Globe, 
  FolderCheck, 
  Check, 
  X, 
  Clock, 
  Copy, 
  RefreshCw, 
  ExternalLink, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Building,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminConsoleModalProps {
  currentUser: UserAccount;
  usersList: UserAccount[];
  savedConfigs: SavedConfiguration[];
  subdomainConfig: SubdomainConfig;
  onUpdateUserRole: (userId: string, newRole: UserAccount['role']) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateSubdomainConfig: (config: SubdomainConfig) => void;
  onClose: () => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({
  currentUser,
  usersList,
  savedConfigs,
  subdomainConfig,
  onUpdateUserRole,
  onDeleteUser,
  onUpdateSubdomainConfig,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'subdomain' | 'configs'>('users');
  const [subdomainInput, setSubdomainInput] = useState(subdomainConfig.subdomain || 'configurator.gridandlogic.com');
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const pendingCount = usersList.filter((u) => u.role === 'pending_client').length;
  const verifiedCount = usersList.filter((u) => u.role === 'verified_client').length;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApproveClient = (userId: string) => {
    onUpdateUserRole(userId, 'verified_client');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleVerifyDns = () => {
    setIsVerifyingDns(true);
    setTimeout(() => {
      onUpdateSubdomainConfig({
        ...subdomainConfig,
        subdomain: subdomainInput,
        status: 'active',
        sslStatus: 'active',
        verifiedAt: new Date().toISOString(),
      });
      setIsVerifyingDns(false);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl bg-[#0d121c] border border-[#1e293b] shadow-2xl text-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#090e17]">
          <div className="flex items-center gap-3">
            <BrandLogo size={32} showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-lg text-white">
                  BEAST UI EXECUTIVE CONSOLE
                </h2>
                <span className="rounded bg-[#00f0ff]/20 px-2 py-0.5 text-[10px] font-mono text-[#00f0ff] border border-[#00f0ff]/40 font-bold">
                  MASTER OWNER
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Admin: {currentUser.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-slate-800/80 hover:bg-slate-700 p-1.5 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-[#1e293b] bg-[#0d121c] text-xs font-mono">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold transition ${
              activeTab === 'users'
                ? 'border-[#00f0ff] text-[#00f0ff]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Client Verification ({pendingCount} pending)</span>
          </button>

          <button
            onClick={() => setActiveTab('subdomain')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold transition ${
              activeTab === 'subdomain'
                ? 'border-[#00f0ff] text-[#00f0ff]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Subdomain Linking</span>
          </button>

          <button
            onClick={() => setActiveTab('configs')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold transition ${
              activeTab === 'configs'
                ? 'border-[#00f0ff] text-[#00f0ff]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderCheck className="w-4 h-4" />
            <span>Client Designs ({savedConfigs.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: USERS & CLIENT VERIFICATION */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl bg-[#131b2a] p-4 border border-slate-800">
                  <span className="text-xs font-mono text-slate-400 block mb-1">Total Registered</span>
                  <span className="text-2xl font-bold font-mono text-white">{usersList.length}</span>
                </div>
                <div className="rounded-xl bg-[#131b2a] p-4 border border-slate-800">
                  <span className="text-xs font-mono text-amber-400 block mb-1">Pending Approval</span>
                  <span className="text-2xl font-bold font-mono text-amber-400">{pendingCount}</span>
                </div>
                <div className="rounded-xl bg-[#131b2a] p-4 border border-slate-800">
                  <span className="text-xs font-mono text-emerald-400 block mb-1">Verified Clients</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">{verifiedCount}</span>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-xl border border-slate-800 bg-[#090e17] overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-mono text-xs font-bold text-slate-300 uppercase">
                    Client Accounts &amp; Access Controls
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Google Sign-In Registered
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {usersList.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#162032] border border-slate-700 text-[#00f0ff] font-bold font-heading">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{user.name}</span>
                            {user.role === 'super_admin' && (
                              <span className="rounded bg-[#00f0ff]/20 px-2 py-0.5 text-[10px] font-mono text-[#00f0ff] border border-[#00f0ff]/40">
                                OWNER / ADMIN
                              </span>
                            )}
                            {user.role === 'verified_client' && (
                              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/40">
                                VERIFIED CLIENT
                              </span>
                            )}
                            {user.role === 'pending_client' && (
                              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-400 border border-amber-500/40">
                                AWAITING VERIFICATION
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {user.email} &bull; {user.company || 'Private Client'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {user.role === 'pending_client' && (
                          <button
                            onClick={() => handleApproveClient(user.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 text-xs font-bold transition shadow"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Verify &amp; Grant Access</span>
                          </button>
                        )}

                        {user.role === 'verified_client' && (
                          <button
                            onClick={() => onUpdateUserRole(user.id, 'pending_client')}
                            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-mono text-slate-300 border border-slate-700 transition"
                          >
                            Suspend Access
                          </button>
                        )}

                        {user.role !== 'super_admin' && (
                          <button
                            onClick={() => onDeleteUser(user.id)}
                            className="rounded-lg bg-red-950/40 hover:bg-red-900/60 p-1.5 text-red-400 border border-red-800/40 transition"
                            title="Remove account"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBDOMAIN LINKING MANAGER */}
          {activeTab === 'subdomain' && (
            <div className="space-y-6 max-w-2xl">
              <div className="rounded-xl bg-[#131b2a] p-5 border border-slate-800 space-y-4">
                <div>
                  <h3 className="font-heading text-base font-bold text-white mb-1">
                    Connect Custom Subdomain to Grid &amp; Logic
                  </h3>
                  <p className="text-xs text-slate-400">
                    Host your 3D Container House Configurator directly under your brand’s custom domain (e.g., configurator.gridandlogic.com).
                  </p>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1.5">
                    Your Target Subdomain
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={subdomainInput}
                      onChange={(e) => setSubdomainInput(e.target.value)}
                      placeholder="configurator.gridandlogic.com"
                      className="flex-1 rounded-lg bg-[#090e17] border border-slate-700 px-3 py-2 text-xs font-mono text-white focus:border-[#00f0ff] focus:outline-none"
                    />
                    <button
                      onClick={handleVerifyDns}
                      disabled={isVerifyingDns}
                      className="flex items-center gap-2 rounded-lg bg-[#00f0ff] hover:bg-[#00d2df] text-black font-bold px-4 py-2 text-xs transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingDns ? 'animate-spin' : ''}`} />
                      <span>{isVerifyingDns ? 'Validating DNS...' : 'Verify DNS'}</span>
                    </button>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#090e17] border border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        subdomainConfig.status === 'active'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                          : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-slate-300">
                      Status: <strong>{subdomainConfig.status === 'active' ? 'DNS Linked & Active' : 'Pending Verification'}</strong>
                    </span>
                  </div>
                  <span className="text-slate-500">
                    SSL: <span className="text-emerald-400">Automatic Let&apos;s Encrypt TLS</span>
                  </span>
                </div>
              </div>

              {/* DNS Records to Configure */}
              <div className="rounded-xl border border-slate-800 bg-[#090e17] p-5 space-y-4">
                <h4 className="font-mono text-xs font-bold text-slate-300 uppercase">
                  Required DNS Records (Add at GoDaddy / Cloudflare / Namecheap)
                </h4>

                {/* CNAME Record */}
                <div className="rounded-lg bg-[#131b2a] p-3 border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[#00f0ff] font-bold">1. CNAME Record (Routing)</span>
                    <button
                      onClick={() => copyToClipboard('ghs.googlehosted.com', 'cname')}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'cname' ? 'Copied!' : 'Copy Value'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Type:</span>
                      <span className="text-white">CNAME</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Host / Name:</span>
                      <span className="text-white">configurator</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Target / Value:</span>
                      <span className="text-white truncate">ghs.googlehosted.com</span>
                    </div>
                  </div>
                </div>

                {/* TXT Verification Record */}
                <div className="rounded-lg bg-[#131b2a] p-3 border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[#00f0ff] font-bold">2. TXT Record (Security Verification)</span>
                    <button
                      onClick={() => copyToClipboard('google-site-verification=g_l_container_arch_98412', 'txt')}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'txt' ? 'Copied!' : 'Copy Value'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Type:</span>
                      <span className="text-white">TXT</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Host / Name:</span>
                      <span className="text-white">@</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Value:</span>
                      <span className="text-white truncate">google-site-verification=...</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Embed Code Widget */}
              <div className="rounded-xl border border-slate-800 bg-[#090e17] p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-xs font-bold text-slate-300 uppercase">
                    Direct Iframe Embed Code for your Main Website
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `<iframe src="https://${subdomainInput}" width="100%" height="800" frameborder="0" allow="camera; xr-spatial-tracking"></iframe>`,
                        'embed'
                      )
                    }
                    className="text-[11px] font-mono text-[#00f0ff] hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedKey === 'embed' ? 'Copied Snippet!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-[#05070a] border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto">
{`<iframe
  src="https://${subdomainInput}"
  width="100%"
  height="800"
  frameborder="0"
  allow="camera; xr-spatial-tracking">
</iframe>`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: SAVED CLIENT DESIGNS */}
          {activeTab === 'configs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold text-slate-300 uppercase">
                  Submitted Client Container Configurations
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {savedConfigs.length} Total Projects
                </span>
              </div>

              {savedConfigs.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-[#090e17] text-slate-500 text-xs font-mono">
                  No saved client configurations submitted yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedConfigs.map((cfg) => (
                    <div
                      key={cfg.id}
                      className="rounded-xl bg-[#131b2a] border border-slate-800 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-white text-sm">{cfg.model.name}</h4>
                          <span className="text-xs text-slate-400 font-mono">
                            Client: {cfg.userName} ({cfg.userEmail})
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#00f0ff] text-sm">
                          ${cfg.estimatedCostUsd.toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#090e17] p-2.5 rounded-lg text-slate-300">
                        <div>
                          <span className="text-slate-500">Dimensions:</span> {cfg.model.lengthFt}ft × {cfg.model.widthFt}ft
                        </div>
                        <div>
                          <span className="text-slate-500">Layout:</span> {cfg.model.layoutType}
                        </div>
                        <div>
                          <span className="text-slate-500">Lot Size:</span> {cfg.site.lotWidthFt}ft × {cfg.site.lotDepthFt}ft
                        </div>
                        <div>
                          <span className="text-slate-500">Solar:</span> {cfg.model.solarCapacityKw} kW
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-slate-500">
                          Updated: {new Date(cfg.updatedAt).toLocaleDateString()}
                        </span>
                        <span className="rounded bg-[#00f0ff]/10 text-[#00f0ff] px-2 py-0.5 text-[10px] font-mono font-semibold">
                          Engineering Ready
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
