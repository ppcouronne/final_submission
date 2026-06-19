import { useState, useEffect, FormEvent } from 'react';
import { Plus, ExternalLink, Trash2, Edit2, X } from 'lucide-react';
import api from '../api/client';
import { FlightOption } from '../types';
import StatusBadge from '../components/StatusBadge';

const searchLinks = [
  { name: 'Google Flights (YUL → MRU)', url: 'https://www.google.com/travel/flights' },
  { name: 'Kayak', url: 'https://www.kayak.com/flights/YUL-MRU/2027-04-01/2027-04-30' },
  { name: 'Skyscanner', url: 'https://www.skyscanner.com' },
  { name: 'Air Canada', url: 'https://www.aircanada.com' },
  { name: 'Air Mauritius', url: 'https://www.airmauritius.com' },
  { name: 'Emirates (via Dubai)', url: 'https://www.emirates.com' },
  { name: 'Air France (via Paris)', url: 'https://www.airfrance.ca' },
  { name: 'Qatar Airways (via Doha)', url: 'https://www.qatarairways.com' },
];

const blankFlight = {
  airline: '',
  outbound_departure: '',
  outbound_arrival: '',
  return_departure: '',
  return_arrival: '',
  price: '',
  currency: 'CAD',
  stops_outbound: '1',
  stops_return: '1',
  booking_url: '',
  notes: '',
  status: 'researching',
};

export default function Flights() {
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FlightOption | null>(null);
  const [form, setForm] = useState(blankFlight);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/flights/').then((r) => setFlights(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(blankFlight); setShowModal(true); };
  const openEdit = (f: FlightOption) => {
    setEditing(f);
    setForm({
      airline: f.airline,
      outbound_departure: f.outbound_departure ?? '',
      outbound_arrival: f.outbound_arrival ?? '',
      return_departure: f.return_departure ?? '',
      return_arrival: f.return_arrival ?? '',
      price: f.price?.toString() ?? '',
      currency: f.currency,
      stops_outbound: f.stops_outbound.toString(),
      stops_return: f.stops_return.toString(),
      booking_url: f.booking_url ?? '',
      notes: f.notes ?? '',
      status: f.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: form.price ? parseFloat(form.price) : null,
      stops_outbound: parseInt(form.stops_outbound),
      stops_return: parseInt(form.stops_return),
    };
    try {
      if (editing) {
        await api.put(`/flights/${editing.id}`, payload);
      } else {
        await api.post('/flights/', payload);
      }
      setShowModal(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this flight option?')) return;
    await api.delete(`/flights/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Flights ✈️</h1>
          <p className="text-slate-500 text-sm mt-1">Research and save flight options for Montreal → Mauritius</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Flight
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
        <p className="text-xs text-slate-400 mt-3">Tip: typical routes go via Paris (Air France), Dubai (Emirates), or Doha (Qatar). Expect 20-30 hours total travel time.</p>
      </div>

      {/* Saved flights */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3">Saved Options ({flights.length})</h2>
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : flights.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <div className="text-4xl mb-3">✈️</div>
            <p className="text-slate-500 font-medium">No flights saved yet</p>
            <p className="text-slate-400 text-sm mt-1">Click "Add Flight" to save a promising option you found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flights.map((f) => (
              <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{f.airline}</h3>
                      <StatusBadge status={f.status} />
                      {f.price && (
                        <span className="text-sm font-semibold text-teal-700">
                          {f.currency} ${f.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600">
                      {f.outbound_departure && <span>🛫 Outbound: {f.outbound_departure} → {f.outbound_arrival}</span>}
                      {f.return_departure && <span>🛬 Return: {f.return_departure} → {f.return_arrival}</span>}
                      <span>Stops: {f.stops_outbound} out / {f.stops_return} back</span>
                    </div>
                    {f.notes && <p className="mt-2 text-sm text-slate-500 italic">{f.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {f.booking_url && (
                      <a href={f.booking_url} target="_blank" rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-teal-600 transition-colors" title="Open booking link">
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <button onClick={() => openEdit(f)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(f.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
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
              <h2 className="font-semibold text-slate-800">{editing ? 'Edit Flight' : 'Add Flight Option'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label">Airline / Route *</label>
                <input required className="input" placeholder="e.g. Air France via Paris" value={form.airline} onChange={e => setForm({...form, airline: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Outbound Departure</label>
                  <input className="input" placeholder="Apr 1, 07:30" value={form.outbound_departure} onChange={e => setForm({...form, outbound_departure: e.target.value})} />
                </div>
                <div>
                  <label className="label">Outbound Arrival</label>
                  <input className="input" placeholder="Apr 2, 20:15" value={form.outbound_arrival} onChange={e => setForm({...form, outbound_arrival: e.target.value})} />
                </div>
                <div>
                  <label className="label">Return Departure</label>
                  <input className="input" placeholder="Apr 30, 11:00" value={form.return_departure} onChange={e => setForm({...form, return_departure: e.target.value})} />
                </div>
                <div>
                  <label className="label">Return Arrival</label>
                  <input className="input" placeholder="May 1, 18:30" value={form.return_arrival} onChange={e => setForm({...form, return_arrival: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Price</label>
                  <input className="input" type="number" step="0.01" placeholder="1450" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                    <option>CAD</option><option>USD</option><option>EUR</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="researching">Researching</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="booked">Booked</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Stops (outbound)</label>
                  <select className="input" value={form.stops_outbound} onChange={e => setForm({...form, stops_outbound: e.target.value})}>
                    <option value="0">Direct</option><option value="1">1 stop</option><option value="2">2 stops</option>
                  </select>
                </div>
                <div>
                  <label className="label">Stops (return)</label>
                  <select className="input" value={form.stops_return} onChange={e => setForm({...form, stops_return: e.target.value})}>
                    <option value="0">Direct</option><option value="1">1 stop</option><option value="2">2 stops</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Booking URL</label>
                <input className="input" type="url" placeholder="https://..." value={form.booking_url} onChange={e => setForm({...form, booking_url: e.target.value})} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} placeholder="Any notes about this option..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Flight'}
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
