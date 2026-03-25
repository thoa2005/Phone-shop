import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex-1 sm:w-64">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input 
        type="text" 
        placeholder="Tìm kiếm theo tên..." 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-dark/50 border border-border/50 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all"
      />
      {value && (
        <button 
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
