import { useState, useEffect, FormEvent } from 'react';
import { Plus, ExternalLink, Trash2, Edit2, X, Star } from 'lucide-react';
import api from '../api/client';
import { AccommodationOption } from '../types';
import StatusBadge from '../components/StatusBadge';

const searchLinks = [
  { name: 'Booking.com', url: 'https://www.booking.com/searchresults.html?ss=Mauritius&checkin_year=2027&checkin_month=4&checkin_monthday=1&checkout_year=2027&checkout_month=4&checkout_monthday=15&group_adults=2' },
  { name: 'Airbnb', url: 'https://www.airbnb.com/s/Mauritius--Mauritius/homes?checkin=2027-04-01&checkout=2027-04-14&adults=2' },
  { name: 'Hotels.com', url: 'https://www.hotels.com/search.do?destination-id=262990&q-destination=Mauritius' },
  { name: 'TripAdvisor Hotels', url: 'https://www.tripadvisor.com/Hotels-g293816-Mauritius-Hotels.html' },
  { name: 'Expedia', url: 'https://www.expedia.ca/Mauritius-Hotels.d262990.Travel-Guide-Hotels' },
  { name: 'MrAndMrsSmith (luxury)', url: 'https://www.mrandmrssmith.com/destinations/mauritius' },
];

const blank = {
  name: '',
  accommodation_type: 'hotel',
  location: '',
  checkin_date: '',
  checkout_date: '',
  price_per_night: '',
  total_price: '',
  currency: 'CAD',
  booking_url: '',
  notes: '',
  rating: '',
  status: 'researching',
};

export default function Accommodations() {
  const [items, setItems] = useState<AccommodationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AccommodationOption | null>(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/accommodations/').then(r => setItems(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(blank); setShowModal(true); };
  const openEdit = (item: AccommodationOption) => {
    setEditing(item);
    setForm({
      name: item.name, accommodation_type: item.accommodation_type ?? 'hotel',
      location: item.location ?? '', checkin_date: item.checkin_date ?? '',
      checkout_date: item.checkout_date ?? '', price_per_night: item.price_per_night?.toString() ?? '',
      total_price: item.total_price?.toString() ?? '', currency: item.currency,
      booking_url: item.booking_url ?? '', notes: item.notes ?? '',
      rating: item.rating?.toString() ?? '', status: item.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price_per_night: form.price_per_night ? parseFloat(form.price_per_night) : null,
      total_price: form.total_price ? parseFloat(form.total_price) : null,
      rating: form.rating ? parseFloat(form.rating) : null,
    };
    try {
      if (editing) await api.put(`/accommodations/${editing.id}`, payload);
      else await api.post('/accommodations/', payload);
      setShowModal(false);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this accommodation?')) return;
    await api.delete(`/accommodations/${id}`);
    load();
  };

  const typeEmoji: Record<string, string> = { hotel: '🏨', villa: '🏡', resort: '🏖️', airbnb: '🏠', hostel: '🛏️' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Accommodations 🏨</h1>
          <p className="text-slate-500 text-sm mt-1">Research and compare hotels, villas, and resorts in Mauritius</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Option
        </button>
      </div>

      {/* Search Links */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-700 mb-3">Where to search</h2>
        <div className="flex flex-wrap gap-2">
          {searchLinks.map(({ name, url }) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-sm transition-colors">
              {name} <ExternalLink size={12} />
            </a>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">Tip: Grand Baie (north) is lively, Flic en Flac (west) has great snorkeling reefs, Le Morne (south-west) is dramatic and beautiful.</p>
      </div>

      {/* Saved */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3">Saved Options ({items.length})</h2>
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <div className="text-4xl mb-3">🏖️</div>
            <p className="text-slate-500 font-medium">No accommodations saved yet</p>
            <p className="text-slate-400 text-sm mt-1">Browse the sites above and save options you like</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xl">{typeEmoji[item.accommodation_type ?? ''] ?? '🏨'}</span>
                      <h3 className="font-semibold text-slate-800 truncate">{item.name}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    {item.location && <p className="text-sm text-slate-500">📍 {item.location}</p>}
                    {(item.checkin_date || item.checkout_date) && (
                      <p className="text-sm text-slate-500 mt-1">📅 {item.checkin_date} → {item.checkout_date}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {item.price_per_night && (
                        <span className="text-sm font-medium text-teal-700">{item.currency} ${item.price_per_night}/night</span>
                      )}
                      {item.total_price && (
                        <span className="text-sm font-medium text-slate-700">Total: {item.currency} ${item.total_price.toLocaleString()}</span>
                      )}
                      {item.rating && (
                        <span className="flex items-center gap-1 text-sm text-amber-600">
                          <Star size={12} className="fill-amber-400 stroke-amber-400" /> {item.rating}
                        </span>
                      )}
                    </div>
                    {item.notes && <p className="mt-2 text-sm text-slate-400 italic">{item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.booking_url && (
                      <a href={item.booking_url} target="_blank" rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-teal-600 transition-colors"><ExternalLink size={15} /></a>
                    )}
                    <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">{editing ? 'Edit Accommodation' : 'Add Accommodation'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label">Name *</label>
                <input required className="input" placeholder="e.g. Constance Belle Mare Plage" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.accommodation_type} onChange={e => setForm({...form, accommodation_type: e.target.value})}>
                    <option value="hotel">Hotel</option><option value="resort">Resort</option>
                    <option value="villa">Villa</option><option value="airbnb">Airbnb</option><option value="hostel">Hostel</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="researching">Researching</option><option value="shortlisted">Shortlisted</option>
                    <option value="booked">Booked</option><option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Location / Area</label>
                <input className="input" placeholder="e.g. Belle Mare, East Coast" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Check-in Date</label>
                  <input className="input" placeholder="Apr 1, 2027" value={form.checkin_date} onChange={e => setForm({...form, checkin_date: e.target.value})} />
                </div>
                <div>
                  <label className="label">Check-out Date</label>
                  <input className="input" placeholder="Apr 15, 2027" value={form.checkout_date} onChange={e => setForm({...form, checkout_date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Per Night</label>
                  <input className="input" type="number" step="0.01" placeholder="250" value={form.price_per_night} onChange={e => setForm({...form, price_per_night: e.target.value})} />
                </div>
                <div>
                  <label className="label">Total Price</label>
                  <input className="input" type="number" step="0.01" placeholder="3500" value={form.total_price} onChange={e => setForm({...form, total_price: e.target.value})} />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                    <option>CAD</option><option>USD</option><option>EUR</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Rating (1-5)</label>
                  <input className="input" type="number" step="0.1" min="1" max="5" placeholder="4.5" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} />
                </div>
                <div>
                  <label className="label">Booking URL</label>
                  <input className="input" type="url" placeholder="https://..." value={form.booking_url} onChange={e => setForm({...form, booking_url: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} placeholder="Notes, pros/cons..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`.label{display:block;font-size:.8rem;font-weight:500;color:#475569;margin-bottom:.25rem}.input{width:100%;border:1px solid #e2e8f0;border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;outline:none}.input:focus{border-color:#0d9488;box-shadow:0 0 0 2px rgba(13,148,136,.15)}`}</style>
    </div>
  );
}
