import React, { useRef, useState, useEffect } from 'react';
import { 
  Film, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Share2, 
  Maximize2,
  Volume2,
  VolumeX,
  Video
} from 'lucide-react';

interface HouseVisitVideoModalProps {
  videoUrl?: string | null;
  videoBlobUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
  houseTitle?: string;
  modelName?: string;
  durationSeconds?: number;
  onRecordAgain?: () => void;
}

export const HouseVisitVideoModal: React.FC<HouseVisitVideoModalProps> = ({
  videoUrl,
  videoBlobUrl,
  isOpen,
  onClose,
  houseTitle,
  modelName,
  durationSeconds = 12,
  onRecordAgain,
}) => {
  const activeVideoUrl = videoBlobUrl || videoUrl || null;
  const displayName = modelName || houseTitle || 'Architectural House Visit';

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && activeVideoUrl && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Auto-play was prevented by browser, awaiting interaction:', e);
        setIsPlaying(false);
      });
    }
  }, [isOpen, activeVideoUrl]);

  if (!isOpen || !activeVideoUrl) return null;

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleDownload = () => {
    if (!activeVideoUrl) return;
    const a = document.createElement('a');
    a.href = activeVideoUrl;
    const filename = `${displayName.toLowerCase().replace(/\s+/g, '-')}-house-visit-tour.webm`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div 
      id="house-visit-video-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">{displayName}</h3>
                <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> House Visit Video
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Smooth 60FPS Walkthrough with Automated Operable Doors &amp; High-Definition PBR Lighting
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
          <video
            ref={videoRef}
            src={activeVideoUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-contain"
          />

          {/* Quick Play/Pause Center Overlay on Click */}
          <div 
            className="absolute inset-0 cursor-pointer flex items-center justify-center"
            onClick={handleTogglePlay}
          >
            {!isPlaying && (
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/95 text-black shadow-xl shadow-cyan-500/50 transform transition hover:scale-110">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
            )}
          </div>

          {/* Video Floating Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between opacity-95 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleTogglePlay}
                className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-600/50 transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={handleRestart}
                className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 transition-colors"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 transition-colors"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="text-[11px] sm:text-xs font-mono text-slate-300 font-medium bg-black/50 px-2.5 py-1 rounded border border-white/10 hidden sm:inline-block">
                HD Walkthrough • Real Scale
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onRecordAgain && (
                <button
                  onClick={onRecordAgain}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold transition"
                  title="Re-record another house visit tour"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Re-Record</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (videoRef.current?.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                  }
                }}
                className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">Includes synchronized front door openings, high-efficiency interior lighting, and hydraulic door glide.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleShare}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{copied ? 'Link Copied!' : 'Share Tour'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Download Video</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
