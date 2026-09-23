import React, { useState } from 'react';
import { 
  QrCode, 
  Smartphone, 
  Camera, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Sparkles, 
  Layers, 
  Compass, 
  CheckCircle2 
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface ARMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchLocalAR: () => void;
  appUrl: string;
}

export const ARMobileModal: React.FC<ARMobileModalProps> = ({
  isOpen,
  onClose,
  onLaunchLocalAR,
  appUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      soundFx.playSuccess();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  // Direct QR Code using public QR generator service with high resolution
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&color=00f0ff&bgcolor=090e17&margin=10&data=${encodeURIComponent(
    appUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-[#090d16] border border-[#1e293b] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.95)] text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Cyber Accent Line */}
        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>VIEW IN REAL-WORLD AR</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30">
                  MOBILE
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Project 1:1 true scale container onto your physical plot
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="mt-5 flex flex-col items-center justify-center">
          <div className="relative p-3 rounded-2xl bg-[#0b111e] border border-[#1e293b] shadow-[0_0_30px_rgba(0,240,255,0.15)] flex items-center justify-center">
            {/* Corner Bracket Reticles */}
            <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-[#00f0ff]" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-[#00f0ff]" />
            <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-[#00f0ff]" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-[#00f0ff]" />

            <img
              src={qrCodeImageUrl}
              alt="Scan QR Code to open in AR on Mobile"
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl object-contain"
              loading="eager"
            />
          </div>

          <p className="mt-3 text-xs font-mono text-slate-300 text-center flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Scan with your <strong>iPhone Camera</strong> or <strong>Android Chrome</strong></span>
          </p>
        </div>

        {/* Copyable Web URL */}
        <div className="mt-4 p-2.5 rounded-xl bg-[#0e1626] border border-slate-800 flex items-center justify-between gap-2">
          <div className="overflow-hidden">
            <span className="text-[9px] font-mono uppercase text-slate-400 block mb-0.5">
              Direct Phone Web URL:
            </span>
            <span className="text-xs font-mono text-[#00f0ff] truncate block select-all">
              {appUrl}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shrink-0 ${
              copied
                ? 'bg-emerald-500 text-black'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2">
          <button
            onClick={() => {
              onClose();
              onLaunchLocalAR();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#00b4d8] hover:from-[#00f0ff] hover:to-[#00f0ff] text-black font-bold font-mono text-xs shadow-[0_0_20px_rgba(0,240,255,0.3)] transition"
          >
            <Camera className="w-4 h-4" />
            <span>Launch Camera AR On This Device</span>
          </button>

          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-xs transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in New Browser Tab</span>
          </a>
        </div>
      </div>
    </div>
  );
};
