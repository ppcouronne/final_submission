export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface Trip {
  id: number;
  name: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  description?: string;
}

export interface FlightOption {
  id: number;
  trip_id: number;
  user_id: number;
  airline: string;
  outbound_departure?: string;
  outbound_arrival?: string;
  return_departure?: string;
  return_arrival?: string;
  price?: number;
  currency: string;
  stops_outbound: number;
  stops_return: number;
  booking_url?: string;
  notes?: string;
  status: 'researching' | 'shortlisted' | 'booked' | 'rejected';
  created_at: string;
}

export interface AccommodationOption {
  id: number;
  trip_id: number;
  user_id: number;
  name: string;
  accommodation_type?: string;
  location?: string;
  checkin_date?: string;
  checkout_date?: string;
  price_per_night?: number;
  total_price?: number;
  currency: string;
  booking_url?: string;
  notes?: string;
  rating?: number;
  status: 'researching' | 'shortlisted' | 'booked' | 'rejected';
  created_at: string;
}

export interface Activity {
  id: number;
  trip_id: number;
  user_id?: number;
  name: string;
  description?: string;
  category?: string;
  duration?: string;
  price_per_person?: number;
  currency: string;
  booking_url?: string;
  notes?: string;
  status: 'suggested' | 'interested' | 'planned' | 'done';
  is_suggestion: boolean;
  created_at: string;
}

export interface Note {
  id: number;
  trip_id: number;
  user_id: number;
  title: string;
  content?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: number;
  trip_id: number;
  user_id: number;
  category: string;
  name: string;
  estimated_amount: number;
  actual_amount?: number;
  currency: string;
  notes?: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  trip_id: number;
  user_id?: number;
  sender_name?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
