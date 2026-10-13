import React from 'react';
import { Heart, Sparkles, Eye, Camera } from 'lucide-react';
import { Product } from '../types';
import { formatZAR } from '../utils/whatsapp';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-emerald-500/60 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer shadow-lg hover:shadow-emerald-950/30"
    >
      {/* Image Container with Badges */}
      <div className="relative aspect-[4/5] bg-black overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Badges Stack: Orange, Blue, Green */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {product.isNewDrop ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wide uppercase bg-orange-500 text-white shadow-md">
              <Sparkles className="w-3 h-3" />
              2026 Drop
            </span>
          ) : product.printType ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-blue-600 text-white shadow-sm">
              {product.printType}
            </span>
          ) : null}

          {product.isAuditedOriginal && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold text-white bg-emerald-600 shadow-sm">
              Original Verified Price
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-colors z-10 ${
            wishlisted
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-black/60 text-white hover:text-orange-400 hover:bg-black/90'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Placeholder Photo Notice (Owner transparency) */}
        {product.isPlaceholderPhoto && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="inline-flex items-center gap-1 text-[9px] text-zinc-300 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-zinc-700">
              <Camera className="w-2.5 h-2.5 text-zinc-400" />
              <span>Mockup Preview</span>
            </span>
          </div>
        )}

        {/* Quick View Hover Prompt on Desktop */}
        <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-black font-extrabold text-xs shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-orange-500" />
            View Piece
          </span>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between bg-zinc-900">
        <div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span className="uppercase tracking-wider font-bold text-emerald-400">{product.fit || 'Streetwear Fit'}</span>
            <span className="text-zinc-500 font-mono text-[10px]">{product.sku}</span>
          </div>

          <h3 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-orange-400 transition-colors">
            {product.name}
          </h3>

          <p className="mt-1 text-xs text-zinc-300 line-clamp-1">
            {product.description}
          </p>
        </div>

        {/* Price and Sizes Summary */}
        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black text-white font-display">
                {formatZAR(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-zinc-500 line-through">
                  {formatZAR(product.compareAtPrice)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-blue-400 font-semibold block -mt-0.5">
              PAXI PEP Ready
            </span>
          </div>

          {/* Quick sizes preview */}
          <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-300 bg-black/60 px-2 py-1 rounded-md border border-zinc-800">
            <span>{product.availableSizes.slice(0, 3).join('/')}</span>
            {product.availableSizes.length > 3 && <span>+</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
