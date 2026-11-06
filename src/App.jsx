/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Map, MapPin, Navigation, Calendar, Clock, Plus, Trash2, Library, Truck, Info, Settings, X, ChevronLeft, Menu, ArrowDown, CalendarCheck, MousePointerClick, LogIn, LogOut, Compass, Loader2, Lock, Mail, KeyRound, ShieldCheck, ExternalLink, BookOpen, Globe, Building2, MapPinned, Info as InfoIcon, Phone, MessageCircle, Send, Camera, PlayCircle, ThumbsUp, AtSign, Home, CalendarDays, Users, School, FileText, Inbox, ClipboardList, CheckCircle2, CircleCheck, CircleX, RefreshCw, ArrowRight, AlertCircle, Database, User, LocateFixed, Search, Link2 } from 'lucide-react';

import { createClient } from '@supabase/supabase-js';
import perpusnasLogo from './assets/logo-perpusnas.png';
import { KONTAK_LAYANAN } from './config';

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

// --- KALENDER & PERMOHONAN ---
const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const JENIS_PEMOHON = ['Sekolah', 'Masyarakat Umum', 'Instansi/Organisasi'];
const STATUS_PERMOHONAN = {
  menunggu: { label: 'Menunggu', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  disetujui: { label: 'Disetujui', badge: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
  ditolak: { label: 'Ditolak', badge: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};
const LOCAL_PERMOHONAN_KEY = 'pusling_permohonan_lokal';

const pad2 = (value) => String(value).padStart(2, '0');
const toDateKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const formatTanggalID = (value, options = {}) => {
  if (!value) return '-';
  const raw = value instanceof Date ? value : new Date(String(value).length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(raw.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', ...options }).format(raw);
};
const parseTimeMinutes = (value) => {
  const match = String(value || '').match(/(\d{1,2})[.:](\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
};
const getStatusMeta = (status) => STATUS_PERMOHONAN[status] || STATUS_PERMOHONAN.menunggu;
const getWhatsAppLink = (number) => {
  const digits = String(number || '').replace(/\D/g, '').replace(/^0/, '62');
  return digits ? `https://wa.me/${digits}` : '#';
};
const getPhoneLink = (number) => `tel:${String(number || '').replace(/[^\d+]/g, '')}`;
const getLocalPermohonan = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_PERMOHONAN_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const saveLocalPermohonan = (items) => {
  try { localStorage.setItem(LOCAL_PERMOHONAN_KEY, JSON.stringify(items)); } catch { /* abaikan */ }
};
const createEmptyPermohonan = () => ({
  jenis_pemohon: 'Sekolah',
  nama_pemohon: '',
  instansi: '',
  kontak: '',
  alamat_lokasi: '',
  tanggal_kunjungan: '',
  jam_kunjungan: '09:00',
  jumlah_peserta: '',
  keperluan: '',
  lat: '',
  lng: '',
  link_maps: '',
  setuju: false,
});

const toNullableCoord = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidCoord = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

// Membaca koordinat dari berbagai bentuk URL / teks Google Maps.
// Contoh yang didukung:
// - https://www.google.com/maps/@-6.49,106.83,15z
// - https://maps.google.com/?q=-6.49,106.83
// - https://www.google.com/maps/search/?api=1&query=-6.49,106.83
// - https://www.google.com/maps/place/...!3d-6.49!4d106.83
const parseGoogleMapsLink = (input) => {
  const text = String(input || '').trim();
  if (!text) return null;

  const pick = (rawLat, rawLng) => {
    const lat = Number.parseFloat(rawLat);
    const lng = Number.parseFloat(rawLng);
    return isValidCoord(lat, lng) ? { lat, lng } : null;
  };

  const pairRegex = /(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/;

  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    for (const key of ['q', 'query', 'll', 'destination', 'center', 'daddr', 'sll']) {
      const value = url.searchParams.get(key);
      if (!value) continue;
      const match = value.match(pairRegex);
      if (match) {
        const picked = pick(match[1], match[2]);
        if (picked) return picked;
      }
    }
    const atMatch = text.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
    if (atMatch) {
      const picked = pick(atMatch[1], atMatch[2]);
      if (picked) return picked;
    }
  } catch {
    // Bukan URL valid, lanjut ke pola teks.
  }

  const dataMatch = text.match(/!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/);
  if (dataMatch) {
    const picked = pick(dataMatch[1], dataMatch[2]);
    if (picked) return picked;
  }

  const plainMatch = text.match(pairRegex);
  if (plainMatch) {
    const picked = pick(plainMatch[1], plainMatch[2]);
    if (picked) return picked;
  }

  return null;
};

const toVisitLocation = (item) => {
  const lat = toNullableCoord(item.lat);
  const lng = toNullableCoord(item.lng);
  if (!isValidCoord(lat, lng)) return null;
  return {
    id: `kunjungan-${item.id}`,
    nama: item.instansi || item.nama_pemohon || 'Kunjungan Perpustakaan Keliling',
    lat,
    lng,
    deskripsi: item.alamat_lokasi || 'Kunjungan Perpustakaan Keliling',
    hari: item.tanggal_kunjungan ? NAMA_HARI[new Date(`${item.tanggal_kunjungan}T00:00:00`).getDay()] : '',
    jam: item.jam_kunjungan || '',
    isKunjungan: true,
    tanggal_kunjungan: item.tanggal_kunjungan,
    jumlah_peserta: item.jumlah_peserta,
    keperluan: item.keperluan,
  };
};

const AppLogo = ({ className = "w-10 h-10" }) => (
  <div className={`flex items-center justify-center rounded-2xl bg-white shadow-xl shadow-blue-500/20 border-2 border-white shrink-0 overflow-hidden transition-all duration-500 hover:scale-110 hover:-translate-y-1 ${className}`}>
    <img src={perpusnasLogo} alt="Logo Perpusnas" className="h-full w-full object-contain" />
  </div>
);

export default function App() {
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [currentPage, _setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('pusling_current_page');
    if (saved === 'home') return 'landing';
    return ['landing', 'map', 'admin', 'calendar', 'permohonan'].includes(saved) ? saved : 'landing';
  });
  const setCurrentPage = (page) => {
    localStorage.setItem('pusling_current_page', page);
    _setCurrentPage(page);
    setIsMobileMenuOpen(false);
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [selectedLokasi, setSelectedLokasi] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); 
  const [formData, setFormData] = useState({ id: '', nama: '', lat: '', lng: '', hari: 'Senin', jamMulai: '', jamSelesai: '', deskripsi: '' });
  const [isSaving, setIsSaving] = useState(false);

  // --- FITUR KALENDER & PERMOHONAN KUNJUNGAN ---
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date());
  const [permohonanTerjadwal, setPermohonanTerjadwal] = useState([]);
  const [permohonanAdmin, setPermohonanAdmin] = useState([]);
  const [isPermohonanLoading, setIsPermohonanLoading] = useState(false);
  const [permohonanDbReady, setPermohonanDbReady] = useState(true);
  const [permohonanForm, setPermohonanForm] = useState(createEmptyPermohonan());
  const [isSubmittingPermohonan, setIsSubmittingPermohonan] = useState(false);
  const [permohonanSuccess, setPermohonanSuccess] = useState(null);
  const [adminTab, setAdminTab] = useState('jadwal');
  const [permohonanFilter, setPermohonanFilter] = useState('semua');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const previewMarkerRef = useRef(null);
  const adminMapRef = useRef(null);
  const adminMapInstance = useRef(null);
  const adminMarkersRef = useRef([]);
  const modalMapRef = useRef(null);
  const modalMapInstance = useRef(null);
  const modalMarkerRef = useRef(null);
  const permohonanMapRef = useRef(null);
  const permohonanMapInstance = useRef(null);
  const permohonanMarkerRef = useRef(null);

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

  const refreshPublicAgenda = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('permohonan_terjadwal')
        .select('*')
        .order('tanggal_kunjungan', { ascending: true });
      if (!error) setPermohonanTerjadwal(data || []);
    } catch {
      // View belum dibuat / offline: kalender tetap menampilkan jadwal rutin.
    }
  };

  const refreshPermohonanAdmin = async () => {
    if (!isSupabaseConfigured) {
      setPermohonanAdmin(getLocalPermohonan());
      setPermohonanDbReady(true);
      return;
    }
    setIsPermohonanLoading(true);
    try {
      const { data, error } = await supabase
        .from('permohonan_kunjungan')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPermohonanAdmin(data || []);
      setPermohonanDbReady(true);
    } catch {
      setPermohonanAdmin(getLocalPermohonan());
      setPermohonanDbReady(false);
    } finally {
      setIsPermohonanLoading(false);
    }
  };

  useEffect(() => {
    refreshPublicAgenda();
  }, []);

  useEffect(() => {
    if (currentPage === 'map' || currentPage === 'calendar') refreshPublicAgenda();
  }, [currentPage]);

  useEffect(() => {
    if (session) refreshPermohonanAdmin();
  }, [session]);

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

  const clearRouteState = () => {
    setSelectedLokasi(null);
    if (routeLayerRef.current && mapInstance.current) { mapInstance.current.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
    if (previewMarkerRef.current && mapInstance.current) { mapInstance.current.removeLayer(previewMarkerRef.current); previewMarkerRef.current = null; }
    setRouteInfo(null);
  };

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
        html: `<div class="relative group"><div class="absolute -inset-2 bg-blue-400 rounded-full opacity-20 group-hover:opacity-40 animate-pulse"></div><div style="background: linear-gradient(135deg, #225faa, #159b47); color: white; border-radius: 50%; padding: 4px; width: 44px; height: 44px; display: flex; justify-content: center; align-items: center; box-shadow: 0 10px 15px -3px rgb(34 95 170 / 0.4); border: 3px solid white; position: relative;"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg></div></div>`,
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
      html: `<div style="background: linear-gradient(135deg, #159b47, #225faa); color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(21, 155, 71, 0.4); border: 2.5px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>`,
      iconSize: [34, 34], iconAnchor: [17, 17]
    });

    lokasiData.filter(loc => filterHari === 'Semua Hari' || loc.hari === filterHari).forEach(loc => {
      const marker = L.marker([loc.lat, loc.lng], { icon: destIcon }).addTo(mapInstance.current).on('click', (e) => {
        if(e.originalEvent) e.originalEvent.stopPropagation(); if (window.innerWidth < 1024) setIsSidebarOpen(false); handleMarkerClick(loc);
      });
      markersRef.current.push(marker);
    });

    const visitIcon = L.divIcon({
      className: 'custom-icon transition-transform hover:scale-110',
      html: `<div style="background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; border-radius: 50% 50% 50% 0; width: 32px; height: 32px; transform: rotate(-45deg); display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4); border: 2.5px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/></svg></div>`,
      iconSize: [32, 32], iconAnchor: [16, 32]
    });

    permohonanTerjadwal.forEach((item) => {
      const visit = toVisitLocation(item);
      if (!visit) return;
      const marker = L.marker([visit.lat, visit.lng], { icon: visitIcon, zIndexOffset: 200 }).addTo(mapInstance.current)
        .bindTooltip(`<div class="text-xs font-bold text-slate-700">${visit.nama}</div><div class="text-[10px] text-slate-500">Kunjungan ${formatTanggalID(visit.tanggal_kunjungan, { weekday: undefined })}</div>`, { direction: 'top', className: 'border-0 shadow-lg' })
        .on('click', (e) => {
          if (e.originalEvent) e.originalEvent.stopPropagation();
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
          handleMarkerClick(visit);
        });
      markersRef.current.push(marker);
    });
  }, [isLeafletLoaded, currentPage, lokasiData, filterHari, permohonanTerjadwal]);

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

  const approvedVisits = permohonanTerjadwal.map(toVisitLocation).filter(Boolean);

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
      html: `<div style="background: linear-gradient(135deg, #159b47, #225faa); color: white; border-radius: 50%; padding: 6px; width: 34px; height: 34px; display: flex; justify-content: center; align-items: center; box-shadow: 0 6px 12px rgba(21, 155, 71, 0.3); border: 2.5px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>`,
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
            html: `<div style="background: #159b47; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: 2.5px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>`,
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

  // --- PETA PEMILIH TITIK UNTUK PERMOHONAN KUNJUNGAN ---
  const syncPermohonanMarker = (lat, lng) => {
    const L = window.L;
    if (!L || !permohonanMapInstance.current) return;
    if (permohonanMarkerRef.current) {
      permohonanMarkerRef.current.setLatLng([lat, lng]);
      return;
    }
    const pinIcon = L.divIcon({
      className: 'custom-icon cursor-move',
      html: `<div style="background: linear-gradient(135deg, #159b47, #225faa); color: white; border-radius: 50% 50% 50% 0; width: 30px; height: 30px; transform: rotate(-45deg); display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(21, 155, 71, 0.35); border: 2.5px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
      iconSize: [30, 30], iconAnchor: [15, 30]
    });
    permohonanMarkerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(permohonanMapInstance.current);
    permohonanMarkerRef.current.on('dragend', (event) => {
      const point = event.target.getLatLng();
      setPermohonanForm((prev) => ({ ...prev, lat: point.lat.toFixed(6), lng: point.lng.toFixed(6) }));
    });
  };

  useEffect(() => {
    if (currentPage !== 'permohonan' || !isLeafletLoaded || !permohonanMapRef.current) return;
    const L = window.L;
    const initialLat = parseFloat(permohonanForm.lat);
    const initialLng = parseFloat(permohonanForm.lng);
    const hasCoords = isValidCoord(initialLat, initialLng);
    const center = hasCoords ? [initialLat, initialLng] : [PERPUSDA_BASE.lat, PERPUSDA_BASE.lng];

    if (!permohonanMapInstance.current) {
      permohonanMapInstance.current = L.map(permohonanMapRef.current, { scrollWheelZoom: false }).setView(center, hasCoords ? 15 : 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(permohonanMapInstance.current);
      const applyPoint = (lat, lng) => {
        setPermohonanForm((prev) => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
        if (permohonanMapInstance.current) permohonanMapInstance.current.panTo([lat, lng]);
      };
      if (hasCoords) syncPermohonanMarker(initialLat, initialLng);
      permohonanMapInstance.current.on('click', (event) => {
        const point = event.latlng;
        syncPermohonanMarker(point.lat, point.lng);
        applyPoint(point.lat, point.lng);
      });
    }

    setTimeout(() => { if (permohonanMapInstance.current) permohonanMapInstance.current.invalidateSize(); }, 300);
  }, [currentPage, isLeafletLoaded, permohonanSuccess]);

  useEffect(() => {
    const lat = parseFloat(permohonanForm.lat);
    const lng = parseFloat(permohonanForm.lng);
    if (!isValidCoord(lat, lng)) return;
    syncPermohonanMarker(lat, lng);
  }, [permohonanForm.lat, permohonanForm.lng]);

  // Hancurkan instance peta saat formulir diganti halaman sukses,
  // supaya peta bisa dibuat ulang ketika pengguna membuka formulir lagi.
  useEffect(() => {
    if (!permohonanSuccess || !permohonanMapInstance.current) return;
    permohonanMapInstance.current.remove();
    permohonanMapInstance.current = null;
    permohonanMarkerRef.current = null;
  }, [permohonanSuccess]);

  const drawRoute = async (start, end) => {
    setIsLoadingRoute(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url); const data = await res.json();
      const L = window.L;
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]; setRouteInfo({ distance: (route.distance / 1000).toFixed(2), duration: Math.ceil(route.duration / 60) });
        routeLayerRef.current = L.geoJSON(route.geometry, { style: { color: '#225faa', weight: 6, opacity: 0.85, lineCap: 'round', lineJoin: 'round' } }).addTo(mapInstance.current);
        mapInstance.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50], animate: true, duration: 1.5 });
      }
    } catch (error) {
      const L = window.L; routeLayerRef.current = L.polyline([[start.lat, start.lng], [end.lat, end.lng]], { color: '#225faa', dashArray: '8, 12', weight: 4 }).addTo(mapInstance.current);
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

  const goToKontak = () => {
    setCurrentPage('landing');
    setTimeout(() => document.getElementById('kontak-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  };

  const openLocationOnMap = (loc) => {
    setSelectedLokasi(loc);
    setCurrentPage('map');
    setTimeout(() => {
      if (!mapInstance.current) return;
      handleMarkerClick(loc);
      // Kunjungan pratinjau (mis. masih menunggu) belum punya marker publik,
      // jadi tambahkan pin sementara agar titik lokasinya terlihat jelas.
      if (loc.isKunjungan && !approvedVisits.some((visit) => visit.id === loc.id)) {
        if (previewMarkerRef.current) mapInstance.current.removeLayer(previewMarkerRef.current);
        const L = window.L;
        const icon = L.divIcon({
          className: 'custom-icon',
          html: `<div style="background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; border-radius: 50% 50% 50% 0; width: 32px; height: 32px; transform: rotate(-45deg); display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4); border: 2.5px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
          iconSize: [32, 32], iconAnchor: [16, 32]
        });
        previewMarkerRef.current = L.marker([loc.lat, loc.lng], { icon, zIndexOffset: 300 }).addTo(mapInstance.current);
      }
    }, 700);
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateKey = toDateKey(date);
    const dayName = NAMA_HARI[date.getDay()];
    const jadwalRutin = lokasiData
      .filter((loc) => loc.hari === dayName)
      .map((loc) => ({
        key: `lokasi-${loc.id}`,
        type: 'pusling',
        title: loc.nama,
        time: loc.jam || '-',
        description: loc.deskripsi || '',
        loc,
      }));
    const kunjungan = permohonanTerjadwal
      .filter((item) => item.tanggal_kunjungan === dateKey)
      .map((item) => ({
        key: `permohonan-${item.id}`,
        type: 'kunjungan',
        title: item.instansi || item.nama_pemohon,
        time: item.jam_kunjungan || '-',
        description: item.keperluan || 'Kunjungan Perpustakaan Keliling',
        alamat: item.alamat_lokasi,
        peserta: item.jumlah_peserta,
        loc: toVisitLocation(item) || undefined,
      }));
    return [...jadwalRutin, ...kunjungan].sort((a, b) => parseTimeMinutes(a.time) - parseTimeMinutes(b.time));
  };

  const handleAjukanDariKalender = (event) => {
    setPermohonanForm({
      ...createEmptyPermohonan(),
      alamat_lokasi: event.loc ? event.loc.nama : (event.alamat || ''),
      tanggal_kunjungan: toDateKey(selectedCalendarDate),
      keperluan: event.type === 'pusling' ? `Permohonan kunjungan Perpustakaan Keliling di ${event.title}` : '',
    });
    setPermohonanSuccess(null);
    setCurrentPage('permohonan');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handlePermohonanChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPermohonanForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const setPermohonanPoint = (lat, lng, zoom = 16) => {
    setPermohonanForm((prev) => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
    if (permohonanMapInstance.current) permohonanMapInstance.current.setView([lat, lng], zoom);
  };

  const useMyLocationForPermohonan = () => {
    if (!navigator.geolocation) { showToast('Geolokasi tidak didukung browser.', 'error'); return; }
    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermohonanPoint(pos.coords.latitude, pos.coords.longitude);
        showToast('Titik lokasi Anda diterapkan.', 'success');
        setIsGeocoding(false);
      },
      () => { showToast('Gagal mengambil lokasi. Tandai manual di peta.', 'error'); setIsGeocoding(false); },
      { enableHighAccuracy: true }
    );
  };

  const geocodePermohonanAddress = async () => {
    const query = permohonanForm.alamat_lokasi.trim();
    if (!query) { showToast('Isi alamat/lokasi terlebih dahulu.', 'error'); return; }
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&q=${encodeURIComponent(query)}`);
      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) throw new Error('not found');
      const found = results[0];
      setPermohonanPoint(Number.parseFloat(found.lat), Number.parseFloat(found.lon));
      showToast('Alamat ditemukan dan titik peta diperbarui.', 'success');
    } catch {
      showToast('Alamat tidak ditemukan. Coba tandai manual di peta.', 'error');
    } finally {
      setIsGeocoding(false);
    }
  };

  const applyPermohonanMapsLink = () => {
    const parsed = parseGoogleMapsLink(permohonanForm.link_maps);
    if (!parsed) {
      showToast('Koordinat tidak ditemukan pada link. Pastikan link Google Maps lengkap.', 'error');
      return;
    }
    setPermohonanPoint(parsed.lat, parsed.lng);
    showToast(`Koordinat diterapkan: ${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}`, 'success');
  };

  const handleSubmitPermohonan = async (e) => {
    e.preventDefault();
    if (!permohonanForm.setuju) { showToast('Centang pernyataan persetujuan terlebih dahulu.', 'error'); return; }
    setIsSubmittingPermohonan(true);
    const payload = {
      jenis_pemohon: permohonanForm.jenis_pemohon,
      nama_pemohon: permohonanForm.nama_pemohon.trim(),
      instansi: permohonanForm.instansi.trim() || null,
      kontak: permohonanForm.kontak.trim(),
      alamat_lokasi: permohonanForm.alamat_lokasi.trim(),
      tanggal_kunjungan: permohonanForm.tanggal_kunjungan,
      jam_kunjungan: permohonanForm.jam_kunjungan,
      jumlah_peserta: Number.parseInt(permohonanForm.jumlah_peserta, 10) || 1,
      keperluan: permohonanForm.keperluan.trim() || null,
      lat: toNullableCoord(permohonanForm.lat),
      lng: toNullableCoord(permohonanForm.lng),
      status: 'menunggu',
    };
    const localRecord = {
      ...payload,
      id: `lokal-${Date.now()}`,
      created_at: new Date().toISOString(),
      local: true,
    };
    let saved = localRecord;
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('permohonan_kunjungan').insert([payload]);
        if (error) throw error;
        saved = { ...payload, id: `remote-${Date.now()}`, created_at: new Date().toISOString(), local: false };
        showToast('Permohonan kunjungan berhasil dikirim.', 'success');
      } catch {
        saveLocalPermohonan([localRecord, ...getLocalPermohonan()]);
        showToast('Permohonan tersimpan lokal. Tabel database belum siap.', 'error');
      }
    } else {
      saveLocalPermohonan([localRecord, ...getLocalPermohonan()]);
    }
    setPermohonanSuccess(saved);
    setPermohonanForm(createEmptyPermohonan());
    setIsSubmittingPermohonan(false);
    if (session) refreshPermohonanAdmin();
  };

  const handleUpdatePermohonanStatus = (item, status) => {
    const label = status === 'disetujui' ? 'menyetujui' : status === 'ditolak' ? 'menolak' : 'mengubah';
    setConfirmDialog({
      message: `Yakin ${label} permohonan dari "${item.instansi || item.nama_pemohon}"?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        if (item.local || !isSupabaseConfigured) {
          const updated = getLocalPermohonan().map((row) => row.id === item.id ? { ...row, status } : row);
          saveLocalPermohonan(updated);
          setPermohonanAdmin((prev) => prev.map((row) => row.id === item.id ? { ...row, status } : row));
          showToast(`Permohonan ditandai ${status}.`, 'success');
          return;
        }
        try {
          const { error } = await supabase.from('permohonan_kunjungan').update({ status }).eq('id', item.id);
          if (error) throw error;
          setPermohonanAdmin((prev) => prev.map((row) => row.id === item.id ? { ...row, status } : row));
          showToast(`Permohonan ${status}.`, 'success');
          refreshPublicAgenda();
        } catch (error) {
          showToast(`Gagal update permohonan: ${error.message}`, 'error');
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const permohonanCounts = permohonanAdmin.reduce((acc, item) => {
    acc.total += 1;
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, { total: 0, menunggu: 0, disetujui: 0, ditolak: 0 });
  const filteredPermohonan = permohonanAdmin.filter((item) => permohonanFilter === 'semua' || item.status === permohonanFilter);

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const calendarStartOffset = (new Date(calendarYear, calendarMonthIndex, 1).getDay() + 6) % 7;
  const calendarDaysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const calendarCells = [
    ...Array(calendarStartOffset).fill(null),
    ...Array.from({ length: calendarDaysInMonth }, (_, index) => new Date(calendarYear, calendarMonthIndex, index + 1)),
  ];
  const selectedDateKey = toDateKey(selectedCalendarDate);
  const todayKey = toDateKey(new Date());
  const selectedDateEvents = getEventsForDate(selectedCalendarDate);

  if (!isLeafletLoaded && (currentPage === 'map' || currentPage === 'admin')) return <div className="flex h-[100dvh] items-center justify-center bg-slate-50 text-blue-500 font-semibold tracking-wide">Memuat Sistem Spasial...</div>;

  return (
    <div className="h-[100dvh] w-full font-sans bg-slate-50 flex flex-col overflow-hidden relative selection:bg-blue-300 selection:text-blue-900 scroll-smooth">
      
      {!isSupabaseConfigured && currentPage === 'admin' && session && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-center text-xs py-2 font-bold z-[6000] w-full absolute top-0 shadow-lg tracking-wide uppercase backdrop-blur-md">
           🚧 Aplikasi Berjalan dalam Mode Simulasi. Masukkan Kredensial Supabase.
        </div>
      )}

      {/* NAVBAR */}
      {(currentPage === 'landing' || currentPage === 'map' || currentPage === 'calendar' || currentPage === 'permohonan') && (
        <nav className="absolute top-0 left-0 right-0 z-[100] px-3 sm:px-6 py-3 sm:py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 bg-white/60 backdrop-blur-2xl border border-white/70 rounded-[1.5rem] sm:rounded-full px-3 sm:px-6 py-2 sm:py-2.5 shadow-lg shadow-slate-200/40">
            <button onClick={() => setCurrentPage('landing')} className="flex items-center gap-2.5 min-w-0">
              <AppLogo className="w-9 h-9" />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-black text-slate-800 leading-tight">SIG Pusling</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Kab. Bogor</p>
              </div>
            </button>
            <div className="hidden sm:flex items-center gap-1 sm:gap-2">
              <button onClick={() => setCurrentPage('landing')} title="Beranda" className={`px-2.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${currentPage === 'landing' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-white/80'}`}><Home size={15}/> <span className="hidden sm:inline">Beranda</span></button>
              <button onClick={() => setCurrentPage('map')} title="Peta Pusling" className={`px-2.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${currentPage === 'map' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-white/80'}`}><Map size={15}/> <span className="hidden sm:inline">Peta</span></button>
              <button onClick={() => setCurrentPage('calendar')} title="Kalender Aktivitas" className={`px-2.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${currentPage === 'calendar' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-white/80'}`}><CalendarDays size={15}/> <span className="hidden sm:inline">Kalender</span></button>
              <button onClick={() => setCurrentPage('permohonan')} title="Permohonan Kunjungan" className={`px-2.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${currentPage === 'permohonan' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-white/80'}`}><Send size={15}/> <span className="hidden sm:inline">Permohonan</span></button>
              <button onClick={goToKontak} title="Kontak Layanan" className="px-2.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-600 hover:bg-white/80 flex items-center gap-1.5"><Phone size={15}/> <span className="hidden sm:inline">Kontak</span></button>
              <button onClick={() => setCurrentPage('admin')} title={session ? 'Dashboard' : 'Login'} className="px-2.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-600 hover:bg-white/80 flex items-center gap-1.5"><LogIn size={15}/> <span className="hidden sm:inline">{session ? 'Dashboard' : 'Login'}</span></button>
            </div>
            <button onClick={() => setIsMobileMenuOpen((open) => !open)} className="sm:hidden bg-white/70 border border-white text-slate-700 p-2.5 rounded-xl shadow-sm active:scale-95 transition-all" title="Menu" aria-label="Buka menu navigasi">
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="sm:hidden max-w-7xl mx-auto mt-2 bg-white/95 backdrop-blur-2xl border border-white rounded-[1.5rem] p-2 shadow-2xl shadow-slate-300/40">
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => setCurrentPage('landing')} className={`flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-bold transition-all ${currentPage === 'landing' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 bg-slate-50/70 hover:bg-white'}`}><Home size={16}/> Beranda</button>
                <button onClick={() => setCurrentPage('map')} className={`flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-bold transition-all ${currentPage === 'map' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 bg-slate-50/70 hover:bg-white'}`}><Map size={16}/> Peta Pusling</button>
                <button onClick={() => setCurrentPage('calendar')} className={`flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-bold transition-all ${currentPage === 'calendar' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 bg-slate-50/70 hover:bg-white'}`}><CalendarDays size={16}/> Kalender</button>
                <button onClick={() => setCurrentPage('permohonan')} className={`flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-bold transition-all ${currentPage === 'permohonan' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 bg-slate-50/70 hover:bg-white'}`}><Send size={16}/> Permohonan</button>
                <button onClick={goToKontak} className="flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-50/70 hover:bg-white transition-all"><Phone size={16}/> Kontak Layanan</button>
                <button onClick={() => setCurrentPage('admin')} className="flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-50/70 hover:bg-white transition-all"><LogIn size={16}/> {session ? 'Dashboard' : 'Login Admin'}</button>
              </div>
            </div>
          )}
        </nav>
      )}

      {/* ========================================= */}
      {/* 1. LANDING PAGE                          */}
      {/* ========================================= */}
      <div className={`flex-1 min-h-0 flex-col overflow-y-auto scroll-smooth ${currentPage === 'landing' ? 'flex' : 'hidden'}`}>
        <section className="shrink-0 min-h-[100dvh] relative flex flex-col items-center justify-center p-6 overflow-hidden bg-slate-50">
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

        <section id="kontak-section" className="py-20 px-6 bg-white scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-widest mb-5">
                <Phone size={14} /> Layanan & Kontak
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 mb-4">Hubungi Layanan Perpustakaan</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">Butuh informasi jadwal, ingin berkolaborasi, atau mengajukan kunjungan Perpustakaan Keliling? Hubungi kami melalui kanal berikut.</p>
            </div>

            <div className="grid lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-8">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 p-7 sm:p-10 text-white shadow-2xl shadow-blue-500/25">
                <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-teal-300/20 blur-3xl"></div>
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 border border-white/30">
                    <Library size={28} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black mb-3">Perpusda Kabupaten Bogor</h3>
                  <p className="text-blue-50/90 text-sm sm:text-base leading-relaxed mb-8">{KONTAK_LAYANAN.alamat}</p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-white/15 p-2.5 rounded-xl border border-white/20 shrink-0"><Clock size={18} /></div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-blue-100/80">Jam Layanan</p>
                        <p className="text-sm font-bold">{KONTAK_LAYANAN.jamLayanan}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-white/15 p-2.5 rounded-xl border border-white/20 shrink-0"><User size={18} /></div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-blue-100/80">PIC Layanan</p>
                        <p className="text-sm font-bold">{KONTAK_LAYANAN.pic}</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setCurrentPage('permohonan')} className="mt-8 w-full sm:w-auto bg-white text-blue-700 px-6 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all">
                    <Send size={17} /> Ajukan Permohonan Kunjungan <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <a href={getWhatsAppLink(KONTAK_LAYANAN.whatsapp)} target="_blank" rel="noopener noreferrer" className="group bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-[1.75rem] p-5 sm:p-6 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-teal-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-teal-500/25 group-hover:scale-110 transition-transform"><MessageCircle size={20} /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-teal-700/70 mb-1">WhatsApp</p>
                  <p className="text-sm font-black text-slate-800 break-words">{KONTAK_LAYANAN.whatsapp}</p>
                </a>
                <a href={getPhoneLink(KONTAK_LAYANAN.telepon)} className="group bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-[1.75rem] p-5 sm:p-6 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-blue-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform"><Phone size={20} /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-700/70 mb-1">Telepon</p>
                  <p className="text-sm font-black text-slate-800 break-words">{KONTAK_LAYANAN.telepon}</p>
                </a>
                <a href={`mailto:${KONTAK_LAYANAN.email}`} className="group bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-[1.75rem] p-5 sm:p-6 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform"><Mail size={20} /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/70 mb-1">Email</p>
                  <p className="text-xs sm:text-sm font-black text-slate-800 break-all">{KONTAK_LAYANAN.email}</p>
                </a>
                <a href={`https://instagram.com/${String(KONTAK_LAYANAN.instagram).replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="group bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-[1.75rem] p-5 sm:p-6 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-rose-500/25 group-hover:scale-110 transition-transform"><Camera size={20} /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-700/70 mb-1">Instagram</p>
                  <p className="text-sm font-black text-slate-800 break-words">{KONTAK_LAYANAN.instagram}</p>
                </a>
                <a href={`https://facebook.com/${encodeURIComponent(KONTAK_LAYANAN.facebook)}`} target="_blank" rel="noopener noreferrer" className="group bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-[1.75rem] p-5 sm:p-6 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-sky-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-sky-500/25 group-hover:scale-110 transition-transform"><ThumbsUp size={20} /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-700/70 mb-1">Facebook</p>
                  <p className="text-sm font-black text-slate-800 break-words">{KONTAK_LAYANAN.facebook}</p>
                </a>
                <a href={`https://youtube.com/${String(KONTAK_LAYANAN.youtube).startsWith('@') ? KONTAK_LAYANAN.youtube : `@${KONTAK_LAYANAN.youtube}`}`} target="_blank" rel="noopener noreferrer" className="group bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-[1.75rem] p-5 sm:p-6 hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-red-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-red-500/25 group-hover:scale-110 transition-transform"><PlayCircle size={20} /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-700/70 mb-1">YouTube</p>
                  <p className="text-sm font-black text-slate-800 break-words">{KONTAK_LAYANAN.youtube}</p>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 mb-6">Siap Menemukan Armada Pusling?</h2>
            <p className="text-slate-500 text-lg mb-10">Cek jadwal dan lokasi Perpustakaan Keliling terdekat dari posisi Anda sekarang</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => setCurrentPage('map')} className="group bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-full text-base sm:text-lg font-bold flex items-center gap-3 shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:-translate-y-1 transition-all duration-300">
                <MapPinned size={22}/> Buka Peta Interaktif <ChevronLeft size={18} className="rotate-180 group-hover:translate-x-1 transition-transform"/>
              </button>
              <button onClick={() => setCurrentPage('calendar')} className="group bg-white text-slate-700 px-8 py-4 rounded-full text-base sm:text-lg font-bold border border-white flex items-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <CalendarDays size={20}/> Lihat Kalender <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
              </button>
            </div>
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

            {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[110] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

            <aside className={`fixed top-0 bottom-0 left-0 z-[120] lg:absolute lg:z-[50] lg:bottom-4 lg:left-4 flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%] lg:-translate-x-[120%]'} w-[85vw] sm:w-[380px]`}>
              <div className="bg-white/40 backdrop-blur-2xl lg:rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border-r lg:border border-white/60 h-full flex flex-col overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500/90 to-teal-400/90 backdrop-blur-xl p-4 sm:p-6 lg:rounded-t-[2rem] shrink-0 relative overflow-hidden border-b border-white/20 pt-[max(1rem,env(safe-area-inset-top))] lg:pt-6">
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

                <div className="flex-1 overflow-y-auto p-4 pb-6 scrollbar-thin scrollbar-thumb-white/50">
                  <div className="px-1 mb-4 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daftar Titik Lokasi</h3>
                    <span className="bg-blue-500/10 text-blue-700 border border-blue-200/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">{sortedLokasiData.length + 1 + approvedVisits.length} Titik</span>
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

                    {approvedVisits.length > 0 && (
                      <div className="pt-2">
                        <div className="px-1 mt-3 mb-3 flex justify-between items-center">
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kunjungan Disetujui</h3>
                          <span className="bg-amber-500/15 text-amber-700 border border-amber-300/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">{approvedVisits.length} Kunjungan</span>
                        </div>
                        <div className="space-y-3">
                          {approvedVisits.map((visit) => (
                            <div key={visit.id} onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); handleMarkerClick(visit); }} className={`relative p-4 rounded-[1.25rem] border-2 cursor-pointer transition-all duration-500 group overflow-hidden ${selectedLokasi?.id === visit.id ? 'border-amber-400 bg-amber-50/90 backdrop-blur-md shadow-md shadow-amber-500/10' : 'border-white/50 bg-white/30 backdrop-blur-md shadow-sm hover:bg-white/70 hover:shadow-lg'}`}>
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="bg-gradient-to-br from-amber-400 to-rose-400 p-2 rounded-xl text-white shadow-sm shrink-0"><CalendarDays size={15} /></div>
                                <h4 className="font-bold text-sm text-slate-800 group-hover:text-amber-700 transition-colors leading-snug">{visit.nama}</h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="flex items-center gap-1.5 bg-white/60 border border-white/70 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold group-hover:bg-white"><CalendarDays size={12} className="text-amber-500"/> {formatTanggalID(visit.tanggal_kunjungan, { weekday: undefined })}</span>
                                <span className="flex items-center gap-1.5 bg-white/60 border border-white/70 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold group-hover:bg-white"><Clock size={12} className="text-rose-500"/> {visit.jam}</span>
                                <span className="flex items-center gap-1.5 bg-white/60 border border-white/70 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold group-hover:bg-white"><Users size={12} className="text-blue-500"/> {visit.jumlah_peserta} peserta</span>
                              </div>
                              <p className="text-[11px] font-medium text-slate-500 mt-2.5 line-clamp-2">{visit.deskripsi}</p>
                            </div>
                          ))}
                        </div>
                      </div>
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

                {selectedLokasi.isKunjungan && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl px-3 py-2.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1"><CalendarDays size={11} /> Tanggal</span>
                      <p className="text-[11px] font-bold text-slate-700 mt-0.5">{formatTanggalID(selectedLokasi.tanggal_kunjungan, { weekday: undefined })}</p>
                    </div>
                    <div className="bg-rose-50/80 border border-rose-200/70 rounded-xl px-3 py-2.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-1"><Clock size={11} /> Jam</span>
                      <p className="text-[11px] font-bold text-slate-700 mt-0.5">{selectedLokasi.jam || '-'} WIB</p>
                    </div>
                    <div className="bg-blue-50/80 border border-blue-200/70 rounded-xl px-3 py-2.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1"><Users size={11} /> Peserta</span>
                      <p className="text-[11px] font-bold text-slate-700 mt-0.5">{selectedLokasi.jumlah_peserta} orang</p>
                    </div>
                  </div>
                )}
                
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
      {/* 3. CALENDAR PAGE                         */}
      {/* ========================================= */}
      <div className={`flex-1 min-h-0 flex-col overflow-y-auto ${currentPage === 'calendar' ? 'flex' : 'hidden'}`}>
        <section className="shrink-0 min-h-[100dvh] bg-slate-50 pt-24 sm:pt-28 pb-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-4">
                  <CalendarDays size={14} /> Kalender Aktivitas
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-3">Jadwal Perpustakaan Keliling</h1>
                <p className="text-slate-500 text-sm sm:text-base max-w-2xl font-medium">Kalender otomatis mengikuti jadwal rutin dan permohonan kunjungan yang sudah disetujui admin, sehingga informasi selalu terbaru.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 bg-white/80 border border-white px-4 py-2.5 rounded-full text-[11px] font-bold text-slate-600 shadow-sm">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span></span>
                  {isSupabaseConfigured ? 'Data live dari database' : 'Mode simulasi'}
                </span>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.55fr_1fr] gap-5 sm:gap-8 items-start">
              <div className="bg-white/85 backdrop-blur-xl rounded-[1.75rem] sm:rounded-[2.25rem] border border-white shadow-xl shadow-slate-200/50 p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <button onClick={() => { const next = new Date(calendarYear, calendarMonthIndex - 1, 1); setCalendarMonth(next); setSelectedCalendarDate(next); }} className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Bulan sebelumnya"><ChevronLeft size={18} /></button>
                  <div className="text-center">
                    <h2 className="text-lg sm:text-2xl font-black text-slate-800">{NAMA_BULAN[calendarMonthIndex]} {calendarYear}</h2>
                    <button onClick={() => { const now = new Date(); setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedCalendarDate(now); }} className="text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">Kembali ke hari ini</button>
                  </div>
                  <button onClick={() => { const next = new Date(calendarYear, calendarMonthIndex + 1, 1); setCalendarMonth(next); setSelectedCalendarDate(next); }} className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Bulan berikutnya"><ChevronLeft size={18} className="rotate-180" /></button>
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                  {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((hari) => (
                    <div key={hari} className="text-center text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 py-1.5">{hari}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {calendarCells.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} className="min-h-[58px] sm:min-h-[106px] rounded-xl sm:rounded-2xl bg-slate-50/40"></div>;
                    const dateKey = toDateKey(date);
                    const events = getEventsForDate(date);
                    const isToday = dateKey === todayKey;
                    const isSelected = dateKey === selectedDateKey;
                    return (
                      <button
                        key={dateKey}
                        onClick={() => setSelectedCalendarDate(date)}
                        className={`min-h-[58px] sm:min-h-[106px] rounded-xl sm:rounded-2xl border-2 p-1.5 sm:p-2 text-left transition-all duration-300 ${isSelected ? 'border-blue-400 bg-blue-50/80 shadow-md shadow-blue-500/10' : 'border-transparent hover:border-blue-200 hover:bg-slate-50'} ${isToday && !isSelected ? 'bg-teal-50/60 border-teal-100' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-xs font-black ${isToday ? 'bg-teal-500 text-white shadow-sm' : isSelected ? 'bg-blue-500 text-white' : 'text-slate-700'}`}>{date.getDate()}</span>
                          {events.length > 0 && <span className="text-[8px] sm:text-[9px] font-black text-blue-600 bg-blue-100/80 rounded-full px-1.5 py-0.5">{events.length}</span>}
                        </div>
                        <div className="hidden sm:block mt-1.5 space-y-1">
                          {events.slice(0, 2).map((event) => (
                            <div key={event.key} className={`truncate text-[9px] font-bold px-1.5 py-0.5 rounded-md ${event.type === 'pusling' ? 'bg-blue-100/80 text-blue-700' : 'bg-teal-100/80 text-teal-700'}`}>
                              {event.time.split(' - ')[0]} · {event.title}
                            </div>
                          ))}
                          {events.length > 2 && <p className="text-[9px] font-bold text-slate-400 pl-1.5">+{events.length - 2} kegiatan</p>}
                        </div>
                        <div className="flex sm:hidden justify-center gap-0.5 mt-1.5">
                          {events.slice(0, 3).map((event) => <span key={event.key} className={`w-1.5 h-1.5 rounded-full ${event.type === 'pusling' ? 'bg-blue-500' : 'bg-teal-500'}`}></span>)}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-5 pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Jadwal rutin pusling</span>
                  <span className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Kunjungan disetujui</span>
                  <span className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> Tanpa kegiatan</span>
                </div>
              </div>

              <div className="bg-white/85 backdrop-blur-xl rounded-[1.75rem] sm:rounded-[2.25rem] border border-white shadow-xl shadow-slate-200/50 p-5 sm:p-6 lg:sticky lg:top-28">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Agenda</p>
                    <h3 className="text-lg sm:text-xl font-black text-slate-800">{formatTanggalID(selectedCalendarDate)}</h3>
                    {selectedDateKey === todayKey && <span className="inline-flex mt-2 text-[9px] font-black uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">Hari ini</span>}
                  </div>
                  <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl p-3 text-center min-w-[64px]">
                    <p className="text-2xl font-black leading-none">{selectedDateEvents.length}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest mt-1">Kegiatan</p>
                  </div>
                </div>

                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-10 px-4 bg-slate-50/70 rounded-[1.5rem] border border-dashed border-slate-200">
                    <Calendar size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-600 mb-1">Belum ada kegiatan</p>
                    <p className="text-xs text-slate-400">Pilih tanggal lain atau ajukan kunjungan ke lokasi Anda.</p>
                    <button onClick={() => { setPermohonanForm({ ...createEmptyPermohonan(), tanggal_kunjungan: selectedDateKey }); setPermohonanSuccess(null); setCurrentPage('permohonan'); }} className="mt-4 text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5">Ajukan kunjungan <ArrowRight size={14} /></button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <div key={event.key} className={`rounded-[1.25rem] border p-4 ${event.type === 'pusling' ? 'bg-blue-50/60 border-blue-100' : 'bg-teal-50/60 border-teal-100'}`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${event.type === 'pusling' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>{event.type === 'pusling' ? 'Jadwal Pusling' : 'Kunjungan Disetujui'}</span>
                          <span className="text-[10px] font-black text-slate-600 bg-white/80 px-2 py-1 rounded-lg flex items-center gap-1"><Clock size={11} /> {event.time}</span>
                        </div>
                        <h4 className="font-black text-slate-800 text-sm mb-1">{event.title}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">{event.description}</p>
                        {event.alamat && <p className="text-[11px] font-semibold text-slate-500 flex items-start gap-1.5 mb-1"><MapPin size={12} className="mt-0.5 shrink-0" /> {event.alamat}</p>}
                        {event.peserta && <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5"><Users size={12} /> {event.peserta} peserta</p>}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {event.loc && <button onClick={() => openLocationOnMap(event.loc)} className="text-[10px] font-bold text-blue-700 bg-white border border-blue-200 px-3 py-2 rounded-xl hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all flex items-center gap-1.5"><MapPin size={12} /> Buka di Peta</button>}
                          <button onClick={() => handleAjukanDariKalender(event)} className="text-[10px] font-bold text-slate-600 bg-white/70 border border-slate-200 px-3 py-2 rounded-xl hover:bg-white hover:text-teal-700 hover:border-teal-200 transition-all flex items-center gap-1.5"><Send size={12} /> Ajukan Kunjungan</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ========================================= */}
      {/* 4. PERMOHONAN KUNJUNGAN PAGE             */}
      {/* ========================================= */}
      <div className={`flex-1 min-h-0 flex-col overflow-y-auto ${currentPage === 'permohonan' ? 'flex' : 'hidden'}`}>
        <section className="shrink-0 min-h-[100dvh] bg-slate-50 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[45vw] h-[45vw] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] bg-teal-100/50 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-4">
                <Send size={14} /> Permohonan Kunjungan
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-3">Ajukan Kunjungan Perpustakaan Keliling</h1>
              <p className="text-slate-500 text-sm sm:text-base font-medium">Sekolah, instansi, komunitas, maupun masyarakat umum dapat mengajukan permohonan kunjungan. Admin akan memverifikasi dan menghubungi Anda melalui kontak yang diisi.</p>
            </div>

            {permohonanSuccess ? (
              <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/60 p-6 sm:p-10 text-center">
                <div className="w-20 h-20 rounded-full bg-teal-50 border-2 border-white shadow-lg shadow-teal-500/10 flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} className="text-teal-500" /></div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">Permohonan Terkirim</h2>
                <p className="text-slate-500 text-sm sm:text-base font-medium mb-8">Terima kasih, permohonan kunjungan Anda sudah kami terima dan akan diverifikasi oleh admin Perpusda Kabupaten Bogor.</p>

                <div className="grid sm:grid-cols-2 gap-3 text-left mb-7">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Nama Pemohon</p><p className="text-sm font-bold text-slate-800">{permohonanSuccess.nama_pemohon}</p></div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Instansi / Komunitas</p><p className="text-sm font-bold text-slate-800">{permohonanSuccess.instansi || '-'}</p></div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Tanggal</p><p className="text-sm font-bold text-slate-800">{formatTanggalID(permohonanSuccess.tanggal_kunjungan, { weekday: undefined })}</p></div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Jam</p><p className="text-sm font-bold text-slate-800">{permohonanSuccess.jam_kunjungan} WIB</p></div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Jumlah Peserta</p><p className="text-sm font-bold text-slate-800">{permohonanSuccess.jumlah_peserta} orang</p></div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p><p className="text-sm font-bold text-amber-600">Menunggu verifikasi</p></div>
                  <div className="sm:col-span-2 bg-slate-50 rounded-2xl p-4 border border-slate-100"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Lokasi Kunjungan</p><p className="text-sm font-bold text-slate-800">{permohonanSuccess.alamat_lokasi}</p></div>
                </div>

                {permohonanSuccess.local && (
                  <div className="flex items-start gap-3 text-left bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 mb-7 text-xs font-semibold">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>Permohonan tersimpan sementara di perangkat ini karena tabel database belum dibuat. Jalankan file SQL migrasi Supabase agar permohonan masuk ke dashboard admin.</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button onClick={() => { setPermohonanSuccess(null); setPermohonanForm(createEmptyPermohonan()); }} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition-all">Buat Permohonan Lain</button>
                  <button onClick={() => setCurrentPage('calendar')} className="bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><CalendarDays size={16} /> Lihat Kalender</button>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-[1.45fr_1fr] gap-6 items-start">
                <form onSubmit={handleSubmitPermohonan} className="bg-white/90 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/60 p-5 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 text-blue-600 p-2.5 rounded-2xl"><ClipboardList size={20} /></div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-800">Formulir Permohonan</h2>
                      <p className="text-[11px] text-slate-400 font-semibold">Isi data dengan lengkap dan benar.</p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jenis Pemohon</label>
                      <select name="jenis_pemohon" value={permohonanForm.jenis_pemohon} onChange={handlePermohonanChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer">
                        {JENIS_PEMOHON.map((jenis) => <option key={jenis} value={jenis}>{jenis}</option>)}
                      </select>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Penanggung Jawab</label>
                        <input required type="text" name="nama_pemohon" value={permohonanForm.nama_pemohon} onChange={handlePermohonanChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="Nama lengkap" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{permohonanForm.jenis_pemohon === 'Masyarakat Umum' ? 'Komunitas / Instansi (opsional)' : 'Nama Sekolah / Instansi'}</label>
                        <input required={permohonanForm.jenis_pemohon !== 'Masyarakat Umum'} type="text" name="instansi" value={permohonanForm.instansi} onChange={handlePermohonanChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="Contoh: SDN 1 Cibinong" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kontak WhatsApp / Email</label>
                      <input required type="text" name="kontak" value={permohonanForm.kontak} onChange={handlePermohonanChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="0812xxxxxxx atau nama@email.com" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Alamat / Lokasi Kunjungan</label>
                      <textarea required name="alamat_lokasi" value={permohonanForm.alamat_lokasi} onChange={handlePermohonanChange} rows="3" className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm resize-none" placeholder="Nama sekolah/instansi, alamat lengkap, patokan lokasi..." />
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200 rounded-[1.5rem] p-4 sm:p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MapPinned size={13} className="text-teal-500" /> Titik Koordinat Kunjungan</p>
                          <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-relaxed">Klik atau geser pin pada peta. Titik ini yang akan tampil di peta publik setelah permohonan disetujui.</p>
                        </div>
                        <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-teal-200 bg-teal-50 text-teal-700">OSM</span>
                      </div>

                      <div className="relative rounded-[1.25rem] overflow-hidden border border-white shadow-inner bg-slate-200">
                        <div ref={permohonanMapRef} className="h-52 sm:h-64 w-full z-0"></div>
                        <div className="pointer-events-none absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-white rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-md">
                          {isValidCoord(parseFloat(permohonanForm.lat), parseFloat(permohonanForm.lng))
                            ? `${parseFloat(permohonanForm.lat).toFixed(6)}, ${parseFloat(permohonanForm.lng).toFixed(6)}`
                            : 'Belum ada titik dipilih'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button type="button" onClick={useMyLocationForPermohonan} disabled={isGeocoding} className="flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-60">
                          <LocateFixed size={14} /> Lokasi Saya
                        </button>
                        <button type="button" onClick={geocodePermohonanAddress} disabled={isGeocoding} className="flex items-center justify-center gap-2 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-60">
                          {isGeocoding ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Cari dari Alamat
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Opsional: Tempel Link Google Maps</label>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <input type="text" name="link_maps" value={permohonanForm.link_maps} onChange={handlePermohonanChange} className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl p-3 text-[11px] sm:text-xs font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="https://maps.google.com/?q=-6.49,106.83" />
                          <button type="button" onClick={applyPermohonanMapsLink} className="shrink-0 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 rounded-xl text-[11px] font-bold transition-all">
                            <Link2 size={14} /> Terapkan
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-2 ml-1 leading-relaxed">Link pendek (maps.app.goo.gl) tidak dapat dibaca. Buka link tersebut lalu salin URL lengkap yang memuat koordinat.</p>
                      </div>

                      {!isValidCoord(parseFloat(permohonanForm.lat), parseFloat(permohonanForm.lng)) && (
                        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3">
                          <AlertCircle size={15} className="shrink-0 mt-0.5" />
                          <span className="text-[10px] sm:text-[11px] font-semibold leading-relaxed">Tanpa titik koordinat, permohonan tetap bisa dikirim tetapi tidak akan muncul sebagai titik di peta publik.</span>
                        </div>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tanggal</label>
                        <input required type="date" min={todayKey} name="tanggal_kunjungan" value={permohonanForm.tanggal_kunjungan} onChange={handlePermohonanChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jam Mulai</label>
                        <input required type="time" name="jam_kunjungan" value={permohonanForm.jam_kunjungan} onChange={handlePermohonanChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jumlah Peserta</label>
                        <input required type="number" min="1" name="jumlah_peserta" value={permohonanForm.jumlah_peserta} onChange={handlePermohonanChange} className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="50" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Keperluan / Kebutuhan Layanan</label>
                      <textarea required name="keperluan" value={permohonanForm.keperluan} onChange={handlePermohonanChange} rows="3" className="w-full bg-white border border-slate-200 rounded-[1.25rem] p-3.5 sm:p-4 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm resize-none" placeholder="Contoh: literasi kelas, pojok baca, layanan pinjam buku..." />
                    </div>

                    <label className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 cursor-pointer">
                      <input required type="checkbox" name="setuju" checked={permohonanForm.setuju} onChange={handlePermohonanChange} className="mt-0.5 w-4 h-4 accent-blue-600" />
                      <span className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed">Saya menyetujui data yang diisi digunakan untuk proses verifikasi dan koordinasi kunjungan Perpustakaan Keliling.</span>
                    </label>

                    <button type="submit" disabled={isSubmittingPermohonan} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-[1.25rem] transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                      {isSubmittingPermohonan ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      {isSubmittingPermohonan ? 'Mengirim Permohonan...' : 'Kirim Permohonan'}
                    </button>
                  </div>
                </form>

                <aside className="space-y-5 lg:sticky lg:top-28">
                  <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 rounded-[2rem] p-6 sm:p-7 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2"><ClipboardList size={19} /> Alur Permohonan</h3>
                    <ol className="space-y-4 text-sm">
                      <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[10px] font-black shrink-0">1</span><span className="font-medium text-blue-50/90">Isi formulir permohonan dengan data yang valid.</span></li>
                      <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[10px] font-black shrink-0">2</span><span className="font-medium text-blue-50/90">Admin memverifikasi jadwal dan menghubungi pemohon.</span></li>
                      <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[10px] font-black shrink-0">3</span><span className="font-medium text-blue-50/90">Kunjungan disetujui dan tampil di kalender publik.</span></li>
                    </ol>
                  </div>

                  <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white p-6 shadow-xl shadow-slate-200/50">
                    <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2"><Phone size={17} className="text-teal-500" /> Butuh Bantuan?</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">Hubungi layanan Perpustakaan Keliling Kabupaten Bogor untuk informasi lebih lanjut.</p>
                    <div className="space-y-2.5">
                      <a href={getWhatsAppLink(KONTAK_LAYANAN.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-xl px-3.5 py-3 transition-colors"><MessageCircle size={15} /> WhatsApp Layanan</a>
                      <a href={`mailto:${KONTAK_LAYANAN.email}`} className="flex items-center gap-2.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl px-3.5 py-3 transition-colors"><Mail size={15} /> {KONTAK_LAYANAN.email}</a>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-[1.5rem] p-5 text-xs text-amber-800 font-semibold leading-relaxed flex items-start gap-3">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>Permohonan akan tampil di kalender publik setelah disetujui admin. Pastikan kontak yang diisi aktif.</span>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ========================================= */}
      {/* 5. ADMIN PAGE                            */}
      {/* ========================================= */}
      <div className={`flex-1 min-h-0 flex-col overflow-y-auto ${currentPage === 'admin' ? 'flex' : 'hidden'} ${!isSupabaseConfigured && session ? 'mt-8' : ''}`}>
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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 w-full">
              <div className="inline-flex items-center gap-1 bg-white/80 backdrop-blur-xl border border-white p-1.5 rounded-2xl shadow-lg shadow-slate-200/40">
                <button onClick={() => setAdminTab('jadwal')} className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${adminTab === 'jadwal' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50'}`}><Map size={16} /> Jadwal & Peta</button>
                <button onClick={() => setAdminTab('permohonan')} className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${adminTab === 'permohonan' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50'}`}><Inbox size={16} /> Permohonan {permohonanCounts.menunggu > 0 && <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${adminTab === 'permohonan' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>{permohonanCounts.menunggu}</span>}</button>
              </div>
            </div>

            {adminTab === 'jadwal' && (
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
            )}

            {adminTab === 'permohonan' && (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex-1">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[1.5rem] p-4 sm:p-5 shadow-lg shadow-slate-200/40">
                  <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span><Inbox size={18} className="text-blue-500" /></div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-800">{permohonanCounts.total}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[1.5rem] p-4 sm:p-5 shadow-lg shadow-slate-200/40">
                  <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Menunggu</span><Clock size={18} className="text-amber-500" /></div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-600">{permohonanCounts.menunggu}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[1.5rem] p-4 sm:p-5 shadow-lg shadow-slate-200/40">
                  <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disetujui</span><CircleCheck size={18} className="text-teal-500" /></div>
                  <p className="text-2xl sm:text-3xl font-black text-teal-600">{permohonanCounts.disetujui}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[1.5rem] p-4 sm:p-5 shadow-lg shadow-slate-200/40">
                  <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ditolak</span><CircleX size={18} className="text-rose-500" /></div>
                  <p className="text-2xl sm:text-3xl font-black text-rose-600">{permohonanCounts.ditolak}</p>
                </div>
              </div>

              {!permohonanDbReady && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-[1.5rem] p-4 sm:p-5 mb-5 text-xs font-semibold">
                  <AlertCircle size={20} className="shrink-0" />
                  <div className="flex-1">
                    <p className="font-black mb-1">Tabel permohonan belum terdeteksi</p>
                    <p className="leading-relaxed">Jalankan file <code className="bg-amber-100 px-1.5 py-0.5 rounded">supabase/migrations/20261107000000_permohonan_kunjungan.sql</code> di SQL Editor Supabase. Sementara itu, permohonan yang dikirim dari browser ini disimpan lokal.</p>
                  </div>
                  <button onClick={refreshPermohonanAdmin} className="bg-white border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2 shrink-0"><RefreshCw size={14} /> Cek Ulang</button>
                </div>
              )}

              <div className="bg-white/80 backdrop-blur-xl rounded-[1.75rem] sm:rounded-[2rem] border border-white shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2.5"><ClipboardList size={20} className="text-blue-500" /> Permohonan Kunjungan</h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 font-semibold mt-1">Setujui permohonan agar otomatis muncul di kalender publik.</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['semua', 'menunggu', 'disetujui', 'ditolak'].map((status) => (
                      <button key={status} onClick={() => setPermohonanFilter(status)} className={`px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold capitalize border transition-all ${permohonanFilter === status ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{status === 'semua' ? 'Semua' : getStatusMeta(status).label}</button>
                    ))}
                    <button onClick={refreshPermohonanAdmin} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Muat ulang"><RefreshCw size={15} className={isPermohonanLoading ? 'animate-spin' : ''} /></button>
                  </div>
                </div>

                {isPermohonanLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3"><Loader2 className="animate-spin text-blue-500" size={28} /><p className="text-xs font-bold text-slate-400">Memuat permohonan...</p></div>
                ) : filteredPermohonan.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4"><Inbox size={30} className="text-slate-300" /></div>
                    <p className="font-black text-slate-700 mb-1">Belum ada permohonan</p>
                    <p className="text-xs text-slate-400 font-medium">Permohonan yang masuk akan muncul di sini.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredPermohonan.map((item) => {
                      const meta = getStatusMeta(item.status);
                      return (
                        <div key={item.id} className="p-4 sm:p-6 hover:bg-blue-50/20 transition-colors">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${item.jenis_pemohon === 'Sekolah' ? 'bg-blue-50 border-blue-100 text-blue-500' : 'bg-teal-50 border-teal-100 text-teal-500'}`}>
                                {item.jenis_pemohon === 'Sekolah' ? <School size={20} /> : <Users size={20} />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h3 className="font-black text-slate-800 text-sm sm:text-base truncate">{item.instansi || item.nama_pemohon}</h3>
                                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${meta.badge}`}><span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></span>{meta.label}</span>
                                  {item.local && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Lokal</span>}
                                </div>
                                <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mb-3">{item.jenis_pemohon} • {item.nama_pemohon}</p>

                                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:text-xs font-semibold text-slate-600">
                                  <span className="flex items-center gap-2"><CalendarDays size={13} className="text-blue-500 shrink-0" /> {formatTanggalID(item.tanggal_kunjungan, { weekday: undefined })}</span>
                                  <span className="flex items-center gap-2"><Clock size={13} className="text-teal-500 shrink-0" /> {item.jam_kunjungan} WIB</span>
                                  <span className="flex items-center gap-2"><Users size={13} className="text-indigo-500 shrink-0" /> {item.jumlah_peserta} peserta</span>
                                  <span className="flex items-center gap-2 min-w-0"><Phone size={13} className="text-amber-500 shrink-0" /> <span className="truncate">{item.kontak}</span></span>
                                  <span className="flex items-start gap-2 sm:col-span-2"><MapPin size={13} className="text-rose-500 shrink-0 mt-0.5" /> <span>{item.alamat_lokasi}</span></span>
                                  {isValidCoord(toNullableCoord(item.lat), toNullableCoord(item.lng)) ? (
                                    <span className="flex flex-wrap items-center gap-2 sm:col-span-2">
                                      <span className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-slate-500"><MapPinned size={13} className="text-teal-500 shrink-0" /> {Number(item.lat).toFixed(5)}, {Number(item.lng).toFixed(5)}</span>
                                      <button type="button" onClick={() => { const visit = toVisitLocation(item); if (visit) openLocationOnMap(visit); }} className="text-[10px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-500 hover:text-white border border-teal-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"><ExternalLink size={11} /> Lihat di Peta</button>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-2 sm:col-span-2 text-[11px] sm:text-xs font-semibold text-amber-600"><AlertCircle size={13} className="shrink-0" /> Titik koordinat belum diisi — tidak tampil di peta publik</span>
                                  )}
                                </div>

                                {item.keperluan && (
                                  <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Keperluan</p>
                                    <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed">{item.keperluan}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex lg:flex-col gap-2 shrink-0">
                              {item.status !== 'disetujui' && <button onClick={() => handleUpdatePermohonanStatus(item, 'disetujui')} className="flex-1 lg:flex-none text-[10px] sm:text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-500 hover:text-white border border-teal-200 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"><CircleCheck size={14} /> Setujui</button>}
                              {item.status !== 'ditolak' && <button onClick={() => handleUpdatePermohonanStatus(item, 'ditolak')} className="flex-1 lg:flex-none text-[10px] sm:text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-200 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"><CircleX size={14} /> Tolak</button>}
                              {item.status !== 'menunggu' && <button onClick={() => handleUpdatePermohonanStatus(item, 'menunggu')} className="flex-1 lg:flex-none text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-200 border border-slate-200 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"><RefreshCw size={13} /> Pending</button>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            )}

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
