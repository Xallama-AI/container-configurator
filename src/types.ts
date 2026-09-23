export type UnitSystem = 'imperial' | 'metric';

export type LayoutType = 
  | 'single'
  | 'double-wide'
  | 'triple-wide'
  | 'l-shape'
  | 'u-shape'
  | 'stacked-2story'
  | 'cantilever-offset'
  | 'skybridge-compound'
  | 'custom';

export type ExteriorMaterial = 
  | 'corten-steel'
  | 'shou-sugi-ban'
  | 'swiss-larch'
  | 'obsidian-composite'
  | 'concrete-panels'
  | 'alpine-white-stucco';

export type FlooringMaterial = 
  | 'chevron-oak'
  | 'polished-concrete'
  | 'smoked-walnut'
  | 'dark-slate'
  | 'white-terrazzo';

export type GlassTint = 
  | 'low-e-clear'
  | 'privacy-mirror'
  | 'smoked-bronze'
  | 'cyan-solar';

export type RoofOption = 'flat' | 'deck-wood' | 'solar-panels' | 'green-roof';

export type FoundationType = 'concrete-piers' | 'concrete-slab' | 'helical-piles' | 'gravel-pad';

export type InteriorStyle = 'minimalist-oak' | 'industrial-concrete' | 'nordic-white' | 'dark-loft';

export type LoungeType = 
  | 'great-room' 
  | 'tv-media' 
  | 'sunroom-reading' 
  | 'social-conversational' 
  | 'minimalist-studio';

export type KitchenType = 
  | 'chef-island' 
  | 'galley' 
  | 'breakfast-bar' 
  | 'linear-minimal' 
  | 'micro-bar';

export type BathroomType = 
  | 'luxury-spa' 
  | 'modern-ensuite' 
  | 'nordic-wetroom' 
  | 'powder-room' 
  | 'wellness-soak';

export type BedroomType = 
  | 'master-suite' 
  | 'japandi-platform' 
  | 'executive-study' 
  | 'desk-study'
  | 'dual-bunk' 
  | 'nordic-minimal';

export type KitchenColor = 
  | 'matte-obsidian' 
  | 'scandinavian-oak' 
  | 'navy-blue' 
  | 'marble-white' 
  | 'forest-green' 
  | 'smoked-charcoal';

export type KitchenCountertop = 
  | 'calacatta-quartz' 
  | 'black-granite' 
  | 'butcherblock-oak' 
  | 'brushed-stainless';

export type BedroomPalette = 
  | 'warm-linen' 
  | 'charcoal-grey' 
  | 'sage-green' 
  | 'terracotta-clay' 
  | 'midnight-navy';

export type SittingPalette = 
  | 'warm-cognac' 
  | 'charcoal-boucle' 
  | 'sand-beige' 
  | 'emerald-velvet' 
  | 'slate-grey';

export type WashroomToiletType = 
  | 'western-commode' 
  | 'wall-hung-rimless' 
  | 'smart-bidet-wc';

export type WashroomWetType = 
  | 'bathtub' 
  | 'walk-in-shower' 
  | 'shower-tub-combo';

export type WashroomTileStyle = 
  | 'carrara-marble' 
  | 'black-slate' 
  | 'white-terrazzo' 
  | 'sandstone';

export interface ContainerOpening {
  id: string;
  type: 
    | 'sliding-door-8ft' 
    | 'sliding-door-12ft' 
    | 'sliding-door-16ft' 
    | 'bifold-glass-20ft' 
    | 'sliding-window'
    | 'window-4x4' 
    | 'window-6x3' 
    | 'picture-window' 
    | 'entry-door' 
    | 'pivot-door' 
    | 'interior-pocket-door'
    | 'skylight';
  wall: 'front' | 'back' | 'left' | 'right' | 'roof';
  positionFt: number; // offset along the wall
  widthFt: number;
  heightFt: number;
  elevationFt: number; // height above container floor
  isOpen?: boolean;
}

