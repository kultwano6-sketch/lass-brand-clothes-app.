import React, { useState } from 'react';
import { Heart, Eye, Check, ShoppingBag, ArrowLeftRight } from 'lucide-react';
import { Product } from '../types';
import { formatZAR } from '../utils/whatsapp';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();
  const wishlisted = isInWishlist(product.id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [justAddedSize, setJustAddedSize] = useState<string | null>(null);

  const hasMultipleImages = product.images && product.images.length > 1;

  const handleQuickAdd = (size: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultColour = product.availableColours?.[0] || 'Classic Black';
    addToCart(product, size, defaultColour, 1);
    setJustAddedSize(size);
    setTimeout(() => {
      setJustAddedSize(null);
      setQuickAddOpen(false);
    }, 900);
  };

  const handleToggleImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultipleImages) {
      setActiveImageIndex((prev) => (prev === 0 ? 1 : 0));
    }
  };

  return (
    <div
      onClick={() => onSelect(product)}
      onMouseEnter={() => {
        if (hasMultipleImages) setActiveImageIndex(1);
      }}
      onMouseLeave={() => {
        setActiveImageIndex(0);
        setQuickAddOpen(false);
      }}
      className="group relative bg-zinc-900 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer shadow-md hover:shadow-2xl hover:shadow-black/60 transform hover:-translate-y-1"
    >
      {/* Visual Canvas: Streetwear Aspect Ratio */}
      <div className="relative aspect-[4/5] bg-zinc-950 overflow-hidden">
        <img
          src={product.images[activeImageIndex] || product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
          decoding="async"
        />

        {/* Ambient Contrast Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

        {/* Top Header Row on Image: Clean Metadata & Actions */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10 pointer-events-none">
          {/* Streetwear Tag (Clean, unboxed typography) */}
          <div className="pointer-events-auto">
            {product.isNewDrop ? (
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-orange-500/30">
                2026 Drop
              </span>
            ) : product.printType ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-zinc-800">
                {product.printType}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Multi-image Flip Toggle */}
            {hasMultipleImages && (
              <button
                type="button"
                onClick={handleToggleImage}
                title="Toggle Front/Back View"
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Toggle product view angle"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                wishlisted
                  ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-black/60 border-zinc-800 text-zinc-300 hover:text-orange-400 hover:bg-black/90'
              }`}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* View Angle Indicator */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
            <span className="text-[9px] font-mono tracking-wider uppercase text-zinc-400 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded border border-zinc-800">
              {activeImageIndex === 0 ? 'Front' : 'Back Print'}
            </span>
          </div>
        )}

        {/* Quick Add Size Bar (Reveals on card hover / tap) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-2 bottom-2 z-20 transition-all duration-200"
        >
          {quickAddOpen ? (
            <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-xl p-2 shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Select Size
                </span>
                <button
                  type="button"
                  onClick={() => setQuickAddOpen(false)}
                  className="text-[10px] text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {product.availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={(e) => handleQuickAdd(size, e)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all active:scale-95 ${
                      justAddedSize === size
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-zinc-900 hover:bg-orange-500 border-zinc-800 hover:border-orange-500 text-zinc-200 hover:text-white'
                    }`}
                  >
                    {justAddedSize === size ? <Check className="w-3.5 h-3.5 mx-auto" /> : size}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickAddOpen(true);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-orange-500 text-black hover:text-white text-xs font-black tracking-wide flex items-center justify-center gap-1.5 shadow-xl transition-all active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span>Quick Add</span>
              </button>
              <button
                type="button"
                onClick={() => onSelect(product)}
                className="p-2 rounded-xl bg-black/70 hover:bg-black text-white border border-zinc-700/80 backdrop-blur-sm transition-colors"
                title="View full piece details"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Section */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between bg-zinc-900/90">
        <div>
          {/* Quiet Metadata with Typographic Separator */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1 font-medium">
            <span className="text-emerald-400 font-semibold">{product.fit || 'Streetwear Fit'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[10px] text-zinc-500">{product.sku}</span>
          </div>

          <h3 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-orange-400 transition-colors">
            {product.name}
          </h3>

          <p className="mt-1 text-xs text-zinc-400 line-clamp-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & Stock Footer */}
        <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black text-white font-display tabular-nums">
                {formatZAR(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-zinc-500 line-through tabular-nums">
                  {formatZAR(product.compareAtPrice)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-blue-400 font-semibold block -mt-0.5">
              PAXI PEP Ready (R60)
            </span>
          </div>

          {/* Mobile Quick-Add Button / Desktop Size Pill */}
          <div className="sm:hidden">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuickAddOpen((prev) => !prev);
              }}
              className="p-2 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-md active:scale-95"
              aria-label="Quick add size"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold text-zinc-400 bg-black/60 px-2 py-1 rounded-lg border border-zinc-800">
            <span>{product.availableSizes.slice(0, 3).join('/')}</span>
            {product.availableSizes.length > 3 && <span>+</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
