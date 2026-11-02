/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Map, MapPin, Navigation, Calendar, Clock, Plus, Trash2, Library, Truck, Info, Settings, X, ChevronLeft, Menu, ArrowDown, CalendarCheck, MousePointerClick, LogIn, LogOut, Compass, Loader2, Lock, Mail, KeyRound, ShieldCheck, ExternalLink, BookOpen, Globe, Building2, MapPinned, Info as InfoIcon } from 'lucide-react';

import { createClient } from '@supabase/supabase-js';

// ==========================================
// 🔴 KONFIGURASI SUPABASE DATABASE
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = true; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- DATA DUMMY ---
const PERPUSDA_BASE = {
  id: 'base-0',
  nama: 'Perpusda Kab. Bogor (Pemda Cibinong)',
  lat: -6.4798,
  lng: 106.8283,
  deskripsi: 'Titik keberangkatan dan garasi mobil pusling.',
  tipe: 'base'
};

const INITIAL_LOKASI = [
  { id: '1', nama: 'Alun-Alun Cirimekar', lat: -6.4718, lng: 106.8528, hari: 'Senin', jam: '09:00 - 12:00', deskripsi: 'Mangkal di area parkir timur.' },
  { id: '2', nama: 'Kantor Desa Bojong Gede', lat: -6.4950, lng: 106.7950, hari: 'Selasa', jam: '10:00 - 14:00', deskripsi: 'Kerjasama dengan aparat desa setempat.' },
  { id: '3', nama: 'Kantor Kec. Tajurhalang', lat: -6.4500, lng: 106.7500, hari: 'Rabu', jam: '09:00 - 13:00', deskripsi: 'Target sasaran siswa SD sekitar.' },
  { id: '4', nama: 'Stadion Pakansari', lat: -6.5015, lng: 106.8291, hari: 'Senin', jam: '14:00 - 17:00', deskripsi: 'Mangkal di area Gate 3 saat sore hari.' },
  { id: '5', nama: 'Situ Cikaret', lat: -6.4589, lng: 106.8375, hari: 'Kamis', jam: '08:00 - 11:30', deskripsi: 'Area wisata, banyak anak-anak.' },
];

const HARI_OPERASIONAL = ['Semua Hari', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// --- SMART SORTING ALGORITHM ---
const dayOrderMap = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7 };
const getTodayName = () => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[new Date().getDay()];
};

