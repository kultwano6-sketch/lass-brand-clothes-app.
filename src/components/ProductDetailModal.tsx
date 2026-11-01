import React, { useState, useRef } from 'react';
import {
  X,
  Heart,
  ShoppingBag,
  MessageSquare,
  Truck,
  ShieldCheck,
  Ruler,
  Sparkles,
  Check,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Layers,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { Product, BrandConfig } from '../types';
import { formatZAR, buildWhatsAppLink, generateOrderReference } from '../utils/whatsapp';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { FitCalculatorModal } from './FitCalculatorModal';
import { getSavedSizePreference } from '../utils/sizeCalculator';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  brandConfig: BrandConfig;
  onOpenSizeGuide: () => void;
  onOpenPaxiInfo: () => void;
  allProducts?: Product[];
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  brandConfig,
  onOpenSizeGuide,
  onOpenPaxiInfo,
  allProducts = [],
}) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [savedSizePref, setSavedSizePref] = useState<string | null>(() => getSavedSizePreference());
  const [isFitCalculatorOpen, setIsFitCalculatorOpen] = useState(false);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const saved = getSavedSizePreference();
    if (saved && product.availableSizes.includes(saved)) {
      return saved;
    }
    return product.availableSizes[0] || 'L';
  });
  const [selectedColour, setSelectedColour] = useState<string>(product.availableColours[0] || 'Classic Black');
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Interactive Streetwear Viewer Modes: 'studio' | '360' | 'fabric'
  const [viewMode, setViewMode] = useState<'studio' | '360' | 'fabric'>('studio');
  const [rotationAngle, setRotationAngle] = useState(0); // 0 to 360 deg
  const [fabricMacroZoom, setFabricMacroZoom] = useState(2.2); // 1.5x to 3.5x macro
  const [activeCallout, setActiveCallout] = useState<string | null>('weight');

  // Magnifying glass / pinch-to-zoom interactive state
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomOrigin({ x, y });
  };

  const handleToggleZoom = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsZoomed((prev) => !prev);
  };

  const wishlisted = isInWishlist(product.id);

  // Companion product for Complete the Look bundle pairing
  const companionProduct = (allProducts || []).find((p) => {
    if (product.category === 'accessories') {
      return p.category !== 'accessories';
    }
    return p.category === 'accessories';
  }) || (allProducts || []).find((p) => p.id !== product.id);

  const [companionAdded, setCompanionAdded] = useState(false);

  const handleAddBag = () => {
    addToCart(product, selectedSize, selectedColour, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 600);
  };

  const handleQuickWhatsApp = () => {
    const orderRef = generateOrderReference();
    const lineTotal = product.price * quantity;
    const msg = [
      `🛍️ *QUICK ENQUIRY — LASS BRAND CLOTHES*`,
      `Item: *${product.name}*`,
      `SKU: ${product.sku}`,
      `Size: ${selectedSize}`,
      `Colour: ${selectedColour}`,
      `Quantity: ${quantity}`,
      `Estimated Price: ${formatZAR(lineTotal)}`,
      `Ref: #${orderRef}`,
      `───────────────`,
      `Hi LASS, I want to confirm stock availability and arrange PAXI delivery for this piece!`,
    ].join('\n');

    const url = buildWhatsAppLink(brandConfig.ownerWhatsApp, msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-700"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Product Gallery & Interactive Streetwear Inspector */}
        <div className="md:w-1/2 bg-black p-4 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Interactive View Mode Selector */}
            <div className="flex items-center gap-1.5 mb-3 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 text-xs select-none">
              <button
                type="button"
                onClick={() => setViewMode('studio')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                  viewMode === 'studio'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('360')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                  viewMode === '360'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-orange-400'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>360° Drape</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('fabric')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                  viewMode === 'fabric'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-emerald-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>200gsm Weave</span>
              </button>
            </div>

            {/* MODE 1: STUDIO SHOT WITH 2.2X ZOOM LENS */}
            {viewMode === 'studio' && (
              <div
                ref={imageContainerRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onClick={handleToggleZoom}
                className={`relative aspect-square sm:aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 select-none ${
                  isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                title="Hover or tap to zoom fabric & print detail"
              >
                <img
                  src={product.images[selectedImageIndex] || product.images[0]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center pointer-events-none transition-transform will-change-transform"
                  style={{
                    transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transitionDuration: isZoomed ? '120ms' : '250ms',
                    transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                  {product.isNewDrop && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-black tracking-wider uppercase bg-orange-500 text-white shadow-lg">
                      <Sparkles className="w-3.5 h-3.5" />
                      2026 Drop
                    </span>
                  )}
                  {product.isAuditedOriginal && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-md">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Audited Google Sites Price
                    </span>
                  )}
                </div>

                {/* Wishlist toggle on image */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-colors z-20 ${
                    wishlisted
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-black/70 text-white hover:text-orange-400'
                  }`}
                  title="Add to wishlist"
                >
                  <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
                </button>

                {/* Magnifying Glass Indicator Badge */}
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-zinc-700/80 text-[10px] text-zinc-300 font-semibold flex items-center gap-1.5 z-10 pointer-events-none shadow-lg">
                  {isZoomed ? (
                    <>
                      <ZoomOut className="w-3.5 h-3.5 text-orange-400" />
                      <span>2.2x Fabric Zoom</span>
                    </>
                  ) : (
                    <>
                      <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Hover / Tap to Zoom</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* MODE 2: 360° INTERACTIVE STREETWEAR DRAPE VIEWER */}
            {viewMode === '360' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="relative aspect-square sm:aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 flex items-center justify-center p-4">
                  {/* Rotating 3D Garment Image */}
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-150 will-change-transform"
                    style={{
                      perspective: '700px',
                    }}
                  >
                    <img
                      src={
                        rotationAngle >= 90 && rotationAngle <= 270 && product.images.length > 1
                          ? product.images[1]
                          : product.images[0]
                      }
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-xl shadow-2xl transition-transform duration-100"
                      style={{
                        transform: `rotateY(${((rotationAngle % 180) - 90) * 0.45}deg)`,
                      }}
                    />
                  </div>

                  {/* Rotation Angle Overlay Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-zinc-700 text-[11px] font-mono font-bold text-orange-400 flex items-center gap-1.5 shadow-md">
                    <RotateCw className="w-3.5 h-3.5 text-orange-400" />
                    <span>{rotationAngle}° Perspective</span>
                  </div>

                  {/* Drape Silhouette Tag */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-zinc-700 text-[10px] font-bold text-white uppercase tracking-wider">
                    {rotationAngle < 45 || rotationAngle >= 315
                      ? 'Front View'
                      : rotationAngle < 135
                      ? 'Right Profile Drape'
                      : rotationAngle < 225
                      ? 'Back View & Screen Print'
                      : 'Left Profile Drape'}
                  </div>

                  {/* Drag Prompt */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-zinc-700 text-[10px] text-zinc-300 font-semibold whitespace-nowrap shadow-lg">
                    Drag slider below to spin garment
                  </div>
                </div>

                {/* 360 Rotation Controls */}
                <div className="p-3 bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
                    <span>Rotation Angle:</span>
                    <span className="font-mono text-orange-400">{rotationAngle}°</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={rotationAngle}
                    onChange={(e) => setRotationAngle(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
                  />

                  {/* 4 Angle Quick-Pill Presets */}
                  <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setRotationAngle(0)}
                      className={`py-1 rounded-lg border transition-colors ${
                        rotationAngle === 0
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      Front (0°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotationAngle(90)}
                      className={`py-1 rounded-lg border transition-colors ${
                        rotationAngle === 90
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      Side (90°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotationAngle(180)}
                      className={`py-1 rounded-lg border transition-colors ${
                        rotationAngle === 180
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      Back (180°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotationAngle(270)}
                      className={`py-1 rounded-lg border transition-colors ${
                        rotationAngle === 270
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      Drape (270°)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODE 3: 180-200GSM COMBED COTTON WEAVE MACRO LENS */}
            {viewMode === 'fabric' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="relative aspect-square sm:aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center select-none">
                  {/* Magnified Macro Weave Canvas */}
                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center transition-transform duration-200"
                    style={{ transform: `scale(${fabricMacroZoom})` }}
                  >
                    <img
                      src={product.images[0]}
                      alt="Fabric Weave"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter contrast-125 brightness-95"
                    />
                    {/* Simulated High-Density Combed Cotton Knit Texture Grid */}
                    <div
                      className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                      style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                        backgroundSize: '8px 8px',
                      }}
                    />
                  </div>

                  {/* Interactive Macro Callout Pins */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Weight Pin */}
                    <button
                      type="button"
                      onClick={() => setActiveCallout('weight')}
                      className="absolute top-1/4 left-1/3 pointer-events-auto p-1.5 rounded-full bg-emerald-500 text-white shadow-lg animate-pulse ring-4 ring-emerald-500/20"
                      title="180–200gsm Combed Cotton"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    {/* Ribbed Collar Pin */}
                    <button
                      type="button"
                      onClick={() => setActiveCallout('collar')}
                      className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-auto p-1.5 rounded-full bg-blue-500 text-white shadow-lg animate-pulse ring-4 ring-blue-500/20"
                      title="Reinforced Ribbed Crewneck"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>

                    {/* Twin Needle Hem Pin */}
                    <button
                      type="button"
                      onClick={() => setActiveCallout('stitching')}
                      className="absolute bottom-16 right-1/4 pointer-events-auto p-1.5 rounded-full bg-orange-500 text-white shadow-lg animate-pulse ring-4 ring-orange-500/20"
                      title="Twin-Needle Lockstitch"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Zoom Level Indicator */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-zinc-700 text-[11px] font-mono text-emerald-400 font-bold">
                    {fabricMacroZoom.toFixed(1)}x Macro Knit
                  </div>
                </div>

                {/* Macro Inspection Details Card */}
                <div className="p-3 bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">
                      Fabric Spec Callout:
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span>Zoom:</span>
                      <input
                        type="range"
                        min="1.5"
                        max="3.5"
                        step="0.1"
                        value={fabricMacroZoom}
                        onChange={(e) => setFabricMacroZoom(Number(e.target.value))}
                        className="w-20 accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>

                  {activeCallout === 'weight' && (
                    <div className="text-xs text-zinc-300">
                      <strong className="text-white block font-bold">
                        180–200gsm Heavyweight Combed Cotton
                      </strong>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                        Substantial South African streetwear weight. Structured, boxy silhouette that holds shape without clinging.
                      </p>
                    </div>
                  )}

                  {activeCallout === 'collar' && (
                    <div className="text-xs text-zinc-300">
                      <strong className="text-white block font-bold">
                        Reinforced 1x1 Rib Crew Neckline
                      </strong>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                        Engineered with spandex memory weave to prevent stretching or sagging after repeated wears and washes.
                      </p>
                    </div>
                  )}

                  {activeCallout === 'stitching' && (
                    <div className="text-xs text-zinc-300">
                      <strong className="text-white block font-bold">
                        Twin-Needle Lockstitch Hems
                      </strong>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                        Double-stitched sleeve cuffs and waist hem for industrial strength and clean streetwear finish.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveCallout('weight')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        activeCallout === 'weight' ? 'bg-emerald-600 text-white' : 'bg-black text-zinc-400 hover:text-white'
                      }`}
                    >
                      Weight
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCallout('collar')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        activeCallout === 'collar' ? 'bg-blue-600 text-white' : 'bg-black text-zinc-400 hover:text-white'
                      }`}
                    >
                      Collar
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCallout('stitching')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        activeCallout === 'stitching' ? 'bg-orange-500 text-white' : 'bg-black text-zinc-400 hover:text-white'
                      }`}
                    >
                      Stitching
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnails row if multiple images exist (Only in Studio view) */}
          {viewMode === 'studio' && product.images.length > 1 && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-orange-500 opacity-100 ring-2 ring-orange-500/30'
                      : 'border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Photo Note for transparency */}
          {product.isPlaceholderPhoto && (
            <div className="mt-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
              <span>
                <strong>Lookbook Note:</strong> Studio mockup visualization. Authentic physical garments feature original screen print tags and branding.
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Product Details & Variant Selectors */}
        <div className="md:w-1/2 p-6 sm:p-7 flex flex-col justify-between max-h-[85vh] overflow-y-auto bg-zinc-950">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="uppercase tracking-widest font-black text-blue-400">{product.printType}</span>
              <span className="font-mono text-zinc-500">{product.sku}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-display text-white">
              {product.name}
            </h2>

            {/* Pricing Section */}
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-white font-display">
                {formatZAR(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-zinc-500 line-through">
                  {formatZAR(product.compareAtPrice)}
                </span>
              )}
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-md">
                Available to Order
              </span>
            </div>

            {/* Brand Manifesto Quote */}
            {product.storyQuote && (
              <blockquote className="mt-3.5 p-3 rounded-xl bg-zinc-900 border-l-2 border-orange-500 text-xs italic text-zinc-200">
                "{product.storyQuote}"
              </blockquote>
            )}

            {/* Description */}
            <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
              {product.description}
            </p>

            {/* Fabric & Fit specs */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-300 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
              <div>
                <span className="text-emerald-400 block text-[10px] uppercase font-black">Fit</span>
                <span className="text-white font-bold">{product.fit}</span>
              </div>
              <div>
                <span className="text-blue-400 block text-[10px] uppercase font-black">Fabric</span>
                <span className="text-white font-bold">{product.fabricDetails}</span>
              </div>
            </div>

            {/* Size Selector */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-white">
                    Select Size
                  </label>
                  {savedSizePref && (
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                      ★ Saved: {savedSizePref}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsFitCalculatorOpen(true)}
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-bold bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-xl border border-orange-500/20 transition-colors active:scale-95 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>Fit Calculator</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenSizeGuide}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-bold underline underline-offset-2 transition-colors"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Chart</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.availableSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  const isRecommended = savedSizePref === size;

                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-12 px-3 py-2 rounded-xl text-xs font-black transition-all border relative ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-400 shadow-md scale-105'
                          : isRecommended
                          ? 'bg-orange-950/40 text-orange-300 border-orange-500/50 hover:border-orange-400'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <span>{size}</span>
                      {isRecommended && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colour Selector */}
            <div className="mt-4">
              <label className="text-xs font-black uppercase tracking-wider text-white block mb-2">
                Select Colour: <span className="text-orange-400">{selectedColour}</span>
              </label>

              <div className="flex flex-wrap gap-2">
                {product.availableColours.map((col) => {
                  const isSelected = selectedColour === col;
                  return (
                    <button
                      key={col}
                      onClick={() => setSelectedColour(col)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full border ${
                          col.toLowerCase().includes('white')
                            ? 'bg-white border-zinc-400'
                            : col.toLowerCase().includes('charcoal')
                            ? 'bg-zinc-700 border-zinc-500'
                            : 'bg-black border-zinc-600'
                        }`}
                      />
                      <span>{col}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mt-4 flex items-center gap-3">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Quantity:
              </label>
              <div className="flex items-center border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-bold text-sm"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-sm font-black text-white min-w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-bold text-sm"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <span className="text-xs text-zinc-400">
                Subtotal: <strong className="text-white">{formatZAR(product.price * quantity)}</strong>
              </span>
            </div>

            {/* Complete the Look — Smart Streetwear Pairing */}
            {companionProduct && (
              <div className="mt-4 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-orange-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-orange-400" />
                    Complete the Look
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Combo Match
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={companionProduct.images[0]}
                    alt={companionProduct.name}
                    className="w-12 h-12 rounded-xl object-cover bg-black border border-zinc-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-white truncate">{companionProduct.name}</h4>
                    <span className="text-xs text-orange-400 font-mono font-bold block">{formatZAR(companionProduct.price)}</span>
                  </div>
                  <button
                    onClick={() => {
                      addToCart(
                        companionProduct,
                        companionProduct.availableSizes[0] || 'Standard',
                        companionProduct.availableColours[0] || 'Classic Black',
                        1
                      );
                      setCompanionAdded(true);
                      setTimeout(() => setCompanionAdded(false), 1500);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-colors shrink-0 flex items-center gap-1 ${
                      companionAdded
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
                    }`}
                  >
                    {companionAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <span>+ Add Combo</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs in Green, White, Blue, Orange */}
          <div className="mt-6 pt-5 border-t border-zinc-800 space-y-2.5">
            <button
              onClick={handleAddBag}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl ${
                addedAnimation
                  ? 'bg-emerald-600 text-white scale-[0.98]'
                  : 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/25 active:scale-95'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-5 h-5 text-white" />
                  <span>Added to Bag!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>Add to Bag • {formatZAR(product.price * quantity)}</span>
                </>
              )}
            </button>

            <button
              onClick={handleQuickWhatsApp}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Direct WhatsApp Enquiry</span>
            </button>

            {/* PAXI Notice */}
            <div
              onClick={onOpenPaxiInfo}
              className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200 cursor-pointer hover:bg-blue-950/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>PAXI PEP Store delivery from <strong>R60</strong></span>
              </div>
              <span className="text-[10px] font-bold underline">Details</span>
            </div>
          </div>
        </div>
      </div>

      {/* Streetwear Fit & Size Calculator Modal */}
      <FitCalculatorModal
        isOpen={isFitCalculatorOpen}
        onClose={() => setIsFitCalculatorOpen(false)}
        onApplySize={(size) => {
          setSelectedSize(size);
          setSavedSizePref(size);
        }}
        currentSelectedSize={selectedSize}
      />
    </div>
  );
};
