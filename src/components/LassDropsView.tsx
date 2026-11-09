import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Lock, ArrowLeft, Flame, Calendar, CheckCircle2, ChevronRight, ShoppingBag } from 'lucide-react';
import { LassDrop, Product } from '../types';
import { formatZAR } from '../utils/whatsapp';

interface LassDropsViewProps {
  onBackToShop: () => void;
  onSelectProduct: (product: Product) => void;
  allProducts: Product[];
}

export const LassDropsView: React.FC<LassDropsViewProps> = ({
  onBackToShop,
  onSelectProduct,
  allProducts,
}) => {
  const [drops, setDrops] = useState<LassDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'ended'>('all');
  const [now, setNow] = useState(Date.now());

  // Real-time ticking timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Drops from API
  useEffect(() => {
    let mounted = true;
    fetch('/api/drops')
      .then((res) => res.json())
      .then((data: any) => {
        if (mounted && data.success && Array.isArray(data.drops)) {
          setDrops(data.drops);
        }
      })
      .catch((err) => console.error('Error fetching drops:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredDrops = drops.filter((d) => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  const formatCountdown = (targetDateStr: string) => {
    const diff = new Date(targetDateStr).getTime() - now;
    if (diff <= 0) return 'NOW LIVE';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Bar with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <button
            onClick={onBackToShop}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors mb-2 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Main Catalog</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-orange-400 font-mono text-xs uppercase tracking-widest font-black flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              Limited Kasi Collections
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-mono text-xs font-bold">Authenticated Releases</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-white uppercase tracking-tight mt-1">
            LASS Drops &amp; Release Radar
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Strictly limited-run streetwear batches. Once a drop sells out or closes, colourways and collector packaging are retired to preserve exclusivity.
          </p>
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl self-start sm:self-end overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All Drops' },
              { id: 'active', label: 'Live Now' },
              { id: 'scheduled', label: 'Upcoming' },
              { id: 'ended', label: 'Archive' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">Loading LASS Drop archive...</p>
        </div>
      ) : filteredDrops.length === 0 ? (
        <div className="py-20 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800/80 p-8 space-y-3">
          <Calendar className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No drops found in this category</h3>
          <p className="text-xs text-zinc-400">Check back soon or explore our active streetwear catalog.</p>
          <button
            onClick={() => setFilter('all')}
            className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-bold hover:bg-zinc-700 transition-colors"
          >
            View All Releases
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredDrops.map((drop) => {
            const isLive = drop.status === 'active';
            const isUpcoming = drop.status === 'scheduled';
            const isEnded = drop.status === 'ended';

            // Find matching products in this drop
            const dropProducts = allProducts.filter((p) => drop.productIds.includes(p.id));

            return (
              <div
                key={drop.id}
                className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all ${
                  isLive
                    ? 'bg-zinc-950 border-orange-500/50 shadow-2xl ring-1 ring-orange-500/20'
                    : isUpcoming
                    ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    : 'bg-zinc-950/60 border-zinc-900 opacity-80'
                }`}
              >
                <div>
                  {/* Artwork Banner */}
                  <div className="relative aspect-[16/9] w-full bg-zinc-900 overflow-hidden">
                    <img
                      src={drop.bannerImage}
                      alt={drop.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter contrast-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 ${
                          isLive
                            ? 'bg-orange-500 text-white animate-pulse'
                            : isUpcoming
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {isLive && <Flame className="w-3 h-3 text-white" />}
                        {isUpcoming && <Clock className="w-3 h-3 text-white" />}
                        {isLive ? 'DROP LIVE NOW' : isUpcoming ? 'SCHEDULED RELEASE' : 'ARCHIVED / SOLD OUT'}
                      </span>
                    </div>

                    {/* Countdown Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block font-mono">
                          {isLive ? 'DROP CLOSES IN' : isUpcoming ? 'LAUNCHES IN' : 'STATUS'}
                        </span>
                        <div className="font-mono text-xl sm:text-2xl font-black text-white drop-shadow-md">
                          {isLive
                            ? formatCountdown(drop.endsAt || drop.endDate || drop.launchDate)
                            : isUpcoming
                            ? formatCountdown(drop.launchesAt || drop.launchDate)
                            : 'COMPLETED'}
                        </div>
                      </div>

                      {(drop.remainingPieces !== undefined || drop.totalStockAllocated !== undefined) && (
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
                            BATCH AVAILABILITY
                          </span>
                          <span className="text-xs font-black text-white font-mono">
                            {drop.remainingPieces ?? drop.totalStockAllocated} / {drop.totalPieces ?? drop.totalStockAllocated} Left
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-7 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                        <span className="uppercase font-mono text-[11px] font-bold text-emerald-400">
                          {drop.subtitle || 'Kasi Edition'}
                        </span>
                        <span className="font-mono text-[11px]">
                          {new Date(drop.launchesAt || drop.launchDate).toLocaleDateString('en-ZA', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h2 className="text-2xl font-black font-display text-white uppercase tracking-tight">
                        {drop.title}
                      </h2>
                      <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                        {drop.description}
                      </p>
                    </div>

                    {/* Stock meter */}
                    {drop.remainingPieces !== undefined && drop.totalPieces !== undefined && (
                      <div className="space-y-1.5">
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isLive ? 'bg-orange-500' : 'bg-zinc-600'
                            }`}
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, ((drop.totalPieces - drop.remainingPieces) / drop.totalPieces) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>{Math.round(((drop.totalPieces - drop.remainingPieces) / drop.totalPieces) * 100)}% Claimed</span>
                          <span>{drop.remainingPieces === 0 ? 'SOLD OUT' : `${drop.remainingPieces} Garments Available`}</span>
                        </div>
                      </div>
                    )}

                    {/* Included Pieces List */}
                    {dropProducts.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                        <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block">
                          Included in this Release:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {dropProducts.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => onSelectProduct(p)}
                              className="p-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-3 cursor-pointer group"
                            >
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-12 h-12 rounded-xl object-cover bg-black shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                                  {p.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-black font-mono text-emerald-400">
                                    {formatZAR(p.price)}
                                  </span>
                                  <span className="text-[10px] text-zinc-500">{p.fit}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  {isLive ? (
                    <button
                      onClick={() => {
                        if (dropProducts[0]) onSelectProduct(dropProducts[0]);
                      }}
                      className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/25 active:scale-98 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Shop Live Drop Pieces</span>
                    </button>
                  ) : isUpcoming ? (
                    <div className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4 text-zinc-500" />
                      <span>Release Locked • Launches {new Date(drop.launchesAt || drop.launchDate).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <div className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-zinc-900 text-zinc-500 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Collection Archived</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
