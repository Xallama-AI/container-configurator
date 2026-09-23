import React from 'react';
import { ContainerModelConfig, SitePlanningConfig, UserAccount } from '../types';
import { calculateConfigurationCost } from '../utils/calculator';
import { generateArchitecturalPdf } from '../utils/pdfGenerator';
import { BrandLogo } from './BrandLogo';
import { X, Printer, Download, CheckCircle2, ShieldCheck, HardHat } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface SpecSheetModalProps {
  modelConfig: ContainerModelConfig;
  siteConfig: SitePlanningConfig;
  currentUser: UserAccount | null;
  onClose: () => void;
}

export const SpecSheetModal: React.FC<SpecSheetModalProps> = ({
  modelConfig,
  siteConfig,
  currentUser,
  onClose,
}) => {
  const cost = calculateConfigurationCost(modelConfig);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    soundFx.playSuccess();
    generateArchitecturalPdf(modelConfig, siteConfig, currentUser?.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-2xl bg-[#090e17] border border-[#1e293b] shadow-2xl text-slate-200 overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Modal Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#06090e] print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-white text-sm">
              BEAST UI ARCHITECTURAL CAD SPECIFICATION
            </span>
            <span className="rounded bg-[#00f0ff]/20 px-2 py-0.5 text-[10px] font-mono text-[#00f0ff] border border-[#00f0ff]/30">
              1:1 SCALE VERIFIED
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 rounded-lg bg-[#00f0ff] hover:bg-[#00d2df] px-3 py-1.5 text-xs font-heading font-bold text-black shadow-[0_0_15px_rgba(0,240,255,0.3)] transition"
              title="Download Certified Architectural PDF Specification"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-[#162032] hover:bg-[#1f2d45] px-3 py-1.5 text-xs font-mono text-white border border-slate-700 hover:border-[#00f0ff]/40 transition"
            >
              <Printer className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Blueprint Spec Sheet Content */}
        <div className="p-8 space-y-6 text-xs">
          {/* Brand Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 print:border-black">
            <div className="flex items-center gap-3">
              <BrandLogo size={42} showText={true} />
            </div>
            <div className="text-right font-mono text-[11px] text-slate-400 print:text-gray-600">
              <div>BEAST CAD SPEC ID: BU-{(modelConfig.lengthFt * 142).toString(16).toUpperCase()}</div>
              <div>DATE: {new Date().toLocaleDateString()}</div>
              <div>CLIENT: {currentUser ? currentUser.name : 'Executive Client'}</div>
            </div>
          </div>

          {/* Title & Overview */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono text-[#00f0ff] uppercase tracking-widest block font-bold">
                BEAST UI MODULAR SYSTEM BLUEPRINT
              </span>
              <h2 className="font-heading text-2xl font-bold text-white print:text-black">
                {modelConfig.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-400 block">TURNKEY ESTIMATE</span>
              <span className="font-heading text-xl font-bold text-[#00f0ff] print:text-black">
                ${cost.totalUsd.toLocaleString()} USD
              </span>
            </div>
          </div>

          {/* Technical Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-[#111827] border border-slate-800 print:border-gray-300 print:bg-gray-50">
              <span className="text-slate-500 block text-[10px]">LENGTH × WIDTH</span>
              <span className="font-bold text-white print:text-black">
                {modelConfig.lengthFt} ft × {modelConfig.widthFt} ft
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#111827] border border-slate-800 print:border-gray-300 print:bg-gray-50">
              <span className="text-slate-500 block text-[10px]">TOTAL FLOOR AREA</span>
              <span className="font-bold text-white print:text-black">
                {modelConfig.lengthFt * modelConfig.widthFt} sq.ft
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#111827] border border-slate-800 print:border-gray-300 print:bg-gray-50">
              <span className="text-slate-500 block text-[10px]">CEILING HEIGHT</span>
              <span className="font-bold text-white print:text-black">
                {modelConfig.heightFt} ft High Cube
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#111827] border border-slate-800 print:border-gray-300 print:bg-gray-50">
              <span className="text-slate-500 block text-[10px]">INSULATION RATING</span>
              <span className="font-bold text-white print:text-black">
                R-{modelConfig.insulationRValue} Spray Foam
              </span>
            </div>
          </div>

          {/* Architectural Bill of Materials Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden print:border-gray-300">
            <div className="bg-[#111827] px-4 py-2.5 font-mono font-bold text-xs text-slate-300 border-b border-slate-800 uppercase print:bg-gray-100 print:text-black">
              Certified Systems &amp; Materials Breakdown
            </div>
            <div className="divide-y divide-slate-800/60 font-mono text-xs print:divide-gray-200">
              <div className="px-4 py-2 flex justify-between">
                <span className="text-slate-300 print:text-black">
                  Structural Shell: Corten Steel ISO Container, Corner Castings, Heavy Tubular Rails
                </span>
                <span className="font-semibold text-white print:text-black">
                  ${cost.containerShell.toLocaleString()}
                </span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span className="text-slate-300 print:text-black">
                  Openings: Double-Glazed Argon Filled Thermal Sliders &amp; Picture Windows
                </span>
                <span className="font-semibold text-white print:text-black">
                  ${cost.openingsGlazing.toLocaleString()}
                </span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span className="text-slate-300 print:text-black">
                  Thermal Envelope: R-21 Closed-Cell Polyurethane Foam + Thermal Break
                </span>
                <span className="font-semibold text-white print:text-black">
                  ${cost.insulationThermal.toLocaleString()}
                </span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span className="text-slate-300 print:text-black">
                  Interior Fit-out: {modelConfig.interiorStyle} with {(modelConfig.partitions || []).length} Furnished Partitions
                </span>
                <span className="font-semibold text-white print:text-black">
                  ${cost.interiorFinishes.toLocaleString()}
                </span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span className="text-slate-300 print:text-black">
                  Mechanical/Electrical: 200A Smart Circuit Logic Panel, Heat Pump, PEX-A Plumbing
                </span>
                <span className="font-semibold text-white print:text-black">
                  ${cost.mepSystems.toLocaleString()}
                </span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span className="text-slate-300 print:text-black">
                  Rooftop: {modelConfig.roofOption} ({modelConfig.solarCapacityKw} kW PV Solar System)
                </span>
                <span className="font-semibold text-white print:text-black">
                  ${cost.roofSystem.toLocaleString()}
                </span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span className="text-slate-300 print:text-black">
                  Foundation Engineering: {modelConfig.foundationType.replace(/-/g, ' ')}
                </span>
                <span className="font-semibold text-white print:text-black">
                  ${cost.foundationEstimate.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Site Planning Tolerances */}
          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 text-xs font-mono space-y-1.5 print:border-gray-300 print:bg-gray-50">
            <span className="font-bold text-white print:text-black block">
              Site Planning &amp; Setback Compliance
            </span>
            <p className="text-slate-400 print:text-gray-600 text-[11px]">
              Configured for lot dimensions: {siteConfig.lotWidthFt} ft wide × {siteConfig.lotDepthFt} ft deep. Front setback: {siteConfig.setbackFrontFt}ft, Rear: {siteConfig.setbackRearFt}ft, Sides: {siteConfig.setbackSideFt}ft.
            </p>
          </div>

          {/* Signoff stamp */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800 text-[11px] font-mono text-slate-500 print:border-gray-300">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified for Structural Integrity &bull; Grid &amp; Logic</span>
            </div>
            <div>Authorized Signature: _______________________</div>
          </div>
        </div>
      </div>
    </div>
  );
};
