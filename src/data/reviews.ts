export interface CustomerReview {
  id: string;
  authorName: string;
  town: string;
  province: string;
  rating: number;
  date: string;
  purchasedItem: string;
  headline: string;
  comment: string;
  verifiedBuyer: boolean;
  fitRating: 'True to Size' | 'Slightly Relaxed' | 'Oversized';
  fabricWeightScore: number; // out of 5
  screenprintScore: number; // out of 5
}

export const STORE_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-01',
    authorName: 'Sipho Ndlovu',
    town: 'Soweto (Diepkloof)',
    province: 'Gauteng',
    rating: 5,
    date: '28 October 2026',
    purchasedItem: '2026 Back Print Heavyweight Tee',
    headline: 'Material is legit heavyweight — best kasi tee in my closet',
    comment: 'Collected from Bara Mall PEP within 5 days. The 200gsm cotton feel is solid and thick, not like those flimsy promo shirts. The back print hasn’t cracked even after 4 washes. Harvest Ke Lass all the way!',
    verifiedBuyer: true,
    fitRating: 'True to Size',
    fabricWeightScore: 5,
    screenprintScore: 5,
  },
  {
    id: 'rev-02',
    authorName: 'Kagiso Mokoena',
    town: 'Pretoria (Mamelodi)',
    province: 'Gauteng',
    rating: 5,
    date: '25 October 2026',
    purchasedItem: 'Signature Front Pocket & Back Print Tee',
    headline: 'Clean stitching and loud presence on the streets',
    comment: 'Paid with Capitec Pay on the app, payment confirmed immediately on PayFast. Fits relaxed and clean. People stop me asking where I got it. Definitely copping the 2026 drop next.',
    verifiedBuyer: true,
    fitRating: 'True to Size',
    fabricWeightScore: 5,
    screenprintScore: 5,
  },
  {
    id: 'rev-03',
    authorName: 'Thando Cele',
    town: 'Durban (Umlazi)',
    province: 'KwaZulu-Natal',
    rating: 5,
    date: '19 October 2026',
    purchasedItem: 'LASS Embroidered Street Bucket Hat',
    headline: 'Hat structure holds shape in the Durban sun',
    comment: 'The bucket hat is deep and stays firm. Embroidery is clean with no loose threads. Super impressed with how fast Kutlwano dispatched it with PAXI.',
    verifiedBuyer: true,
    fitRating: 'True to Size',
    fabricWeightScore: 5,
    screenprintScore: 5,
  },
  {
    id: 'rev-04',
    authorName: 'Lerato Phiri',
    town: 'Polokwane (Bendor)',
    province: 'Limpopo',
    rating: 5,
    date: '14 October 2026',
    purchasedItem: 'Classic Black Minimal Pocket Tee',
    headline: 'Quality exceeded my expectations for R250',
    comment: 'I usually wear Size L and it fits exactly right. Collar ribbing is firm so it doesn’t stretch out around the neck. Truly authentic South African streetwear.',
    verifiedBuyer: true,
    fitRating: 'True to Size',
    fabricWeightScore: 5,
    screenprintScore: 5,
  },
  {
    id: 'rev-05',
    authorName: 'Bongani Sithole',
    town: 'Johannesburg (Braamfontein)',
    province: 'Gauteng',
    rating: 5,
    date: '08 October 2026',
    purchasedItem: '2026 Graphic Tee (White)',
    headline: 'Screen print quality is 10/10',
    comment: 'White tees can be transparent if cheap fabric is used, but this one is completely opaque and dense. Premium street vibe that stands out in Braam.',
    verifiedBuyer: true,
    fitRating: 'Slightly Relaxed',
    fabricWeightScore: 5,
    screenprintScore: 5,
  },
];

export const REVIEWS_METRICS = {
  averageRating: 4.9,
  totalReviews: 48,
  verifiedBuyersPercentage: 100,
  trueToSizePercentage: 98,
  fabricWeightAverage: 4.95,
  printQualityAverage: 5.0,
};
