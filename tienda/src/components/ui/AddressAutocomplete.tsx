'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, details?: { lat: string; lon: string; displayName: string }) => void;
  department?: string;
  province?: string;
  district?: string;
  placeholder?: string;
  error?: string;
}

export default function AddressAutocomplete({ value, onChange, department, province, district, placeholder, error }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => { setInputValue(value); }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (query: string) => {
    if (query.length < 3) { setSuggestions([]); return; }
    setLoading(true);
    try {
      let q = query;
      if (district) q += `, ${district}`;
      if (province) q += `, ${province}`;
      if (department) q += `, ${department}`;
      q += ', Peru';

      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=pe&addressdetails=1`, {
        headers: { 'User-Agent': 'AdriSuKids/1.0' },
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch { setSuggestions([]); }
    setLoading(false);
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 400);
  };

  const selectSuggestion = (s: any) => {
    const display = s.display_name?.split(',')[0] || s.display_name || '';
    setInputValue(display);
    setShowSuggestions(false);
    setSuggestions([]);
    onChange(display, { lat: s.lat, lon: s.lon, displayName: s.display_name });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => { handleInputChange(e.target.value); setShowSuggestions(true); }}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          className={`w-full pl-10 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${error ? 'border-red-300' : 'border-gray-200'}`}
          placeholder={placeholder || 'Busca tu direccion...'}
        />
        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => selectSuggestion(s)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-start gap-2">
              <MapPin size={14} className="text-green-500 mt-0.5 shrink-0" />
              <span className="text-gray-700 line-clamp-2">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
