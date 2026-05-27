export type Room = {
  id: string
  name: string
  capacity: number
  price_per_hour: number
  description: string
  created_at: string
}

export type Booking = {
  id: string
  user_id: string
  room_id: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'cancelled' | 'pending'
  google_event_id: string | null
  notes: string | null
  created_at: string
  rooms?: Room
  profiles?: Profile
}

export type Membership = {
  id: string
  user_id: string
  plan: string
  hours_total: number
  hours_used: number
  valid_until: string
  created_at: string
  profiles?: Profile
}

export type Transaction = {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  booking_id: string | null
  created_at: string
}

export type Profile = {
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin'
  created_at: string
}
