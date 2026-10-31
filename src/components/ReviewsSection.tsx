import React from 'react';
import { Star, ShieldCheck, CheckCircle2, MessageSquare, Sparkles, MapPin, ThumbsUp } from 'lucide-react';
import { STORE_REVIEWS, REVIEWS_METRICS } from '../data/reviews';
import { BrandConfig } from '../types';
import { buildWhatsAppLink } from '../utils/whatsapp';

interface ReviewsSectionProps {
  brandConfig: BrandConfig;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ brandConfig }) => {
  const handleShareFitWhatsApp = () => {
    const msg = [
      `📸 *LASS STREET STYLE & REVIEW SUBMISSION*`,
      `Hi LASS, I recently copped a piece and want to share my review & fit photo!`,
      `───────────────`,
      `Rating: 5/5 ⭐`,
    ].join('\n');
    const url = buildWhatsAppLink(brandConfig.ownerWhatsApp, msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="my-12 sm:my-16 space-y-6">
      {/* Header and Aggregate Metrics */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-orange-400 font-black text-xs uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              Worn in the Kasi
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-bold text-xs">Verified South African Buyers</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
            Customer Reviews &amp; Fit Feedback
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real feedback on fabric weight, print durability, and true-to-size streetwear cuts.
          </p>
        </div>

        {/* Aggregate Pill Summary */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-2.5 sm:px-4 shrink-0">
          <div className="text-center pr-3 border-r border-zinc-800">
            <div className="font-display font-black text-xl text-white leading-none flex items-center gap-1 justify-center">
              <span>{REVIEWS_METRICS.averageRating}</span>
              <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
            </div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block mt-1">
              {REVIEWS_METRICS.totalReviews}+ Orders
            </span>
          </div>

          <div className="text-left text-xs space-y-0.5">
            <div className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{REVIEWS_METRICS.trueToSizePercentage}% True to Size</span>
            </div>
            <div className="text-zinc-400 text-[11px]">
              200gsm Heavyweight Cotton
            </div>
          </div>
        </div>
      </div>

      {/* Review Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {STORE_REVIEWS.map((review) => (
          <div
            key={review.id}
            className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-lg flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Star Rating and Fit Pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < review.rating ? 'fill-orange-400 text-orange-400' : 'text-zinc-700'
                      }`}
                    />
                  ))}
                </div>

                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  {review.fitRating}
                </span>
              </div>

              {/* Headline */}
              <h3 className="font-bold text-sm text-white leading-snug">
                "{review.headline}"
              </h3>

              {/* Comment */}
              <p className="text-xs text-zinc-300 leading-relaxed">
                {review.comment}
              </p>
            </div>

            {/* Reviewer Details */}
            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px]">
              <div>
                <div className="flex items-center gap-1.5">
                  <strong className="text-white font-bold">{review.authorName}</strong>
                  {review.verifiedBuyer && (
                    <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold" title="Verified Customer">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
                <div className="text-zinc-500 text-[10px] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{review.town}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-zinc-400 font-mono block">
                  {review.purchasedItem}
                </span>
                <span className="text-[9px] text-zinc-600 block">
                  {review.date}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Street Style CTA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-orange-950/30 border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <ThumbsUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              Got your LASS drip? Send us your street fit!
            </h4>
            <p className="text-zinc-400 text-[11px]">
              Share your fit on WhatsApp to get featured on our page and unlock VIP perks.
            </p>
          </div>
        </div>

        <button
          onClick={handleShareFitWhatsApp}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shrink-0 shadow-md shadow-emerald-950"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp Your Fit Review</span>
        </button>
      </div>
    </section>
  );
};