const AppLogo = ({ className = "w-10 h-10" }) => (
  <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-400 shadow-xl shadow-blue-500/20 border-2 border-white shrink-0 transition-all duration-500 hover:scale-110 hover:-translate-y-1 ${className}`}>
    <Library className="text-white absolute drop-shadow-md" size="50%" style={{ transform: 'translateY(-2px)' }} />
    <MapPin className="text-blue-100 absolute drop-shadow-lg" size="45%" style={{ transform: 'translate(10px, 8px)' }} />
  </div>
);

export default function App() {
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [currentPage, _setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('pusling_current_page');
    if (saved === 'home') return 'landing';
    return saved || 'landing';
  });
  const setCurrentPage = (page) => {
    localStorage.setItem('pusling_current_page', page);
    _setCurrentPage(page);
  };

  const [filterHari, setFilterHari] = useState('Semua Hari');
  const [lokasiData, setLokasiData] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // --- AUTHENTICATION STATES ---
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [userLocation, _setUserLocation] = useState(null);
  const userLocationRef = useRef(null);
  const setUserLocation = (loc) => { userLocationRef.current = loc; _setUserLocation(loc); };

  const [isLocating, setIsLocating] = useState(false);
  const userMarkerRef = useRef(null);

  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState('info'); 
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [selectedLokasi, setSelectedLokasi] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); 
  const [formData, setFormData] = useState({ id: '', nama: '', lat: '', lng: '', hari: 'Senin', jamMulai: '', jamSelesai: '', deskripsi: '' });
  const [isSaving, setIsSaving] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const adminMapRef = useRef(null);
  const adminMapInstance = useRef(null);
  const adminMarkersRef = useRef([]);
  const modalMapRef = useRef(null);
  const modalMapInstance = useRef(null);
  const modalMarkerRef = useRef(null);

  const showToast = (msg, type = 'info') => {
    setToastMsg(msg); setToastType(type); setTimeout(() => setToastMsg(null), 4000);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c; 
  };

  const handleFindNearest = () => {
    if (!navigator.geolocation) { showToast("Geolokasi tidak didukung.", "error"); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude; const userLng = pos.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });
        let nearest = null; let minDistance = Infinity;
        const dataToCheck = lokasiData.length > 0 ? lokasiData : INITIAL_LOKASI;
        dataToCheck.forEach((loc) => {
          const dist = getDistance(userLat, userLng, loc.lat, loc.lng);
          if (dist < minDistance) { minDistance = dist; nearest = loc; }
        });
        if (nearest) {
          setIsLocating(false); handleMarkerClick(nearest); 
          showToast(`Lokasi terdekat: ${nearest.nama} (${minDistance.toFixed(2)} km)`, "success");
        }
      },
      (err) => { showToast("Gagal mendeteksi lokasi Anda.", "error"); setIsLocating(false); },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
      return () => subscription.unsubscribe();
    } else {
      const dummySession = localStorage.getItem('dummy_pusling_session');
      if (dummySession) setSession(JSON.parse(dummySession));
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault(); setIsAuthenticating(true);
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) showToast(`Login gagal: ${error.message}`, 'error');
      else { showToast("Berhasil login!", "success"); setAuthEmail(''); setAuthPassword(''); setCurrentPage('admin'); }
    } else {
      setTimeout(() => {
        if (authEmail === 'admin@admin.com' && authPassword === 'admin123') {
          const fakeSession = { user: { email: authEmail } }; setSession(fakeSession);
          localStorage.setItem('dummy_pusling_session', JSON.stringify(fakeSession)); showToast("Login (Mode Simulasi)");
          setAuthEmail(''); setAuthPassword(''); setCurrentPage('admin');
        } else showToast("Kredensial salah!", "error");
        setIsAuthenticating(false);
      }, 1000); return;
    }
    setIsAuthenticating(false);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut(); setCurrentPage('landing'); showToast("Berhasil logout.");
    } else {
      setSession(null); localStorage.removeItem('dummy_pusling_session'); setCurrentPage('landing'); showToast("Logout (Simulasi)");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.from('lokasi_pusling').select('*').order('created_at', { ascending: false });
          if (error) throw error; setLokasiData(data || []);
        } catch (error) { showToast(`Gagal muat database: ${error.message}`, 'error'); setLokasiData(INITIAL_LOKASI); }
      } else { setTimeout(() => setLokasiData(INITIAL_LOKASI), 600); }
      setIsDataLoading(false);
    };
    fetchData();
  }, []);

  const handleSaveData = async (e) => {
    e.preventDefault(); setIsSaving(true);
    const jamCombined = `${formData.jamMulai} - ${formData.jamSelesai}`;
    const dataToSave = { 
      nama: formData.nama, 
      lat: parseFloat(formData.lat), 
      lng: parseFloat(formData.lng), 
      hari: formData.hari, 
      jam: jamCombined, 
      deskripsi: formData.deskripsi 
    };

    if (isSupabaseConfigured) {
      try {
        if (modalMode === 'add') {
          const { data, error } = await supabase.from('lokasi_pusling').insert([dataToSave]).select();
          if (error) throw error; setLokasiData([data[0], ...lokasiData]); showToast("Lokasi ditambahkan.");
        } else {
          const { data, error } = await supabase.from('lokasi_pusling').update(dataToSave).eq('id', formData.id).select();
          if (error) throw error; setLokasiData(lokasiData.map(loc => loc.id === formData.id ? data[0] : loc));
          if(selectedLokasi?.id === formData.id) clearRouteState(); showToast("Lokasi diperbarui.");
        }
        setIsModalOpen(false);
      } catch (error) { showToast(`Gagal menyimpan: ${error.message}`, 'error'); }
    } else {
      setTimeout(() => {
        if (modalMode === 'add') setLokasiData([{ ...dataToSave, id: Date.now().toString() }, ...lokasiData]);
        else { setLokasiData(lokasiData.map(loc => loc.id === formData.id ? { ...dataToSave, id: formData.id } : loc)); if(selectedLokasi?.id === formData.id) clearRouteState(); }
        setIsModalOpen(false); showToast("Disimpan! (Simulasi)");
      }, 500);
    }
    setIsSaving(false);
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      message: "Yakin hapus permanen?",
      onConfirm: async () => {
        setConfirmDialog(null);
        if (isSupabaseConfigured) {
          try {
            await supabase.from('lokasi_pusling').delete().eq('id', id); setLokasiData(lokasiData.filter(loc => loc.id !== id));
            if(selectedLokasi?.id === id) clearRouteState(); showToast("Dihapus.");
          } catch (error) { showToast(`Gagal hapus: ${error.message}`, 'error'); }
        } else {
          setLokasiData(lokasiData.filter(loc => loc.id !== id)); if(selectedLokasi?.id === id) clearRouteState(); showToast("Dihapus! (Simulasi)");
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleDragUpdate = async (id, newLat, newLng, originLat, originLng, markerEventTarget) => {
    const rLat = parseFloat(newLat.toFixed(5)); const rLng = parseFloat(newLng.toFixed(5));
    if (isSupabaseConfigured) {
      try {
        await supabase.from('lokasi_pusling').update({ lat: rLat, lng: rLng }).eq('id', id);
        setLokasiData(prev => prev.map(l => l.id === id ? { ...l, lat: rLat, lng: rLng } : l)); showToast("Koordinat diupdate.");
      } catch (error) { markerEventTarget.setLatLng([originLat, originLng]); showToast("Gagal update.", 'error'); }
    } else { setLokasiData(prev => prev.map(l => l.id === id ? { ...l, lat: rLat, lng: rLng } : l)); showToast("Update (Simulasi)"); }
  };

  const locateUser = () => {
    setIsLocating(true);
    if (!navigator.geolocation) { showToast("Geolokasi tidak didukung.", "error"); setIsLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { const { latitude, longitude } = pos.coords; setUserLocation({ lat: latitude, lng: longitude }); setIsLocating(false); if (mapInstance.current) mapInstance.current.setView([latitude, longitude], 14); },
      (err) => { showToast("Akses lokasi dibatasi.", "error"); setIsLocating(false); }, { enableHighAccuracy: true }
    );
  };

  const clearRouteState = () => { setSelectedLokasi(null); if (routeLayerRef.current && mapInstance.current) { mapInstance.current.removeLayer(routeLayerRef.current); routeLayerRef.current = null; } setRouteInfo(null); };

  useEffect(() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }, []);
  useEffect(() => {
    if (document.getElementById('leaflet-css')) { setIsLeafletLoaded(true); return; }
    const link = document.createElement('link'); link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
    const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.onload = () => setIsLeafletLoaded(true); document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (currentPage !== 'map') return;
    if (!isLeafletLoaded || !mapRef.current) return;
    if (!mapInstance.current) {
      const L = window.L;
      mapInstance.current = L.map(mapRef.current, { zoomControl: false }).setView([PERPUSDA_BASE.lat, PERPUSDA_BASE.lng], 13);
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(mapInstance.current);
      mapInstance.current.on('click', clearRouteState);

      const baseIcon = L.divIcon({
        className: 'custom-icon',
        html: `<div class="relative group"><div class="absolute -inset-2 bg-blue-400 rounded-full opacity-20 group-hover:opacity-40 animate-pulse"></div><div style="background: linear-gradient(135deg, #60a5fa, #818cf8); color: white; border-radius: 50%; padding: 4px; width: 44px; height: 44px; display: flex; justify-content: center; align-items: center; box-shadow: 0 10px 15px -3px rgb(59 130 246 / 0.4); border: 3px solid white; position: relative;"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg></div></div>`,
        iconSize: [44, 44], iconAnchor: [22, 22]
      });

      L.marker([PERPUSDA_BASE.lat, PERPUSDA_BASE.lng], { icon: baseIcon }).addTo(mapInstance.current).bindTooltip(`<div class="text-sm font-bold text-slate-700">${PERPUSDA_BASE.nama}</div>`, { direction: 'top', className: 'border-0 shadow-lg' })
        .on('click', (e) => { if(e.originalEvent) e.originalEvent.stopPropagation(); if (window.innerWidth < 1024) setIsSidebarOpen(false); handleMarkerClick(PERPUSDA_BASE); });
    }

    setTimeout(() => {
      if (mapInstance.current) mapInstance.current.invalidateSize();
    }, 250);

    const L = window.L;
    if (markersRef.current) {
      markersRef.current.forEach(marker => mapInstance.current.removeLayer(marker));
      markersRef.current = [];
    } else {
      markersRef.current = [];
    }

    const destIcon = L.divIcon({
      className: 'custom-icon transition-transform hover:scale-110',
      html: `<div style="background: linear-gradient(135deg, #34d399, #2dd4bf); color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(45, 212, 191, 0.4); border: 2.5px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>`,
      iconSize: [34, 34], iconAnchor: [17, 17]
    });

    lokasiData.filter(loc => filterHari === 'Semua Hari' || loc.hari === filterHari).forEach(loc => {
      const marker = L.marker([loc.lat, loc.lng], { icon: destIcon }).addTo(mapInstance.current).on('click', (e) => {
        if(e.originalEvent) e.originalEvent.stopPropagation(); if (window.innerWidth < 1024) setIsSidebarOpen(false); handleMarkerClick(loc);
      });
      markersRef.current.push(marker);
    });
  }, [isLeafletLoaded, currentPage, lokasiData, filterHari]);

  const sortedLokasiData = [...lokasiData.filter(loc => filterHari === 'Semua Hari' || loc.hari === filterHari)].sort((a, b) => {
    const todayNum = dayOrderMap[getTodayName()] || 1;
    const dayA = dayOrderMap[a.hari] || 8;
    const dayB = dayOrderMap[b.hari] || 8;
    const weightA = (dayA - todayNum + 7) % 7;
    const weightB = (dayB - todayNum + 7) % 7;
    if (weightA !== weightB) return weightA - weightB;
    const timeA = a.jam.split('-')[0].trim();
    const timeB = b.jam.split('-')[0].trim();
    return timeA.localeCompare(timeB);
  });

  useEffect(() => {
    if (!isLeafletLoaded || !adminMapRef.current || currentPage !== 'admin' || !session) return;
    const L = window.L;
    if (!adminMapInstance.current) {
      adminMapInstance.current = L.map(adminMapRef.current).setView([PERPUSDA_BASE.lat, PERPUSDA_BASE.lng], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(adminMapInstance.current);
      adminMapInstance.current.on('click', (e) => { setModalMode('add'); setFormData({ id: '', nama: '', lat: parseFloat(e.latlng.lat).toFixed(5), lng: parseFloat(e.latlng.lng).toFixed(5), hari: 'Senin', jamMulai: '09:00', jamSelesai: '12:00', deskripsi: '' }); setIsModalOpen(true); });
    }
    adminMarkersRef.current.forEach(marker => adminMapInstance.current.removeLayer(marker));
    adminMarkersRef.current = [];
    const adminIcon = L.divIcon({
      className: 'custom-icon cursor-move hover:scale-110 transition-transform',
      html: `<div style="background: linear-gradient(135deg, #34d399, #2dd4bf); color: white; border-radius: 50%; padding: 6px; width: 34px; height: 34px; display: flex; justify-content: center; align-items: center; box-shadow: 0 6px 12px rgba(45, 212, 191, 0.3); border: 2.5px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>`,
      iconSize: [34, 34], iconAnchor: [17, 17]
    });
    lokasiData.forEach(loc => {
      const marker = L.marker([loc.lat, loc.lng], { icon: adminIcon, draggable: true }).addTo(adminMapInstance.current)
        .on('click', (e) => { if(e.originalEvent) e.originalEvent.stopPropagation(); handleOpenModal('edit', loc); })
        .on('dragend', (e) => {
          const newLatLng = e.target.getLatLng();
          setConfirmDialog({ message: `Update koordinat untuk lokasi "${loc.nama}" ke Database?`,
            onConfirm: () => { handleDragUpdate(loc.id, newLatLng.lat, newLatLng.lng, loc.lat, loc.lng, e.target); setConfirmDialog(null); },
            onCancel: () => { e.target.setLatLng([loc.lat, loc.lng]); setConfirmDialog(null); }
          });
        });
      adminMarkersRef.current.push(marker);
    });
  }, [isLeafletLoaded, currentPage, lokasiData, session]);

  useEffect(() => { setTimeout(() => { if (currentPage === 'map' && mapInstance.current) mapInstance.current.invalidateSize(); if (currentPage === 'admin' && session && adminMapInstance.current) adminMapInstance.current.invalidateSize(); }, 300); }, [currentPage, isSidebarOpen, session]);

  useEffect(() => {
    if (!mapInstance.current || !userLocation || currentPage !== 'map') return;
    const L = window.L;
    if (userMarkerRef.current) mapInstance.current.removeLayer(userMarkerRef.current);
    const userIcon = L.divIcon({
      className: 'custom-icon',
      html: `<div class="relative flex h-6 w-6"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60"></span><span class="relative inline-flex rounded-full h-6 w-6 bg-blue-500 border-[3px] border-white shadow-lg"></span></div>`,
      iconSize: [24, 24], iconAnchor: [12, 12]
    });
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstance.current);
  }, [userLocation, currentPage]);

  useEffect(() => {
    if (isModalOpen && modalMapRef.current && isLeafletLoaded) {
      const timer = setTimeout(() => {
        const L = window.L; let initialLat = parseFloat(formData.lat); let initialLng = parseFloat(formData.lng);
        if (isNaN(initialLat) || isNaN(initialLng)) { initialLat = PERPUSDA_BASE.lat; initialLng = PERPUSDA_BASE.lng; }
        if (!modalMapInstance.current) {
          modalMapInstance.current = L.map(modalMapRef.current).setView([initialLat, initialLng], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(modalMapInstance.current);
          const modalIcon = L.divIcon({
            className: 'custom-icon cursor-move',
            html: `<div style="background: #34d399; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: 2.5px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>`,
            iconSize: [32, 32], iconAnchor: [16, 16]
          });
          modalMarkerRef.current = L.marker([initialLat, initialLng], { icon: modalIcon, draggable: true }).addTo(modalMapInstance.current);
          modalMarkerRef.current.on('dragend', (e) => { const { lat, lng } = e.target.getLatLng(); setFormData(prev => ({ ...prev, lat: lat.toFixed(5), lng: lng.toFixed(5) })); modalMapInstance.current.panTo([lat, lng]); });
          modalMapInstance.current.on('click', (e) => { const { lat, lng } = e.latlng; modalMarkerRef.current.setLatLng([lat, lng]); setFormData(prev => ({ ...prev, lat: lat.toFixed(5), lng: lng.toFixed(5) })); modalMapInstance.current.panTo([lat, lng]); });
        } else modalMapInstance.current.invalidateSize();
      }, 250); return () => clearTimeout(timer);
    } else { if (modalMapInstance.current) { modalMapInstance.current.remove(); modalMapInstance.current = null; modalMarkerRef.current = null; } }
  }, [isModalOpen, isLeafletLoaded]);

  useEffect(() => {
    if (modalMapInstance.current && modalMarkerRef.current) {
      const lat = parseFloat(formData.lat); const lng = parseFloat(formData.lng);
      if (!isNaN(lat) && !isNaN(lng)) modalMarkerRef.current.setLatLng([lat, lng]);
    }
  }, [formData.lat, formData.lng]);

  const drawRoute = async (start, end) => {
    setIsLoadingRoute(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url); const data = await res.json();
      const L = window.L;
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]; setRouteInfo({ distance: (route.distance / 1000).toFixed(2), duration: Math.ceil(route.duration / 60) });
        routeLayerRef.current = L.geoJSON(route.geometry, { style: { color: '#60a5fa', weight: 6, opacity: 0.85, lineCap: 'round', lineJoin: 'round' } }).addTo(mapInstance.current);
        mapInstance.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50], animate: true, duration: 1.5 });
      }
    } catch (error) {
      const L = window.L; routeLayerRef.current = L.polyline([[start.lat, start.lng], [end.lat, end.lng]], { color: '#60a5fa', dashArray: '8, 12', weight: 4 }).addTo(mapInstance.current);
      mapInstance.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50], animate: true, duration: 1.5 });
    } finally { setIsLoadingRoute(false); }
  };

  const handleMarkerClick = (loc) => {
    setSelectedLokasi(loc);
    if (routeLayerRef.current && mapInstance.current) { mapInstance.current.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
    setRouteInfo(null);
    const currentUserLoc = userLocationRef.current;
    if (currentUserLoc) { drawRoute(currentUserLoc, loc); } else {
      setIsLoadingRoute(true);
      if (!navigator.geolocation) { showToast("Geolokasi ditolak.", "error"); setIsLoadingRoute(false); return; }
      navigator.geolocation.getCurrentPosition(
        async (pos) => { const { latitude, longitude } = pos.coords; const newLoc = { lat: latitude, lng: longitude }; setUserLocation(newLoc); if (mapInstance.current) mapInstance.current.setView([latitude, longitude], 13); await drawRoute(newLoc, loc); },
        (err) => { showToast("Akses lokasi dibatasi.", "error"); setIsLoadingRoute(false); }, { enableHighAccuracy: true }
      );
    }
  };

  const handleOpenModal = (mode, loc = null) => {
    setModalMode(mode); 
    if (mode === 'edit' && loc) {
      const [jamMulai, jamSelesai] = loc.jam ? loc.jam.split('-').map(s => s.trim()) : ['09:00', '12:00'];
      setFormData({ ...loc, jamMulai: jamMulai || '', jamSelesai: jamSelesai || '' });
    } else {
      setFormData({ id: '', nama: '', lat: '', lng: '', hari: 'Senin', jamMulai: '09:00', jamSelesai: '12:00', deskripsi: '' }); 
    }
    setIsModalOpen(true);
  };
  const handleFormChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

  if (!isLeafletLoaded && (currentPage === 'map' || currentPage === 'admin')) return <div className="flex h-[100dvh] items-center justify-center bg-slate-50 text-blue-500 font-semibold tracking-wide">Memuat Sistem Spasial...</div>;

  return (
    <div className="h-[100dvh] w-full font-sans bg-slate-50 flex flex-col overflow-hidden relative selection:bg-blue-300 selection:text-blue-900 scroll-smooth">
      
      {!isSupabaseConfigured && currentPage === 'admin' && session && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-center text-xs py-2 font-bold z-[6000] w-full absolute top-0 shadow-lg tracking-wide uppercase backdrop-blur-md">
           🚧 Aplikasi Berjalan dalam Mode Simulasi. Masukkan Kredensial Supabase.
        </div>
      )}

      {/* NAVBAR */}
      {(currentPage === 'landing' || currentPage === 'map') && (
        <nav className="absolute top-0 left-0 right-0 z-[100] px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/60 backdrop-blur-2xl border border-white/70 rounded-full px-4 sm:px-6 py-2.5 shadow-lg shadow-slate-200/40">
            <button onClick={() => setCurrentPage('landing')} className="flex items-center gap-2.5">
              <AppLogo className="w-9 h-9" />
              <div className="hidden sm:block">
                <p className="text-sm font-black text-slate-800 leading-tight">SIG Pusling</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Kab. Bogor</p>
              </div>
            </button>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => setCurrentPage('landing')} className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${currentPage === 'landing' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-white/80'}`}>Beranda</button>
              <button onClick={() => setCurrentPage('map')} className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${currentPage === 'map' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-white/80'}`}>Peta Pusling</button>
              <button onClick={() => setCurrentPage('admin')} className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-600 hover:bg-white/80 flex items-center gap-1.5"><LogIn size={14}/> {session ? 'Dashboard' : 'Login'}</button>
            </div>
          </div>
        </nav>
      )}

      {/* ========================================= */}
      {/* 1. LANDING PAGE                          */}
      {/* ========================================= */}
      <div className={`flex-1 flex-col overflow-y-auto scroll-smooth ${currentPage === 'landing' ? 'flex' : 'hidden'}`}>
        <section className="min-h-[100dvh] relative flex flex-col items-center justify-center p-6 overflow-hidden bg-slate-50">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-200/40 blur-[120px] mix-blend-multiply opacity-70 animate-pulse"></div>
            <div className="absolute top-[30%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-teal-200/40 blur-[100px] mix-blend-multiply opacity-60"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] rounded-full bg-indigo-100/50 blur-[120px] mix-blend-multiply opacity-80"></div>
          </div>

          <div className="relative z-10 max-w-6xl w-full flex flex-col items-center text-center mt-16">
            <AppLogo className="w-24 h-24 sm:w-28 sm:h-28 mb-8 ring-4 ring-white shadow-2xl" />
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/70 backdrop-blur-md border border-white/80 text-blue-600 text-sm font-semibold mb-6 shadow-sm">
              <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span></span>
              Sistem Informasi Geografis Perpustakaan Keliling
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-800 mb-6 tracking-tight leading-[1.1]">
              SIG <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400">Pusling</span><br/>Kabupaten Bogor
            </h1>
            <p className="text-slate-500 text-base md:text-xl max-w-3xl mb-10 font-medium leading-relaxed px-4">
              Sistem Informasi Spasial untuk memetakan, memantau, dan menginformasikan jadwal serta lokasi keberadaan Mobil Perpustakaan Keliling Kabupaten Bogor secara real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <button onClick={() => setCurrentPage('map')} className="group bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-full text-base font-bold flex items-center gap-3 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-300">
                <Map size={20}/> Lihat Peta Pusling <ChevronLeft size={18} className="rotate-180 group-hover:translate-x-1 transition-transform"/>
              </button>
              <button onClick={() => document.getElementById('about-section').scrollIntoView({ behavior: 'smooth' })} className="bg-white/80 backdrop-blur-md text-slate-700 px-8 py-4 rounded-full text-base font-bold border border-white shadow-lg hover:bg-white hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
                <InfoIcon size={18}/> Pelajari Lebih Lanjut
              </button>
            </div>
          </div>
        </section>

        <section id="about-section" className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 mb-4">Tentang Kami</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">Mengenal Perpustakaan Keliling, SIG-Pusling, dan Perpustakaan Umum Daerah Kabupaten Bogor</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] p-8 sm:p-10 border border-blue-100 shadow-xl shadow-blue-500/5 hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <Truck size={32} className="text-white"/>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4">Perpustakaan Keliling</h3>
                <p className="text-slate-600 leading-relaxed mb-6">Perpustakaan Keliling (Pusling) merupakan layanan perpustakaan bergerak yang hadir langsung ke masyarakat, terutama di daerah yang belum memiliki akses mudah ke perpustakaan konvensional. Melalui armada bus/mobil perpustakaan, layanan baca, pinjam-kembali, dan literasi bisa dinikmati di berbagai titik seperti alun-alun, desa, sekolah, maupun tempat umum.</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div><span>Layanan baca gratis untuk semua kalangan</span></li>
                  <li className="flex items-start gap-3 text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div><span>Jangkauan ke pelosok dan wilayah minim akses</span></li>
                  <li className="flex items-start gap-3 text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div><span>Wadah pengembangan minat baca masyarakat</span></li>
                </ul>
              </div>

              <div className="group bg-gradient-to-br from-teal-50 to-emerald-50 rounded-[2.5rem] p-8 sm:p-10 border border-teal-100 shadow-xl shadow-teal-500/5 hover:shadow-teal-500/10 hover:-translate-y-2 transition-all duration-500">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
                  <Globe size={32} className="text-white"/>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4">Sistem Informasi Geografis (SIG) Pusling</h3>
                <p className="text-slate-600 leading-relaxed mb-6">SIG Pusling adalah aplikasi berbasis web yang memadukan data spasial (lokasi dan rute) dengan jadwal operasional Perpustakaan Keliling. Dengan sistem ini, masyarakat dapat dengan mudah mengetahui keberadaan armada pusling terdekat, jadwal mangkal, estimasi jarak dan rute perjalanan secara real-time.</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2"></div><span>Pemetaan titik mangkal berbasis lokasi</span></li>
                  <li className="flex items-start gap-3 text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2"></div><span>Filter jadwal harian & pencarian terdekat</span></li>
                  <li className="flex items-start gap-3 text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2"></div><span>Navigasi rute & estimasi waktu tempuh</span></li>
                </ul>
              </div>

              <div className="group bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2.5rem] p-8 sm:p-10 border border-amber-100 shadow-xl shadow-amber-500/5 hover:shadow-amber-500/10 hover:-translate-y-2 transition-all duration-500">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                  <Building2 size={32} className="text-white"/>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4">Perpustakaan Umum Daerah Kabupaten Bogor</h3>
                <p className="text-slate-600 leading-relaxed mb-6">Perpustakaan Umum Daerah (Perpusda) Kabupaten Bogor merupakan lembaga teknis daerah yang bertanggung jawab dalam pengembangan, pembinaan, dan pelaksanaan layanan perpustakaan untuk seluruh masyarakat Kabupaten Bogor. Perpusda berperan aktif dalam gerakan literasi, peningkatan minat baca, serta penyediaan akses informasi dan pengetahuan bagi warga.</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2"></div><span>Pusat layanan perpustakaan Kabupaten Bogor</span></li>
                  <li className="flex items-start gap-3 text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2"></div><span>Penggerak gerakan literasi masyarakat</span></li>
                  <li className="flex items-start gap-3 text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2"></div><span>Wadah pembelajaran & pengembangan budaya baca</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 mb-6">Siap Menemukan Armada Pusling?</h2>
            <p className="text-slate-500 text-lg mb-10">Cek jadwal dan lokasi Perpustakaan Keliling terdekat dari posisi Anda sekarang</p>
            <button onClick={() => setCurrentPage('map')} className="group bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-10 py-5 rounded-full text-lg font-bold flex items-center gap-3 shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:-translate-y-1 transition-all duration-300 mx-auto">
              <MapPinned size={24}/> Buka Peta Interaktif <ChevronLeft size={20} className="rotate-180 group-hover:translate-x-1 transition-transform"/>
            </button>
          </div>
        </section>

        <footer className="py-8 px-6 bg-slate-900 text-center">
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} SIG Pusling Kabupaten Bogor • Dibuat oleh <span className="text-blue-400 font-semibold">Musab Awwal</span></p>
        </footer>
      </div>

      {/* ========================================= */}
      {/* 2. MAP PAGE                              */}
      {/* ========================================= */}
      <div className={`flex-1 flex-col ${currentPage === 'map' ? 'flex' : 'hidden'}`}>
        <section className="flex flex-col h-[100dvh] relative bg-slate-100 overflow-hidden pt-16 sm:pt-20">
          <main className="flex flex-1 relative w-full h-full">
            <div id="map-container" ref={mapRef} className="absolute inset-0 z-0"></div>

            {isSidebarOpen && <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[40] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

            <aside className={`absolute top-0 left-0 z-[50] h-[100dvh] lg:h-[calc(100dvh-5rem)] lg:top-20 lg:bottom-4 lg:left-4 flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%] lg:-translate-x-[120%]'} w-[85vw] sm:w-[380px]`}>
              <div className="bg-white/40 backdrop-blur-2xl lg:rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border-r lg:border border-white/60 h-full flex flex-col overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500/90 to-teal-400/90 backdrop-blur-xl p-6 lg:rounded-t-[2rem] shrink-0 relative overflow-hidden border-b border-white/20">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/90 p-2.5 rounded-2xl shadow-sm"><Library size={24} className="text-blue-500" /></div>
                      <div>
                        <h1 className="text-xl font-black tracking-tight text-white leading-tight">GIS Pusling</h1>
                        <p className="text-blue-50 text-[11px] font-semibold tracking-wider">KABUPATEN BOGOR</p>
                      </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/30 hover:rotate-90 p-2.5 rounded-full backdrop-blur-md transition-all duration-500" title="Tutup Panel"><X size={18} /></button>
                  </div>
                </div>

                <div className="p-5 border-b border-white/30 bg-white/20 backdrop-blur-sm">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2 mb-3"><Calendar size={14} className="text-blue-600"/> Jadwal Operasional</label>
                  <select 
                    className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl p-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/20 focus:bg-white outline-none transition-all duration-300 shadow-sm cursor-pointer appearance-none"
                    value={filterHari}
                    onChange={(e) => { setFilterHari(e.target.value); clearRouteState(); mapInstance.current.setView([PERPUSDA_BASE.lat, PERPUSDA_BASE.lng], 13); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                  >
                    {HARI_OPERASIONAL.map(hari => <option key={hari} value={hari}>{hari}</option>)}
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/50 pb-20 lg:pb-4">
                  <div className="px-1 mb-4 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daftar Titik Lokasi</h3>
                    <span className="bg-blue-500/10 text-blue-700 border border-blue-200/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">{sortedLokasiData.length + 1} Titik</span>
                  </div>

                  <div className="space-y-3">
                    <div onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); handleMarkerClick(PERPUSDA_BASE); }} className={`p-4 rounded-[1.25rem] border-2 cursor-pointer transition-all duration-500 group ${selectedLokasi?.id === PERPUSDA_BASE.id ? 'border-blue-400 bg-blue-50/80 backdrop-blur-md shadow-md shadow-blue-500/10' : 'border-white/50 bg-white/30 backdrop-blur-md shadow-sm hover:bg-white/70 hover:shadow-lg'}`}>
                      <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-3"><div className="bg-blue-100/80 p-2 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-600"><Library size={16} /></div> {PERPUSDA_BASE.nama}</h4>
                      <p className="text-xs font-medium text-slate-600 ml-[44px]">Pusat Armada Perpustakaan</p>
                    </div>
                    
                    {isDataLoading ? (
                      <div className="flex flex-col items-center justify-center p-8 text-slate-500 gap-3"><Loader2 className="animate-spin text-blue-500 w-6 h-6" /><span className="text-xs font-medium">Memuat data...</span></div>
                    ) : (
                      <>
                        {sortedLokasiData.map(loc => {
                          const isToday = loc.hari === getTodayName();
                          return (
                            <div key={loc.id} onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); handleMarkerClick(loc); }} className={`relative p-4 rounded-[1.25rem] border-2 cursor-pointer transition-all duration-500 group overflow-hidden ${selectedLokasi?.id === loc.id ? 'border-teal-400 bg-teal-50/80 backdrop-blur-md shadow-md shadow-teal-500/10' : 'border-white/50 bg-white/30 backdrop-blur-md shadow-sm hover:bg-white/70 hover:shadow-lg'}`}>
                              {isToday && <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-400 to-orange-400 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl tracking-widest uppercase shadow-sm">Hari Ini</div>}
                              <h4 className={`font-bold text-sm mb-3 group-hover:text-teal-700 transition-colors pr-12 ${isToday ? 'text-slate-900' : 'text-slate-800'}`}>{loc.nama}</h4>
                              <div className="flex flex-wrap gap-2">
                                <span className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-lg text-[11px] font-bold ${isToday ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white/50 border-white/60 text-slate-700 group-hover:bg-white'}`}><Calendar size={12} className={isToday ? 'text-rose-500' : 'text-teal-500'}/> {loc.hari}</span>
                                <span className="flex items-center gap-1.5 bg-white/50 border border-white/60 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold group-hover:bg-white"><Clock size={12} className="text-teal-500"/> {loc.jam}</span>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="absolute top-5 left-5 z-[30] bg-white/60 backdrop-blur-2xl p-3.5 sm:p-4 rounded-[1.25rem] shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/60 text-slate-700 hover:text-blue-600 hover:bg-white/90 hover:scale-105 transition-all duration-500" title="Buka Panel Lokasi">
                <Menu size={22} />
              </button>
            )}

            <div className="absolute top-5 right-5 z-[30] flex flex-col gap-3 items-end">
              <div className="flex gap-2">
                <button onClick={handleFindNearest} className="bg-gradient-to-r from-blue-500/90 to-indigo-500/90 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-[1.25rem] shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-500 flex items-center justify-center gap-2 border border-blue-400/50" title="Cari Pusling Terdekat">
                  {isLocating ? <Loader2 className="animate-spin" size={20} /> : <MousePointerClick size={20} />}
                  <span className="text-sm font-bold hidden md:inline tracking-wide">Terdekat</span>
                </button>
                <button onClick={locateUser} className="bg-white/60 backdrop-blur-2xl p-3.5 sm:p-4 rounded-[1.25rem] shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/60 text-slate-700 hover:text-blue-600 hover:bg-white/90 hover:scale-105 transition-all duration-500 flex items-center justify-center" title="Lokasi Saat Ini">
                  <Compass size={20} className={`${isLocating ? 'animate-spin text-blue-500' : ''}`} />
                </button>
              </div>
            </div>
            
            {selectedLokasi && (
              <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[500px] bg-white/80 backdrop-blur-3xl p-5 sm:p-6 rounded-[2rem] shadow-[0_16px_40px_rgba(0,0,0,0.15)] z-[40] border border-white/70 animate-in slide-in-from-bottom-10 fade-in duration-500">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-lg sm:text-xl text-slate-800 pr-8">{selectedLokasi.nama}</h3>
                  <button onClick={clearRouteState} className="absolute top-5 right-5 sm:top-6 sm:right-6 bg-white/50 border border-white p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white hover:scale-110 transition-all"><X size={16}/></button>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm mb-5 sm:mb-6 leading-relaxed font-medium">{selectedLokasi.deskripsi}</p>
                
                <div className="bg-slate-50/50 backdrop-blur-md rounded-[1.25rem] p-4 sm:p-5 flex flex-col gap-4 border border-white/60 shadow-inner">
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col justify-center border-r border-slate-200/60">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1.5"><Navigation size={12} className="text-blue-500"/> Jarak Rute</span>
                      <span className="font-black text-blue-600 text-lg sm:text-xl">{isLoadingRoute ? '...' : `${routeInfo?.distance || 0} KM`}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center pl-2">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1.5"><Truck size={12} className="text-teal-500"/> Estimasi Tiba</span>
                      <span className="font-black text-teal-600 text-lg sm:text-xl">{isLoadingRoute ? '...' : `${routeInfo?.duration || 0} MNT`}</span>
                    </div>
                  </div>
                </div>

                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLokasi.lat},${selectedLokasi.lng}${userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ''}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-4 w-full bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-700 border border-blue-500/20 px-4 py-3 sm:py-3.5 rounded-[1.25rem] text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-500 shadow-sm hover:shadow-lg hover:shadow-blue-500/25 group"
                >
                  <ExternalLink size={18} className="group-hover:scale-110 transition-transform" /> Buka Navigasi Google Maps
                </a>
              </div>
            )}
          </main>
        </section>
      </div>

      {/* ========================================= */}
      {/* 3. ADMIN PAGE                            */}
      {/* ========================================= */}
      <div className={`flex-1 flex-col overflow-y-auto ${currentPage === 'admin' ? 'flex' : 'hidden'} ${!isSupabaseConfigured && session ? 'mt-8' : ''}`}>
        {!session ? (
          <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-200/50 blur-[120px] rounded-full pointer-events-none mix-blend-multiply opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-teal-200/50 blur-[100px] rounded-full pointer-events-none mix-blend-multiply opacity-60"></div>
            
            <button onClick={() => setCurrentPage('landing')} className="absolute top-6 left-6 text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-bold transition-colors bg-white/60 backdrop-blur-md px-4 sm:px-5 py-2.5 rounded-full border border-white shadow-sm hover:bg-white hover:shadow-md">
              <ChevronLeft size={16} /> <span className="hidden sm:inline">Kembali ke Beranda</span>
            </button>

            <div className="w-full max-w-md relative z-10 animate-in slide-in-from-bottom-10 fade-in duration-700">
              <div className="flex justify-center mb-8">
                <div className="bg-white/80 p-5 rounded-[2rem] border border-white shadow-xl shadow-blue-500/10">
                  <Lock size={36} className="text-blue-500" />
                </div>
              </div>
              
              <div className="text-center mb-10">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-3">Portal Pustakawan</h1>
                <p className="text-slate-500 text-sm font-medium px-4">Masuk untuk mengelola basis data rute Pusling.</p>
              </div>

              <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl shadow-slate-200/50">
                <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Alamat Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-white/50 border border-slate-200 rounded-[1.25rem] py-3.5 sm:py-4 pl-12 pr-4 text-slate-700 text-sm font-semibold focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400" placeholder="admin@admin.com"/>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Kata Sandi</label>
                    <div className="relative group">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-white/50 border border-slate-200 rounded-[1.25rem] py-3.5 sm:py-4 pl-12 pr-4 text-slate-700 text-sm font-semibold focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400" placeholder="••••••••"/>
                    </div>
                  </div>

                  <button type="submit" disabled={isAuthenticating} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 sm:py-4 rounded-[1.25rem] mt-6 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    {isAuthenticating ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    {isAuthenticating ? 'Memverifikasi...' : 'Masuk ke Sistem'}
                  </button>
                </form>
              </div>

              {!isSupabaseConfigured && (
                <div className="mt-8 text-center text-xs text-amber-600 bg-amber-50/80 backdrop-blur-sm p-4 rounded-2xl border border-amber-200 shadow-sm">
                  <b>Mode Simulasi Aktif:</b> Gunakan <i>admin@admin.com</i> & password <i>admin123</i>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 min-h-[100dvh] flex flex-col">
            <header className="bg-white/70 backdrop-blur-2xl border-b border-white p-3 sm:p-4 sticky top-0 z-20 shadow-sm">
              <div className="max-w-7xl mx-auto flex flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-blue-500 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-white shadow-lg shadow-blue-500/20"><Settings size={20}/></div>
                  <div>
                    <h1 className="text-base sm:text-xl font-black text-slate-800 tracking-tight">Dashboard Admin</h1>
                    <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest truncate max-w-[120px] sm:max-w-none">{session.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button onClick={() => setCurrentPage('map')} className="flex items-center justify-center gap-2 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 p-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all border border-slate-200 shadow-sm hover:shadow-md">
                    <span className="hidden sm:flex items-center gap-2"><Map size={16}/> Ke Peta</span>
                  </button>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-sm font-bold text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white p-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all border border-rose-100 shadow-sm hover:shadow-md hover:shadow-rose-500/20">
                    <LogOut size={18} /> <span className="hidden sm:inline">Keluar</span>
                  </button>
                </div>
              </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col lg:flex-row gap-5 sm:gap-8 flex-1">
              <div className="w-full lg:w-[45%] flex flex-col gap-5">
                <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 border border-white shadow-xl shadow-slate-200/40">
                  <h3 className="font-black text-slate-800 flex items-center gap-2.5 mb-3 text-base"><MapPin className="text-blue-500" size={20}/> Editor Peta Live</h3>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-5 font-medium">Klik area kosong untuk menambah titik. Geser pin di peta untuk memperbarui koordinat ke Supabase.</p>
                  <div className="w-full h-[350px] sm:h-[400px] lg:h-[500px] rounded-[1.25rem] overflow-hidden border-4 border-white relative z-0 shadow-inner">
                     <div id="admin-map-container" ref={adminMapRef} className="absolute inset-0"></div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[55%] flex flex-col pb-8">
                <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 border border-white shadow-xl shadow-slate-200/40 flex-1 flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">Data Operasional Pusling</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <span className="bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full">{lokasiData.length} Data</span>
                        {isSupabaseConfigured ? 
                          <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full"><div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div> Online DB</span> : 
                          <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Offline</span>
                        }
                      </div>
                    </div>
                    <button onClick={() => handleOpenModal('add')} className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-[1.25rem] text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
                      <Plus size={18} /> Tambah Data
                    </button>
                  </div>

                  <div className="border border-slate-100 bg-white/50 rounded-[1.25rem] overflow-hidden flex-1 relative shadow-sm">
                     {isDataLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>}
                    <div className="overflow-x-auto max-h-[500px] sm:max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                      <table className="w-full min-w-[550px] text-left text-sm">
                        <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 text-slate-400 sticky top-0 z-[5]">
                          <tr>
                            <th className="p-4 sm:p-5 font-black uppercase tracking-widest text-[10px] w-[40%]">Informasi Lokasi</th>
                            <th className="p-4 sm:p-5 font-black uppercase tracking-widest text-[10px] w-[30%]">Jadwal & Waktu</th>
                            <th className="p-4 sm:p-5 font-black uppercase tracking-widest text-[10px] text-center w-[15%]">Koordinat</th>
                            <th className="p-4 sm:p-5 font-black uppercase tracking-widest text-[10px] text-center w-[15%]">Opsi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lokasiData.map(loc => (
                            <tr key={loc.id} className="hover:bg-blue-50/50 transition-colors group">
                              <td className="p-4 sm:p-5 align-top">
                                <div className="font-bold text-slate-800 text-sm mb-1.5">{loc.nama}</div>
                                <div className="text-xs text-slate-500 leading-relaxed line-clamp-2 font-medium">{loc.deskripsi}</div>
                              </td>
                              <td className="p-4 sm:p-5 align-top">
                                <div className="flex flex-col gap-2 items-start">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] sm:text-[11px] font-bold shadow-sm"><Calendar size={12} className="text-blue-500"/> {loc.hari}</span>
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] sm:text-[11px] font-bold shadow-sm"><Clock size={12} className="text-teal-500"/> {loc.jam}</span>
                                </div>
                              </td>
                              <td className="p-4 sm:p-5 align-middle text-center">
                                <div className="inline-flex flex-col text-[9px] sm:text-[10px] font-mono text-slate-500 bg-slate-100 p-2 sm:p-2.5 rounded-xl gap-1">
                                  <span>{loc.lat}</span><span className="text-slate-300">|</span><span>{loc.lng}</span>
                                </div>
                              </td>
                              <td className="p-4 sm:p-5 align-middle">
                                <div className="flex items-center justify-center gap-1 sm:gap-2">
                                  <button onClick={() => handleOpenModal('edit', loc)} className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Edit"><Settings size={16} /></button>
                                  <button onClick={() => handleDelete(loc.id)} className="p-2 sm:p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Hapus"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="py-6 sm:py-8 text-center shrink-0">
              <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-slate-400 uppercase">© {new Date().getFullYear()} SIG Pusling <span className="mx-2 text-slate-300">•</span> Created by <span className="text-blue-500 ml-1">Musab Awwal</span></p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-slate-300/60 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white max-h-[95dvh] flex flex-col">
            <div className="flex justify-between items-center p-5 sm:p-8 border-b border-slate-100 shrink-0">
              <h3 className="font-black text-lg sm:text-xl text-slate-800 flex items-center gap-3">
                <div className="bg-blue-100 p-2 sm:p-2.5 rounded-2xl text-blue-500">{modalMode === 'add' ? <Plus size={18}/> : <Settings size={18}/>}</div>
                {modalMode === 'add' ? 'Tambah Data Baru' : 'Perbarui Lokasi'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 p-2 sm:p-2.5 rounded-full transition-all"><X size={20} /></button>
            </div>
            
            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 p-5 sm:p-8">
              <form onSubmit={handleSaveData} className="space-y-5 sm:space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lokasi / Tempat</label>
                  <input required type="text" name="nama" value={formData.nama} onChange={handleFormChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="Misal: Alun-Alun Cirimekar"/>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hari Operasional</label>
                  <select name="hari" value={formData.hari} onChange={handleFormChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer">
                    {HARI_OPERASIONAL.filter(h => h !== 'Semua Hari').map(hari => <option key={hari} value={hari}>{hari}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5"><Clock size={12} /> Jam Mulai</label>
                    <input required type="time" name="jamMulai" value={formData.jamMulai} onChange={handleFormChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5"><Clock size={12} /> Jam Selesai</label>
                    <input required type="time" name="jamSelesai" value={formData.jamSelesai} onChange={handleFormChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer"/>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center justify-between">Tentukan Titik Peta <span className="text-[9px] sm:text-[10px] text-teal-600 normal-case bg-teal-50 px-2.5 py-1 rounded-full">Geser pin di map</span></label>
                  <div className="w-full h-40 sm:h-52 rounded-[1.25rem] sm:rounded-[1.5rem] border-4 border-white overflow-hidden relative shadow-inner"><div id="modal-map-container" ref={modalMapRef} className="absolute inset-0"></div></div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Latitude</label>
                    <input required type="number" step="any" name="lat" value={formData.lat} onChange={handleFormChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3 sm:p-3.5 text-xs sm:text-sm font-mono outline-none focus:border-blue-400 transition-all shadow-sm"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Longitude</label>
                    <input required type="number" step="any" name="lng" value={formData.lng} onChange={handleFormChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3 sm:p-3.5 text-xs sm:text-sm font-mono outline-none focus:border-blue-400 transition-all shadow-sm"/>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Keterangan Tambahan</label>
                  <textarea required name="deskripsi" value={formData.deskripsi} onChange={handleFormChange} rows="3" className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm resize-none" placeholder="Target sasaran atau posisi parkir..."></textarea>
                </div>

                <div className="pt-5 sm:pt-6 mt-2 sm:mt-4 flex justify-end gap-3 sm:gap-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">Batal</button>
                  <button type="submit" disabled={isSaving} className="px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-2xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isSaving ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 px-5 sm:px-6 py-3 sm:py-4 w-[90%] max-w-sm sm:w-auto rounded-full shadow-2xl shadow-slate-300/50 z-[5000] flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in bg-white/95 backdrop-blur-2xl text-slate-700 border border-white">
          <Info size={20} className={`shrink-0 ${toastType === 'error' ? "text-rose-500" : "text-teal-500"}`} />
          <span className="text-xs sm:text-sm font-bold flex-1">{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 hover:bg-slate-100 p-1 sm:p-1.5 rounded-full transition-colors shrink-0"><X size={14} className="text-slate-400" /></button>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-slate-300/50 max-w-xs sm:max-w-sm w-full p-6 sm:p-8 animate-in zoom-in-95 fade-in duration-300 border border-white">
            <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-2 sm:mb-3">Konfirmasi Tindakan</h3>
            <p className="text-slate-500 text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed font-medium">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2 sm:gap-3">
              <button onClick={confirmDialog.onCancel} className="px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-all">Batal</button>
              <button onClick={confirmDialog.onConfirm} className="px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5">Ya, Lanjut</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
