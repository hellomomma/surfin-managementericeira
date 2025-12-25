
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, UserRole, SurfClass, Reservation, Expense, Revenue, Language, ReservationStatus, InternalSource, PaymentMethod, SurfLevel, ClassType } from './types';

const SUPABASE_URL = 'https://npzowlktcqvxwezhrtaj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_x7V0zd0SlwsVKxQE1ungqQ_zvyY2Us9';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_EMAIL = 'ericeirasurfin@gmail.com';

const PARTNERSHIP_SOURCES = [
  InternalSource.SELINA,
  InternalSource.SANDHI_HOUSE,
  InternalSource.ONDINA,
  InternalSource.PACO_D_ILHAS,
  InternalSource.SWELLNEST,
  InternalSource.RETREATS
];

interface AppState {
  user: User | null;
  classes: SurfClass[];
  reservations: Reservation[];
  expenses: Expense[];
  revenues: Revenue[];
  partners: User[];
  language: Language;
  websiteApiUrl: string;
  lastSync: string | null;
  isOnline: boolean;
  realtimeStatus: 'connecting' | 'connected' | 'error';
  isSyncing: boolean;
}

interface AppContextProps extends AppState {
  login: (email: string, password: string) => Promise<{ success: boolean, error?: string }>;
  register: (name: string, email: string, password: string, assignedOrigin?: InternalSource) => Promise<{ success: boolean, error?: string }>;
  logout: () => void;
  setLanguage: (lang: Language) => void;
  addClass: (c: Omit<SurfClass, 'id'>) => Promise<{ success: boolean, error?: string }>;
  removeClass: (id: string) => Promise<void>;
  addReservation: (r: Omit<Reservation, 'id'>) => Promise<{ success: boolean, error?: string }>;
  removeReservation: (id: string) => Promise<void>;
  updateReservationStatus: (id: string, status: ReservationStatus) => Promise<void>;
  ensureAdminExists: () => Promise<{ success: boolean, message: string, isRlsError?: boolean }>;
  addExpense: (e: Omit<Expense, 'id'>) => Promise<{ success: boolean, error?: string }>;
  removeExpense: (id: string) => Promise<void>;
  addRevenue: (r: Omit<Revenue, 'id'>) => Promise<{ success: boolean, error?: string }>;
  removeRevenue: (id: string) => Promise<void>;
  setWebsiteApiUrl: (url: string) => void;
  syncWithWebsite: () => Promise<{ added: number, skipped: number }>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const syncTimeoutRef = useRef<number | null>(null);

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('surf_school_state');
    let initialState: AppState = {
      user: null, classes: [], reservations: [], expenses: [], revenues: [], partners: [],
      language: 'pt', websiteApiUrl: '', lastSync: null, isOnline: navigator.onLine,
      realtimeStatus: 'connecting', isSyncing: false
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        initialState = { ...initialState, ...parsed, user: parsed.user || null };
      } catch (e) { console.error(e); }
    }
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem('surf_school_state', JSON.stringify(state));
  }, [state]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const [p, c, r, e, rev] = await Promise.all([
        supabase.from('partners').select('*'),
        supabase.from('classes').select('*'),
        supabase.from('reservations').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('revenues').select('*')
      ]);

      setState(prev => ({
        ...prev,
        partners: p.data || [],
        classes: c.data || [],
        reservations: r.data || [],
        expenses: e.data || [],
        revenues: rev.data || [],
        lastSync: new Date().toISOString()
      }));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      if (!silent) {
        if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = window.setTimeout(() => setIsSyncing(false), 800);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('instant-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData(true))
      .subscribe((status) => setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting'));
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const login = async (email: string, pass: string) => {
    const { data: foundUser } = await supabase.from('partners').select('*').eq('username', email.trim().toLowerCase()).maybeSingle();
    if (foundUser && foundUser.password === pass) {
      setState(prev => ({ ...prev, user: foundUser }));
      fetchData(true);
      return { success: true };
    }
    return { success: false, error: "Credenciais inválidas." };
  };

  const register = async (name: string, email: string, password: string, assignedOrigin?: InternalSource) => {
    const newUser = { id: Math.random().toString(36).substring(2, 11), username: email.trim().toLowerCase(), name, role: UserRole.PARTNER, password, assignedOrigin };
    const { error } = await supabase.from('partners').insert(newUser);
    if (error) return { success: false, error: error.message };
    setState(prev => ({ ...prev, user: newUser }));
    return { success: true };
  };

  const logout = () => setState(prev => ({ ...prev, user: null }));
  const setLanguage = (lang: Language) => setState(prev => ({ ...prev, language: lang }));
  const setWebsiteApiUrl = (url: string) => setState(prev => ({ ...prev, websiteApiUrl: url }));

  const ensureAdminExists = async () => {
    const { data: existing } = await supabase.from('partners').select('*').eq('username', ADMIN_EMAIL).maybeSingle();
    if (!existing) {
      const newAdmin = { id: 'admin-fixed-id', username: ADMIN_EMAIL, name: 'Surf\'in Ericeira Admin', role: UserRole.ADMIN, password: 'admin' };
      await supabase.from('partners').insert(newAdmin);
      fetchData(true);
      return { success: true, message: "Admin criado!" };
    }
    return { success: true, message: "Admin OK." };
  };

  const addClass = async (c: Omit<SurfClass, 'id'>) => {
    const newClass = { ...c, id: Math.random().toString(36).substring(2, 11), isArchived: false };
    setState(prev => ({ ...prev, classes: [...prev.classes, newClass] }));
    const { error } = await supabase.from('classes').insert(newClass);
    if (error) { fetchData(true); return { success: false, error: error.message }; }
    return { success: true };
  };

  // SOLUÇÃO: Archive em vez de Delete físico
  const removeClass = async (id: string) => {
    const originalClasses = [...state.classes];
    // No frontend removemos da vista ativa imediatamente
    setState(prev => ({ 
      ...prev, 
      classes: prev.classes.map(c => c.id === id ? { ...c, isArchived: true } : c) 
    }));
    
    // No backend apenas marcamos como arquivado
    const { error } = await supabase.from('classes').update({ isArchived: true }).eq('id', id);
    if (error) { 
      // Se der erro (ex: coluna não existe ainda), tentamos o delete normal como fallback
      const { error: delError } = await supabase.from('classes').delete().eq('id', id);
      if (delError) {
        setState(prev => ({ ...prev, classes: originalClasses }));
        throw delError;
      }
    }
  };

  const addReservation = async (r: Omit<Reservation, 'id'>) => {
    const newResId = Math.random().toString(36).substring(2, 11);
    const newRes: Reservation = { ...r, id: newResId };
    const isPartnership = r.internalSource && PARTNERSHIP_SOURCES.includes(r.internalSource);
    const schoolNetValue = isPartnership ? r.price * 0.8 : r.price;

    setState(prev => ({ ...prev, reservations: [...prev.reservations, newRes] }));
    const { error: resErr } = await supabase.from('reservations').insert(newRes);
    if (resErr) { fetchData(true); return { success: false, error: resErr.message }; }
    
    const newRev: Revenue = { 
      id: Math.random().toString(36).substring(2, 11), 
      value: schoolNetValue, 
      date: new Date().toISOString().split('T')[0], 
      category: 'Aula', 
      description: `${r.guestName}${isPartnership ? ' (Net 80%)' : ''}`, 
      reservationId: newResId 
    };
    
    await supabase.from('revenues').insert(newRev);
    fetchData(true);
    return { success: true };
  };

  const removeReservation = async (id: string) => {
    // Para reservas, o delete costuma funcionar melhor, mas podemos usar status CANCELLED como soft delete
    const original = [...state.reservations];
    setState(prev => ({ ...prev, reservations: prev.reservations.filter(r => r.id !== id) }));
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (error) { 
      // Se o delete falhar, forçamos apenas o status cancelado
      await supabase.from('reservations').update({ status: ReservationStatus.CANCELLED }).eq('id', id);
      fetchData(true);
    }
  };

  const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    const original = [...state.reservations];
    setState(prev => ({ ...prev, reservations: prev.reservations.map(r => r.id === id ? { ...r, status } : r) }));
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
    if (error) { setState(prev => ({ ...prev, reservations: original })); throw error; }
    if (status === ReservationStatus.CANCELLED) {
      await supabase.from('revenues').delete().eq('reservationId', id);
    }
  };

  const addExpense = async (e: Omit<Expense, 'id'>) => {
    const newExp = { ...e, id: Math.random().toString(36).substring(2, 11) };
    setState(prev => ({ ...prev, expenses: [...prev.expenses, newExp] }));
    const { error } = await supabase.from('expenses').insert(newExp);
    if (error) { fetchData(true); return { success: false, error: error.message }; }
    return { success: true };
  };

  const removeExpense = async (id: string) => {
    const original = [...state.expenses];
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) { setState(prev => ({ ...prev, expenses: original })); throw error; }
  };

  const addRevenue = async (r: Omit<Revenue, 'id'>) => {
    const newRev = { ...r, id: Math.random().toString(36).substring(2, 11) };
    setState(prev => ({ ...prev, revenues: [...prev.revenues, newRev] }));
    const { error } = await supabase.from('revenues').insert(newRev);
    if (error) { fetchData(true); return { success: false, error: error.message }; }
    return { success: true };
  };

  const removeRevenue = async (id: string) => {
    const original = [...state.revenues];
    setState(prev => ({ ...prev, revenues: prev.revenues.filter(r => r.id !== id) }));
    const { error } = await supabase.from('revenues').delete().eq('id', id);
    if (error) { setState(prev => ({ ...prev, revenues: original })); throw error; }
  };

  const syncWithWebsite = async () => ({ added: 0, skipped: 0 });

  return React.createElement(AppContext.Provider, {
    value: {
      ...state, isSyncing, realtimeStatus, login, register, logout, setLanguage, addClass, removeClass, 
      addReservation, removeReservation, updateReservationStatus, ensureAdminExists, 
      addExpense, removeExpense, addRevenue, removeRevenue, setWebsiteApiUrl, syncWithWebsite, refreshData: () => fetchData(false)
    }
  }, children);
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp error');
  return context;
};
