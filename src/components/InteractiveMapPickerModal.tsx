import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Search, Check, X } from 'lucide-react';

interface InteractiveMapPickerModalProps {
  initialLat: number;
  initialLng: number;
  onSelectCoordinates: (lat: number, lng: number) => void;
  onClose: () => void;
}

export const InteractiveMapPickerModal: React.FC<InteractiveMapPickerModalProps> = ({
  initialLat,
  initialLng,
  onSelectCoordinates,
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [currentLat, setCurrentLat] = useState<number>(initialLat || 13.75633);
  const [currentLng, setCurrentLng] = useState<number>(initialLng || 100.50177);
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const startLat = initialLat || 13.75633;
    const startLng = initialLng || 100.50177;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 13,
      zoomControl: true,
    });

    // Add OpenStreetMap Free Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Custom Draggable Pin Icon
    const customPinIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center -top-4">
          <div class="animate-bounce">
            <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
              📍
            </div>
          </div>
        </div>
      `,
      className: 'custom-picker-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Create marker
    const marker = L.marker([startLat, startLng], {
      icon: customPinIcon,
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;
    mapRef.current = map;

    // Update lat/lng on marker drag
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setCurrentLat(Number(pos.lat.toFixed(5)));
      setCurrentLng(Number(pos.lng.toFixed(5)));
    });

    // Click on map to move marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setCurrentLat(Number(e.latlng.lat.toFixed(5)));
      setCurrentLng(Number(e.latlng.lng.toFixed(5)));
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Free Search using Nominatim OpenStreetMap Geocoding
  const handleNominatimSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim()) return;

    setIsSearching(true);
    setSearchError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchLocation + ' Thailand'
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        setCurrentLat(Number(lat.toFixed(5)));
        setCurrentLng(Number(lon.toFixed(5)));

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lon], 15);
          markerRef.current.setLatLng([lat, lon]);
        }
      } else {
        setSearchError('ไม่พบสถานที่นี้ ลองระบุชื่อเขต/อำเภอ หรือสถานที่ใกล้เคียง');
      }
    } catch (err) {
      setSearchError('การค้นหาล้มเหลว กรุณาคลิกเลือกจุดบนแผนที่โดยตรง');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/70 animate-fadeIn">
      <div className="v-panel bg-white w-full max-w-2xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-sm">📍 ปักหมุดพิกัดสถานที่ติดตั้ง (OpenStreetMap Free GIS)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white border-0 bg-transparent text-sm font-bold cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free Geocoding Search Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <form onSubmit={handleNominatimSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="พิมพ์ชื่อสถานที่/หมู่บ้าน/ถนนค้นหาด่วน เช่น สุขุมวิท 101, หางดง เชียงใหม่..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="v-input w-full pl-8 py-1.5 text-xs bg-white"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-2.5 top-2" />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="v-btn-primary py-1.5 px-3 text-xs shrink-0 cursor-pointer"
            >
              {isSearching ? '⏳ ค้นหา...' : 'ค้นหาฟรี'}
            </button>
          </form>
          {searchError && <p className="text-[10px] text-rose-600 font-semibold mt-1">{searchError}</p>}
        </div>

        {/* Leaflet OpenStreetMap Container */}
        <div className="flex-1 relative bg-slate-100 min-h-0">
          <div ref={mapContainerRef} className="w-full h-full" />
          
          {/* Floating Instructions */}
          <div className="absolute top-3 left-3 z-[1000] bg-slate-950/80 backdrop-blur-md text-amber-300 text-[10px] px-3 py-1.5 rounded-lg border border-amber-500/30 font-bold shadow-md">
            👉 ลากหมุดหมุดสีแดง 📍 หรือคลิกบนแผนที่ เพื่อระบุตำแหน่งบ้านลูกค้า
          </div>
        </div>

        {/* Bottom Coordinates & Confirm Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">ละติจูด (Lat)</span>
              <strong className="text-slate-900 font-extrabold">{currentLat}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">ลองจิจูด (Lng)</span>
              <strong className="text-slate-900 font-extrabold">{currentLng}</strong>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="v-btn-secondary py-1.5 px-3 text-xs cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectCoordinates(currentLat, currentLng);
                onClose();
              }}
              className="v-btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Check className="h-4 w-4" />
              <span>ยืนยันพิกัดนี้</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
