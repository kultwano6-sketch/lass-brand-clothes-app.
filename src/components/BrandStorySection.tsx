import React from 'react';
import { Sparkles, Quote, Shield, Flame, Compass } from 'lucide-react';
import { BrandConfig } from '../types';
import { BRAND_STORY_PARAGRAPHS, BRAND_PILLARS } from '../data/brandConfig';

interface BrandStorySectionProps {
  brandConfig: BrandConfig;
  onExploreClick: () => void;
}

export const BrandStorySection: React.FC<BrandStorySectionProps> = ({
  brandConfig,
  onExploreClick,
}) => {
  return (
    <section className="relative overflow-hidden my-12 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-zinc-950 to-blue-950/60 border border-emerald-800/40 p-6 sm:p-10 lg:p-12 shadow-2xl">
      {/* Background Ambience & Street Graphic Watermark */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-8 -bottom-8 select-none pointer-events-none opacity-5 font-display font-black text-9xl text-white">
        LASS
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Ethos Header */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-black tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            The Kasi Ethos
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display text-white tracking-tight">
            HARVEST KE <span className="text-orange-400">LASS</span>
          </h2>

          <p className="text-lg sm:text-xl font-medium text-emerald-300 font-display italic">
            "{brandConfig.manifesto}"
          </p>
        </div>

        {/* Highlight Quote Box */}
        <div className="bg-black/80 rounded-2xl p-5 sm:p-6 border border-emerald-500/30 relative shadow-xl">
          <Quote className="w-8 h-8 text-orange-500/30 absolute top-4 right-4" />
          <p className="font-display font-black text-base sm:text-lg text-white mb-2">
            BONA, NTWANA O LASS! TAKE IT AS ONE POINT OF YOUR LIFE.
          </p>
          <p className="text-sm text-emerald-200 italic">
            "From the dust of poverty rises the seed of belief."
          </p>
        </div>

        {/* The True Story Paragraphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-zinc-300 leading-relaxed">
          <div className="space-y-4">
            <p>{BRAND_STORY_PARAGRAPHS[0]}</p>
            <p>{BRAND_STORY_PARAGRAPHS[1]}</p>
          </div>
          <div className="space-y-4">
            <p>{BRAND_STORY_PARAGRAPHS[2]}</p>
            <p className="text-orange-300 font-semibold">
              Wear the belief. Walk with your head high. This is LASS Brand Clothes.
            </p>
          </div>
        </div>

        {/* Brand Pillars in Green, Blue, Orange */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/40 space-y-1.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">{BRAND_PILLARS[0].title}</h4>
            <p className="text-xs text-zinc-400">{BRAND_PILLARS[0].subtitle}</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-blue-500/40 space-y-1.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">{BRAND_PILLARS[1].title}</h4>
            <p className="text-xs text-zinc-400">{BRAND_PILLARS[1].subtitle}</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-orange-500/40 space-y-1.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">{BRAND_PILLARS[2].title}</h4>
            <p className="text-xs text-zinc-400">{BRAND_PILLARS[2].subtitle}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <button
            onClick={onExploreClick}
            className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-orange-500/25"
          >
            Explore the Collection
          </button>
        </div>
      </div>
    </section>
  );
};
