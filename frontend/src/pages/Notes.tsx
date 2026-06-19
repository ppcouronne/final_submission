import { useState, useEffect, FormEvent } from 'react';
import { Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/client';
import { Note } from '../types';

const CATEGORIES = [
  { id: 'general', label: 'General', emoji: '📝' },
  { id: 'packing', label: 'Packing', emoji: '🧳' },
  { id: 'requirements', label: 'Requirements', emoji: '📋' },
  { id: 'research', label: 'Research', emoji: '🔍' },
  { id: 'todo', label: 'To-Do', emoji: '✅' },
];

const blank = { title: '', content: '', category: 'general' };

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/notes/').then(r => setNotes(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = activeCategory === 'all' ? notes : notes.filter(n => n.category === activeCategory);

  const openAdd = () => { setEditing(null); setForm({ ...blank, category: activeCategory === 'all' ? 'general' : activeCategory }); setShowModal(true); };
  const openEdit = (note: Note) => {
    setEditing(note);
    setForm({ title: note.title, content: note.content ?? '', category: note.category });
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/notes/${editing.id}`, form);
      else await api.post('/notes/', form);
      setShowModal(false);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this note?')) return;
    await api.delete(`/notes/${id}`);
    load();
  };

  const catEmoji = (cat: string) => CATEGORIES.find(c => c.id === cat)?.emoji ?? '📝';
  const catLabel = (cat: string) => CATEGORIES.find(c => c.id === cat)?.label ?? cat;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notes 📝</h1>
          <p className="text-slate-500 text-sm mt-1">Collaborative planning notes — shared with everyone on the trip</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> New Note
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveCategory('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          All ({notes.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = notes.filter(n => n.category === cat.id).length;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {cat.emoji} {cat.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Notes grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-slate-500 font-medium">No notes here yet</p>
          <p className="text-slate-400 text-sm mt-1">Click "New Note" to start planning</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(note => (
            <div key={note.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-xl mt-0.5">{catEmoji(note.category)}</span>
                  <div>
                    <h3 className="font-semibold text-slate-800 leading-tight">{note.title}</h3>
                    <span className="text-xs text-slate-400">{catLabel(note.category)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(note)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(note.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              {note.content && (
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed line-clamp-6">{note.content}</p>
              )}
              <div className="text-xs text-slate-400 mt-auto pt-2 border-t border-slate-100">
                Updated {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">{editing ? 'Edit Note' : 'New Note'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input required className="input" placeholder="Note title..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Content</label>
                <textarea
                  className="input"
                  rows={8}
                  placeholder="Write your note here..."
                  value={form.content}
                  onChange={e => setForm({...form, content: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Note'}
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
