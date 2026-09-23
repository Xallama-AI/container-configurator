import React, { useState } from 'react';
import { UserAccount } from '../types';
import { BrandLogo } from './BrandLogo';
import { 
  ShieldCheck, 
  LogIn, 
  User, 
  Lock, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Mail,
  Sparkles
} from 'lucide-react';

interface AuthModalProps {
  currentUser: UserAccount | null;
  onLogin: (user: UserAccount) => void;
  onClose?: () => void;
  required?: boolean;
}

const FIRST_OWNER_EMAIL = 'abdulahad2086907@gmail.com';

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  onLogin,
  onClose,
  required = false,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Quick One-Click Google Login as Brand Owner / Admin
  const handleSignInAsOwner = () => {
    setIsSigningIn(true);
    setTimeout(() => {
      const ownerAccount: UserAccount = {
        id: 'owner-admin-1',
        email: FIRST_OWNER_EMAIL,
        name: 'Abdul Ahad (Grid & Logic Owner)',
        role: 'super_admin',
        isFirstOwner: true,
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        company: 'Grid & Logic Modular Systems',
      };
      onLogin(ownerAccount);
      setIsSigningIn(false);
    }, 600);
  };

  // Sign in as a test Client awaiting Admin approval
  const handleSignInAsPendingClient = () => {
    setIsSigningIn(true);
    setTimeout(() => {
      const clientAccount: UserAccount = {
        id: `client-${Date.now()}`,
        email: customEmail.trim() || 'sarah.client@example.com',
        name: customName.trim() || 'Sarah Jenkins (Prospective Client)',
        role: 'pending_client',
        isFirstOwner: false,
        createdAt: new Date().toISOString(),
        company: 'Eco-Living Sites LLC',
      };
      onLogin(clientAccount);
      setIsSigningIn(false);
    }, 600);
  };

  // Sign in as an already Verified Client
  const handleSignInAsVerifiedClient = () => {
    setIsSigningIn(true);
    setTimeout(() => {
      const verifiedClient: UserAccount = {
        id: 'client-verified-1',
        email: 'david.architect@gmail.com',
        name: 'David Vance (Verified Client)',
        role: 'verified_client',
        isFirstOwner: false,
        verifiedAt: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        company: 'Vance Architecture Studio',
      };
      onLogin(verifiedClient);
      setIsSigningIn(false);
    }, 600);
  };

  // Custom Google Email Sign Up
  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;

    setIsSigningIn(true);
    setTimeout(() => {
      const isOwner = customEmail.toLowerCase() === FIRST_OWNER_EMAIL.toLowerCase();
      const user: UserAccount = {
        id: `user-${Date.now()}`,
        email: customEmail.toLowerCase(),
        name: customName || customEmail.split('@')[0],
        role: isOwner ? 'super_admin' : 'pending_client',
        isFirstOwner: isOwner,
        verifiedAt: isOwner ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
      };
      onLogin(user);
      setIsSigningIn(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0d121c] border border-[#1e293b] p-6 shadow-2xl text-slate-200">
        {/* Glow accent */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#00f0ff]/15 blur-3xl rounded-full pointer-events-none" />

        {/* Header with Brand Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <BrandLogo size={44} showText={false} className="mb-3" />
          <h2 className="font-heading text-xl font-bold text-white tracking-wide">
            GRID <span className="text-[#00f0ff]">&amp;</span> LOGIC PORTAL
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Google Sign-in required for 3D container house planning, custom site blueprints, and admin verification.
          </p>
        </div>

        {/* Google Authentication Section */}
        <div className="space-y-4">
          {/* Primary Owner / Admin Button */}
          <button
            onClick={handleSignInAsOwner}
            disabled={isSigningIn}
            className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-[#00f0ff]/20 to-[#00b4d8]/10 border border-[#00f0ff]/50 p-3 text-left transition hover:border-[#00f0ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 border border-[#00f0ff]/40 text-[#00f0ff]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">Sign In as Brand Owner</span>
                    <span className="rounded bg-[#00f0ff]/20 px-1.5 py-0.2 text-[9px] font-mono text-[#00f0ff] font-bold">
                      ADMIN
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block font-mono">
                    {FIRST_OWNER_EMAIL}
                  </span>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-[#00f0ff]" />
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
              *First account owner is granted master administrator privileges.
            </div>
          </button>

          {/* Standard Google Sign-In with Custom Email */}
          <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-[#0d121c] px-3 text-[11px] font-mono text-slate-500 uppercase">
                Or Sign In With Google Account
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Your Google Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full rounded-lg bg-[#162032] border border-slate-700 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#00f0ff] focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Full Name / Organization (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera, Site Planning Inc."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full rounded-lg bg-[#162032] border border-slate-700 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#00f0ff] focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSigningIn || !customEmail}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-black font-semibold py-2.5 text-xs transition disabled:opacity-50"
            >
              {/* Google G Logo SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isSigningIn ? 'Authenticating with Google...' : 'Continue with Google'}</span>
            </button>
          </form>

          {/* Quick Demo Test Buttons */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-mono">Quick Demo Roles:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSignInAsVerifiedClient}
                className="text-[#00f0ff] hover:underline"
              >
                Verified Client
              </button>
              <span className="text-slate-600">&bull;</span>
              <button
                type="button"
                onClick={handleSignInAsPendingClient}
                className="text-amber-400 hover:underline"
              >
                Pending Client
              </button>
            </div>
          </div>
        </div>

        {/* Verification policy notice */}
        <div className="mt-4 rounded-lg bg-[#111827] p-2.5 text-[10px] text-slate-400 flex items-start gap-2 border border-slate-800">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Client Verification Policy:</strong> New client accounts are queued for verification by the Grid &amp; Logic administrator before final construction blueprint export.
          </span>
        </div>

        {/* Optional Close if not strictly required */}
        {!required && onClose && (
          <button
            onClick={onClose}
            className="mt-3 w-full py-1 text-center text-xs text-slate-500 hover:text-slate-300"
          >
            Cancel and continue exploring
          </button>
        )}
      </div>
    </div>
  );
};
