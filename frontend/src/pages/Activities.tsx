import { useState, useEffect, FormEvent } from 'react';
import { Plus, ExternalLink, Trash2, X } from 'lucide-react';
import api from '../api/client';
import { Activity } from '../types';
import StatusBadge from '../components/StatusBadge';

const categoryMeta: Record<string, { label: string; emoji: string; color: string }> = {
  beach: { label: 'Beach', emoji: '🏖️', color: 'bg-amber-50 border-amber-200' },
  water_sports: { label: 'Water Sports', emoji: '🤿', color: 'bg-blue-50 border-blue-200' },
  nature: { label: 'Nature', emoji: '🌿', color: 'bg-green-50 border-green-200' },
  culture: { label: 'Culture', emoji: '🏛️', color: 'bg-purple-50 border-purple-200' },
  food: { label: 'Food & Drink', emoji: '🍜', color: 'bg-orange-50 border-orange-200' },
  adventure: { label: 'Adventure', emoji: '🪂', color: 'bg-red-50 border-red-200' },
};

const CATEGORIES = Object.keys(categoryMeta);

const blank = {
  name: '',
  description: '',
  category: 'beach',
  duration: '',
  price_per_person: '',
  currency: 'USD',
  booking_url: '',
  notes: '',
  status: 'interested',
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/activities/').then(r => setActivities(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const suggestions = activities.filter(a => a.is_suggestion);
  const saved = activities.filter(a => !a.is_suggestion);

  const filteredSuggestions = filter === 'all' ? suggestions : suggestions.filter(a => a.category === filter);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/activities/', {
        ...form,
        price_per_person: form.price_per_person ? parseFloat(form.price_per_person) : null,
      });
      setShowModal(false);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this activity?')) return;
    await api.delete(`/activities/${id}`);
    load();
  };

  const updateStatus = async (id: number, status: string) => {
    await api.put(`/activities/${id}`, { status });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Activities 🧭</h1>
          <p className="text-slate-500 text-sm mt-1">Explore what Mauritius has to offer and plan your days</p>
        </div>
        <button onClick={() => { setForm(blank); setShowModal(true); }}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Custom
        </button>
      </div>

      {/* Your planned activities */}
      {saved.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">Your Planned Activities ({saved.length})</h2>
          <div className="space-y-3">
            {saved.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{categoryMeta[a.category ?? '']?.emoji ?? '🎯'}</span>
                    <h3 className="font-medium text-slate-800">{a.name}</h3>
                    <StatusBadge status={a.status} />
                    {a.price_per_person !== undefined && a.price_per_person > 0 && (
                      <span className="text-sm text-teal-700 font-medium">${a.price_per_person}/{a.currency} pp</span>
                    )}
                  </div>
                  {a.description && <p className="text-sm text-slate-500 mt-1">{a.description}</p>}
                  {a.duration && <p className="text-xs text-slate-400 mt-1">⏱ {a.duration}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {a.booking_url && (
                    <a href={a.booking_url} target="_blank" rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-teal-600"><ExternalLink size={14} /></a>
                  )}
                  <button onClick={() => handleDelete(a.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <h2 className="font-semibold text-slate-700">Mauritius Highlights</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === cat ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {categoryMeta[cat].emoji} {categoryMeta[cat].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuggestions.map(a => {
              const meta = categoryMeta[a.category ?? ''] ?? { label: a.category ?? '', emoji: '🎯', color: 'bg-slate-50 border-slate-200' };
              return (
                <div key={a.id} className={`rounded-xl border p-4 flex flex-col gap-3 ${meta.color}`}>
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-800 text-sm leading-tight">{a.name}</h3>
                      <span className="text-xl flex-shrink-0">{meta.emoji}</span>
                    </div>
                    {a.description && <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{a.description}</p>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 flex-wrap gap-1">
                    {a.duration && <span>⏱ {a.duration}</span>}
                    {a.price_per_person !== undefined && (
                      <span className="font-medium text-slate-700">
                        {a.price_per_person === 0 ? 'Free' : `~$${a.price_per_person} ${a.currency} pp`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={a.status}
                      onChange={e => updateStatus(a.id, e.target.value)}
                      className="flex-1 border border-slate-300 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:border-teal-500"
                    >
                      <option value="suggested">Mark as...</option>
                      <option value="interested">Interested</option>
                      <option value="planned">Planned</option>
                      <option value="done">Done</option>
                    </select>
                    {a.booking_url && (
                      <a href={a.booking_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 bg-white rounded-lg border border-slate-300 text-slate-500 hover:text-teal-600 transition-colors">
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Add Custom Activity</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label">Activity Name *</label>
                <input required className="input" placeholder="e.g. Sunset cruise" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} placeholder="What is it about?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{categoryMeta[c].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Duration</label>
                  <input className="input" placeholder="e.g. Half day" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Price per person</label>
                  <input className="input" type="number" step="0.01" placeholder="0" value={form.price_per_person} onChange={e => setForm({...form, price_per_person: e.target.value})} />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                    <option>USD</option><option>CAD</option><option>EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Booking URL</label>
                <input className="input" type="url" placeholder="https://..." value={form.booking_url} onChange={e => setForm({...form, booking_url: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
                  {saving ? 'Saving...' : 'Add Activity'}
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
