import { useState, useEffect, FormEvent } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import api from '../api/client';
import { BudgetItem } from '../types';

const CATEGORIES = [
  { id: 'flights', label: 'Flights', emoji: '✈️', color: 'bg-blue-500' },
  { id: 'accommodation', label: 'Accommodation', emoji: '🏨', color: 'bg-teal-500' },
  { id: 'activities', label: 'Activities', emoji: '🤿', color: 'bg-purple-500' },
  { id: 'food', label: 'Food & Dining', emoji: '🍜', color: 'bg-orange-500' },
  { id: 'transport', label: 'Local Transport', emoji: '🚕', color: 'bg-yellow-500' },
  { id: 'misc', label: 'Miscellaneous', emoji: '🛍️', color: 'bg-slate-500' },
];

const blank = { category: 'flights', name: '', estimated_amount: '', actual_amount: '', currency: 'CAD', notes: '' };

export default function Budget() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/budget/').then(r => setItems(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const totalEstimated = items.reduce((s, i) => s + i.estimated_amount, 0);
  const totalActual = items.reduce((s, i) => s + (i.actual_amount ?? 0), 0);

  const openAdd = () => { setEditing(null); setForm(blank); setShowModal(true); };
  const openEdit = (item: BudgetItem) => {
    setEditing(item);
    setForm({ category: item.category, name: item.name, estimated_amount: item.estimated_amount.toString(), actual_amount: item.actual_amount?.toString() ?? '', currency: item.currency, notes: item.notes ?? '' });
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      estimated_amount: parseFloat(form.estimated_amount) || 0,
      actual_amount: form.actual_amount ? parseFloat(form.actual_amount) : null,
    };
    try {
      if (editing) await api.put(`/budget/${editing.id}`, payload);
      else await api.post('/budget/', payload);
      setShowModal(false);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this budget item?')) return;
    await api.delete(`/budget/${id}`);
    load();
  };

  const catMeta = (id: string) => CATEGORIES.find(c => c.id === id) ?? { label: id, emoji: '💰', color: 'bg-slate-500' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Budget 💰</h1>
          <p className="text-slate-500 text-sm mt-1">Track estimated and actual costs for the trip</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Total Estimated</div>
          <div className="text-3xl font-bold text-slate-800">CAD ${totalEstimated.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Total Actual</div>
          <div className="text-3xl font-bold text-teal-700">CAD ${totalActual.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Remaining (Estimated)</div>
          <div className={`text-3xl font-bold ${totalEstimated - totalActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            CAD ${Math.abs(totalEstimated - totalActual).toLocaleString()}
            {totalEstimated - totalActual < 0 ? ' over' : ''}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {totalEstimated > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">By Category</h2>
          <div className="space-y-3">
            {CATEGORIES.map(cat => {
              const catItems = items.filter(i => i.category === cat.id);
              if (catItems.length === 0) return null;
              const est = catItems.reduce((s, i) => s + i.estimated_amount, 0);
              const pct = totalEstimated > 0 ? (est / totalEstimated) * 100 : 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2 text-slate-600">{cat.emoji} {cat.label}</span>
                    <span className="font-medium text-slate-800">CAD ${est.toLocaleString()} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Items table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-slate-500 font-medium">No budget items yet</p>
          <p className="text-slate-400 text-sm mt-1">Start tracking your estimated trip costs</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Item</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Estimated</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Actual</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => {
                  const meta = catMeta(item.category);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        {item.notes && <div className="text-xs text-slate-400">{item.notes}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-500">{meta.emoji} {meta.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {item.currency} ${item.estimated_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.actual_amount != null ? (
                          <span className={`font-medium ${item.actual_amount > item.estimated_amount ? 'text-red-600' : 'text-teal-700'}`}>
                            {item.currency} ${item.actual_amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-semibold text-slate-700">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">CAD ${totalEstimated.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-teal-700">{totalActual > 0 ? `CAD $${totalActual.toLocaleString()}` : '—'}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">{editing ? 'Edit Budget Item' : 'Add Budget Item'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label">Description *</label>
                <input required className="input" placeholder="e.g. Round-trip flights (2 people)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="label">Estimated *</label>
                  <input required className="input" type="number" step="0.01" placeholder="0" value={form.estimated_amount} onChange={e => setForm({...form, estimated_amount: e.target.value})} />
                </div>
                <div className="col-span-1">
                  <label className="label">Actual</label>
                  <input className="input" type="number" step="0.01" placeholder="0" value={form.actual_amount} onChange={e => setForm({...form, actual_amount: e.target.value})} />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                    <option>CAD</option><option>USD</option><option>EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" placeholder="Optional notes..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Item'}
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
