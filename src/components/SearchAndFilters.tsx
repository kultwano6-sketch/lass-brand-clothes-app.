import React from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, X, Sparkles } from 'lucide-react';

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'featured';

interface SearchAndFiltersProps {
  categories: { id: string; label: string; count: number }[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  sortOption: SortOption;
  onSelectSort: (sort: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalResults: number;
  selectedPrintType: string;
  setSelectedPrintType: (print: string) => void;
  priceRange: 'all' | 'under-250' | '250-280' | '300-plus';
  setPriceRange: (range: 'all' | 'under-250' | '250-280' | '300-plus') => void;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  sortOption,
  onSelectSort,
  searchQuery,
  setSearchQuery,
  totalResults,
  selectedPrintType,
  setSelectedPrintType,
  priceRange,
  setPriceRange,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  const hasActiveFilters =
    activeCategory !== 'all' ||
    selectedPrintType !== 'all' ||
    priceRange !== 'all' ||
    searchQuery.trim().length > 0;

  const handleClearFilters = () => {
    onSelectCategory('all');
    setSelectedPrintType('all');
    setPriceRange('all');
    setSearchQuery('');
  };

  return (
    <div className="w-full space-y-4 mb-8">
      {/* Search Input Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search by design, t-shirt type, SKU or keyword (e.g. Pocket, Back Print, 2026)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary Category Bar & Sort Selector in Green, White, Blue & Orange */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? cat.id === '2026-new-drops'
                      ? 'bg-orange-500 text-white border-orange-400 shadow-md font-black'
                      : cat.id === 't-shirts'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black'
                      : 'bg-emerald-600 text-white border-emerald-400 shadow-md font-black'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
              >
                {cat.id === '2026-new-drops' && <Sparkles className="w-3 h-3 text-orange-300" />}
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-black/40 text-white' : 'bg-black text-zinc-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown & Filter Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {/* Sorting Dropdown */}
          <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-400 mr-2 shrink-0" />
            <span className="text-zinc-400 mr-1.5 hidden sm:inline">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => onSelectSort(e.target.value as SortOption)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="featured" className="bg-zinc-900 text-white">Featured</option>
              <option value="newest" className="bg-zinc-900 text-white">Newest Added (2026 Drops)</option>
              <option value="price-asc" className="bg-zinc-900 text-white">Price: Low to High (ZAR)</option>
              <option value="price-desc" className="bg-zinc-900 text-white">Price: High to Low (ZAR)</option>
            </select>
          </div>

          {/* Toggle More Filters */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-colors ${
              showAdvancedFilters || hasActiveFilters
                ? 'bg-orange-500/15 border-orange-500 text-orange-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Drawer / Section */}
      {showAdvancedFilters && (
        <div className="p-4 sm:p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filter by Print Placement */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-400 mb-2">
                Print Placement
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'Pocket Print', 'Back Print', 'Front Print', 'Full Graphic'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPrintType(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      selectedPrintType === p
                        ? 'bg-blue-600 text-white border-blue-400 font-black'
                        : 'bg-black text-zinc-300 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {p === 'all' ? 'All Prints' : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Price Range */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-orange-400 mb-2">
                Price Range (ZAR)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All Prices' },
                  { id: 'under-250', label: 'Under R250' },
                  { id: '250-280', label: 'R250 - R280' },
                  { id: '300-plus', label: 'R300+ (2026 Drops)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPriceRange(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      priceRange === item.id
                        ? 'bg-orange-500 text-white border-orange-400 font-black'
                        : 'bg-black text-zinc-300 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Footer */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-300">
              Showing <strong className="text-white">{totalResults}</strong> matching streetwear pieces
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-orange-400 hover:text-orange-300 underline font-bold"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
