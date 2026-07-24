import React, { useEffect, useRef, useState } from 'react';
import type { Branch } from '../types';
import L from 'leaflet';
import { Search, MapPin, Navigation } from 'lucide-react';

interface BranchMapViewProps {
  branches: Branch[];
}

export const BranchMapView: React.FC<BranchMapViewProps> = ({ branches }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Filtered branches
  const filteredBranches = branches.filter((b) => {
    // Only map branches that have coordinates
    if (!b.latitude || !b.longitude) return false;

    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.address && b.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGroup = selectedGroup === 'All' || b.storeGroup === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Bangkok center coordinates: [13.7563, 100.5018]
    const map = L.map(mapContainerRef.current, {
      center: [13.7563, 100.5018],
      zoom: 6,
      zoomControl: true,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    // Create a layer group for markers
    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update Markers when filtered branches change
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear existing markers
    markersLayer.clearLayers();

    // Custom glowing SVG marker creator
    const createCustomIcon = (group?: string, isActive = false) => {
      let color = '#f59e0b'; // Amber (TWD)
      if (group === 'HBY') color = '#6366f1'; // Indigo (HBY)
      if (group === 'HO') color = '#0d9488'; // Teal (HO)
      
      const size = isActive ? 'h-7 w-7' : 'h-5 w-5';
      const innerSize = isActive ? 'h-5 w-5' : 'h-3.5 w-3.5';
      const pulseSize = isActive ? 'h-9 w-9 -top-1 -left-1' : 'h-7 w-7 -top-1 -left-1';

      return L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <!-- Pulsing ring -->
            <span class="animate-pulse absolute ${pulseSize} rounded-full opacity-40 shadow-inner" style="background-color: ${color};"></span>
            <!-- Inner core with border -->
            <div class="${size} rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-300" style="background-color: ${color};">
              <div class="${innerSize} rounded-full bg-white opacity-80 scale-50"></div>
            </div>
          </div>
        `,
        className: 'custom-leaflet-icon',
        iconSize: isActive ? [36, 36] : [28, 28],
        iconAnchor: isActive ? [18, 18] : [14, 14],
      });
    };

    const bounds = L.latLngBounds([]);

    filteredBranches.forEach((branch) => {
      if (!branch.latitude || !branch.longitude) return;

      const position: L.LatLngExpression = [branch.latitude, branch.longitude];
      bounds.extend(position);

      const isActive = selectedBranch?.id === branch.id;
      const marker = L.marker(position, {
        icon: createCustomIcon(branch.storeGroup, isActive),
      });

      // Construct Popup Content with Tailwind CSS styles
      const groupLabel = branch.storeGroup === 'HBY' ? 'HBY (BnB Home)' : branch.storeGroup === 'HO' ? 'HO (สำนักงานใหญ่)' : 'TWD (ไทวัสดุ)';
      const groupColorClass = branch.storeGroup === 'HBY' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : branch.storeGroup === 'HO' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-amber-50 text-amber-700 border border-amber-100';

      const popupHtml = `
        <div class="p-2 font-sans max-w-[240px]">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${groupColorClass}">
              ${groupLabel}
            </span>
            <span class="text-[10px] text-slate-400 font-mono font-bold">${branch.code}</span>
          </div>
          <h3 class="text-xs font-bold text-slate-800 mb-1" style="margin-top: 2px;">${branch.name}</h3>
          <p class="text-[10px] text-slate-500 mb-2 leading-relaxed" style="margin-bottom: 8px;">${branch.address || '-'}</p>
          
          <div class="space-y-1 text-[10px] text-slate-600 border-t border-slate-100 pt-1.5 mb-2.5" style="border-top: 1px solid #f1f5f9; padding-top: 6px; margin-bottom: 10px;">
            <div class="flex items-center gap-1">
              <span>🕒</span>
              <span>เวลาเปิด-ปิด: ${branch.openTime} - ${branch.closeTime}</span>
            </div>
            <div class="flex items-center gap-1" style="margin-top: 2px;">
              <span>📞</span>
              <span>เบอร์โทร: ${branch.phone}</span>
            </div>
          </div>
          
          <a href="https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="block w-full text-center px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700 transition-colors shadow-xs"
             style="text-decoration: none; color: white; display: block; text-align: center; background-color: #2563eb; padding: 4px; border-radius: 4px;">
             📍 นำทางด้วย Google Maps
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        className: 'custom-leaflet-popup',
      });

      marker.on('click', () => {
        setSelectedBranch(branch);
      });

      marker.addTo(markersLayer);
    });

    // Auto fit map bounds if we have markers and aren't focused on a single branch
    if (filteredBranches.length > 0 && !selectedBranch) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [filteredBranches, selectedBranch]);

  // Center map on selected branch list click
  const handleBranchClick = (branch: Branch) => {
    setSelectedBranch(branch);
    const map = mapRef.current;
    if (map && branch.latitude && branch.longitude) {
      map.setView([branch.latitude, branch.longitude], 14);
      
      // Find marker in layer and open its popup
      const markersLayer = markersLayerRef.current;
      if (markersLayer) {
        markersLayer.eachLayer((layer: any) => {
          const latLng = layer.getLatLng();
          if (latLng.lat === branch.latitude && latLng.lng === branch.longitude) {
            layer.openPopup();
          }
        });
      }
    }
  };

  // Render Group Badges in List
  const getGroupBadge = (group?: string) => {
    if (!group) return null;
    switch (group) {
      case 'HBY':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">HBY</span>;
      case 'TWD':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100">TWD</span>;
      case 'HO':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-100">HO</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-700 border border-slate-200">{group}</span>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-140px)]">
      {/* LEFT SIDEBAR: List of Stores & Filters */}
      <div className="w-full lg:w-96 flex flex-col bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden shrink-0">
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex items-center space-x-2 bg-transparent">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-800">ค้นหาสาขาบนแผนที่ ({filteredBranches.length})</h3>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัส, จังหวัด..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedBranch(null); // clear select focus to allow bounds reset
              }}
              className="v-input w-full pl-9 py-1.5 text-xs"
            />
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="grid grid-cols-4 gap-1">
            {['All', 'TWD', 'HBY', 'HO'].map((grp) => (
              <button
                key={grp}
                onClick={() => {
                  setSelectedGroup(grp);
                  setSelectedBranch(null); // clear select focus
                }}
                className={`py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                  selectedGroup === grp
                    ? grp === 'TWD'
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                      : grp === 'HBY'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : grp === 'HO'
                      ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                      : 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {grp === 'All' ? 'ทั้งหมด' : grp}
              </button>
            ))}
          </div>
        </div>

        {/* Store List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[300px] lg:max-h-none">
          {filteredBranches.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              ไม่พบข้อมูลสาขาที่ตรงกับเงื่อนไข
            </div>
          ) : (
            filteredBranches.map((branch) => {
              const isSelected = selectedBranch?.id === branch.id;
              return (
                <div
                  key={branch.id}
                  onClick={() => handleBranchClick(branch)}
                  className={`p-3 text-left cursor-pointer transition-colors hover:bg-slate-50/50 ${
                    isSelected ? 'bg-blue-50/40 border-l-4 border-blue-600 pl-2' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-1.5">
                      {getGroupBadge(branch.storeGroup)}
                      <span className="font-mono text-[10px] font-bold text-slate-400">#{branch.code}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{branch.province}</span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-slate-800 mb-1">{branch.name}</h4>
                  
                  {branch.address && (
                    <p className="text-[10px] text-slate-400 truncate mb-2">{branch.address}</p>
                  )}

                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-blue-100 flex items-center justify-between text-[10px] animate-fadeIn">
                      <div className="text-slate-500 space-y-0.5">
                        <div>🕒 {branch.openTime} - {branch.closeTime}</div>
                        <div>📞 {branch.phone}</div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 font-bold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Navigation className="h-3 w-3" />
                        <span>เปิดแผนที่</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Interactive Leaflet Map */}
      <div className="flex-1 min-h-[350px] lg:min-h-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs relative">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
        
        {/* Leaflet CSS customizations */}
        <style dangerouslySetInnerHTML={{__html: `
          .leaflet-popup-content-wrapper {
            border-radius: 12px !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
            border: 1px solid #e2e8f0 !important;
            padding: 2px !important;
          }
          .leaflet-popup-tip {
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
          }
          .leaflet-container {
            font-family: inherit !important;
          }
        `}} />
      </div>
    </div>
  );
};
