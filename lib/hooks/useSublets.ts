import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';

export interface Sublet {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  city: string;
  neighborhood: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_per_month: number;
  num_rooms: number | null;
  num_bathrooms: number | null;
  area_sqm: number | null;
  available_from: string;
  available_until: string;
  duration_months: number | null;
  num_roommates: number;
  roommate_gender: string;
  apartment_vibe: string[] | null;
  amenities: string[] | null;
  images: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubletFilters {
  city?: string;
  dateFrom?: string;       // ISO date
  dateTo?: string;
  rooms?: number | null;
  roommatesCount?: number | null;
  priceMin?: number;
  priceMax?: number;
  amenities?: string[];
  roommateGender?: string;
  vibe?: string[];
}

export function useSublets(filters: SubletFilters) {
  const [sublets, setSublets] = useState<Sublet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSublets = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('sublets')
      .select('*')
      .eq('is_active', true);

    if (filters.city && filters.city !== 'הכל') {
      query = query.eq('city', filters.city);
    }
    if (filters.dateFrom) {
      query = query.lte('available_from', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.gte('available_until', filters.dateTo);
    }
    if (filters.rooms) {
      query = query.eq('num_rooms', filters.rooms);
    }
    if (filters.roommatesCount !== null && filters.roommatesCount !== undefined) {
      query = query.eq('num_roommates', filters.roommatesCount);
    }
    if (filters.priceMin) {
      query = query.gte('price_per_month', filters.priceMin);
    }
    if (filters.priceMax) {
      query = query.lte('price_per_month', filters.priceMax);
    }
    if (filters.roommateGender && filters.roommateGender !== 'הכל') {
      query = query.eq('roommate_gender', filters.roommateGender);
    }
    if (filters.amenities && filters.amenities.length > 0) {
      query = query.contains('amenities', filters.amenities);
    }
    if (filters.vibe && filters.vibe.length > 0) {
      query = query.overlaps('apartment_vibe', filters.vibe);
    }

    const { data, error: queryError } = await query.order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setSublets([]);
    } else {
      setSublets(data ?? []);
    }
    setLoading(false);
  }, [
    filters.city,
    filters.dateFrom,
    filters.dateTo,
    filters.rooms,
    filters.roommatesCount,
    filters.priceMin,
    filters.priceMax,
    filters.roommateGender,
    JSON.stringify(filters.amenities),
    JSON.stringify(filters.vibe),
  ]);

  useEffect(() => {
    fetchSublets();
  }, [fetchSublets]);

  return { sublets, loading, error, refetch: fetchSublets };
}
