import { Filter, X } from 'lucide-react';

interface Brand {
  id: number;
  name: string;
}

interface PriceRange {
  label: string;
  min: number | null;
  max: number | null;
}

interface SidebarFiltersProps {
  brands: Brand[];
  priceRanges: PriceRange[];
  selectedBrand: string | null;
  selectedPrice: number;
  onBrandChange: (brandId: string | null) => void;
  onPriceChange: (index: number) => void;
  onClearFilters: () => void;
}

export default function SidebarFilters({
  brands,
  priceRanges,
  selectedBrand,
  selectedPrice,
  onBrandChange,
  onPriceChange,
  onClearFilters
}: SidebarFiltersProps) {
  return (
    <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
      <div className="glass-card p-5">
        <div className="flex items-center justify-between text-white font-bold mb-4 border-b border-border/50 pb-2">
          <div className="flex items-center space-x-2">
            <Filter size={18} />
            <h2>Lọc Sản Phẩm</h2>
          </div>
          {(selectedBrand || selectedPrice !== 0) && (
            <button 
              onClick={onClearFilters}
              className="text-[10px] text-primary hover:underline flex items-center"
            >
              <X size={10} className="mr-1" /> Xóa lọc
            </button>
          )}
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wider text-[11px]">Thương hiệu</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {brands.map((brand) => (
                <label key={brand.id} className="flex items-center space-x-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="brand"
                    checked={selectedBrand === brand.id.toString()}
                    onChange={() => onBrandChange(brand.id.toString())}
                    className="rounded-full border-slate-600 bg-dark/50 text-primary focus:ring-primary w-4 h-4" 
                  />
                  <span className={`text-sm transition-colors ${selectedBrand === brand.id.toString() ? 'text-primary font-bold' : 'text-slate-400 group-hover:text-white'}`}>
                    {brand.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wider text-[11px]">Mức giá</h3>
            <div className="space-y-2">
              {priceRanges.map((range, index) => (
                <label key={index} className="flex items-center space-x-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="price" 
                    checked={selectedPrice === index}
                    onChange={() => onPriceChange(index)}
                    className="text-primary focus:ring-primary bg-dark border-slate-600 w-4 h-4" 
                  />
                  <span className={`text-sm transition-colors ${selectedPrice === index ? 'text-primary font-bold' : 'text-slate-400 group-hover:text-white'}`}>
                    {range.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