export interface RoomPartition {
  id: string;
  name: string;
  roomType: 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'office';
  positionFt: number;
  furnishings: boolean;
}

export interface OutdoorAmenities {
  plungePool: boolean;
  firePitLounge: boolean;
  pergolaCanopy: boolean;
  cantileverBalcony: boolean;
}

export interface ContainerModelConfig {
  presetId: string;
  name: string;
  subtitle?: string;
  luxuryTier?: string;
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  layoutType: LayoutType;
  exteriorMaterial: ExteriorMaterial;
  exteriorColor: string;
  colorName: string;
  corrugationDepth: number;
  wallThicknessInches: number;
  glassTint: GlassTint;
  openings: ContainerOpening[];
  roofOption: RoofOption;
  solarPanelsCount: number;
  solarCapacityKw: number;
  staircase: boolean;
  interiorStyle: InteriorStyle;
  flooringMaterial: FlooringMaterial;
  cutawayRoof: boolean; // xray interior view
  partitions: RoomPartition[];
  foundationType: FoundationType;
  pierHeightInches: number;
  deckPorch: boolean;
  deckWidthFt: number;
  deckDepthFt: number;
  outdoorAmenities: OutdoorAmenities;
  insulationRValue: number; // e.g. R-21 closed cell spray foam
  cargoDoorsOpen?: boolean;
  frontDoorOpen?: boolean;
  bedroomDoorOpen?: boolean;
  bathroomDoorOpen?: boolean;
  interiorDoorsOpen?: boolean;
  attachedBath?: boolean; // If true, attached ensuite bath to bedroom; if false, corridor hallway access
  bathroomDoorType?: 'pocket-sliding' | 'swing-hinged';
  doorStates?: Record<string, boolean>; // Individual door open/close states
  activeStoryView?: 'all' | 'ground' | 'upper';
  floorPlanPresetId?: string;
  loungeType?: LoungeType;
  kitchenType?: KitchenType;
  bathroomType?: BathroomType;
  bedroomType?: BedroomType;
  kitchenColor?: KitchenColor;
  kitchenCountertop?: KitchenCountertop;
  bedroomPalette?: BedroomPalette;
  sittingPalette?: SittingPalette;
  washroomToiletType?: WashroomToiletType;
  washroomWetType?: WashroomWetType;
  washroomTileStyle?: WashroomTileStyle;
  highlights?: string[];
}

export interface SitePlanningConfig {
  lotWidthFt: number;
  lotDepthFt: number;
  setbackFrontFt: number;
  setbackRearFt: number;
  setbackSideFt: number;
  showSetbacks: boolean;
  containerOffsetXFt: number;
  containerOffsetZFt: number;
  containerRotationDeg: number;
  show1ftGrid: boolean;
  showDimensions: boolean;
  showHumanFigure: boolean;
  showVehicleScale: boolean;
  showLandscaping?: boolean;
  timeOfDayHours: number; // 6 to 19 (e.g. 14 = 2 PM)
  orientationCompassDeg: number;
  unitSystem: UnitSystem;
}

export type ViewMode = 
  | '3d-orbit' 
  | 'walkthrough-vr' 
  | 'vr-walkthrough' 
  | 'camera-ar' 
  | 'cinematic-tour' 
  | 'floorplan-2d';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'super_admin' | 'verified_client' | 'pending_client';
  verifiedAt?: string;
  createdAt: string;
  company?: string;
  phone?: string;
  isFirstOwner?: boolean;
}

export interface SubdomainConfig {
  subdomain: string;
  targetHost: string;
  txtRecordVerification: string;
  status: 'active' | 'pending_verification' | 'unconfigured';
  sslStatus: 'active' | 'provisioning' | 'failed';
  verifiedAt?: string;
}

export interface SavedConfiguration {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  model: ContainerModelConfig;
  site: SitePlanningConfig;
  estimatedCostUsd: number;
  status: 'draft' | 'submitted_for_review' | 'approved_by_admin' | 'engineering_review';
  notes?: string;
}
