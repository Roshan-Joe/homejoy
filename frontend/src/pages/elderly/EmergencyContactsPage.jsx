import React, { useState, useEffect } from 'react';
import { PhoneCall, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';
import { PageHeader } from './ElderlyProfilePage';

const emptyForm = (type) => ({ contact_type: type, name: '', relationship: '', phone: '', alt_phone: '' });

export const EmergencyContactsPage = ({ onBack }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm('primary'));
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadContacts = () => elderlyClientService.getEmergencyContacts().then(setContacts).catch(() => setError('Could not load contacts.')).finally(() => setLoading(false));
  useEffect(() => { loadContacts(); }, []);

  const openAdd = () => {
    const types = contacts.map(c => c.contact_type);
    const nextType = types.includes('primary') ? 'secondary' : 'primary';
    setForm(emptyForm(nextType));
    setEditId(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };
  const openEdit = (c) => { setForm({ contact_type: c.contact_type, name: c.name, relationship: c.relationship, phone: c.phone, alt_phone: c.alt_phone || '' }); setEditId(c.id); setShowForm(true); setError(''); setSuccess(''); };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId) await elderlyClientService.updateEmergencyContact(editId, { name: form.name, relationship: form.relationship, phone: form.phone, alt_phone: form.alt_phone || null });
      else await elderlyClientService.addEmergencyContact(form);
      setSuccess(editId ? 'Contact updated!' : 'Contact added!');
      closeForm();
      loadContacts();
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === 'string' ? d : 'Could not save contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this emergency contact?')) return;
    setDeletingId(id);
    try {
      await elderlyClientService.deleteEmergencyContact(id);
      setContacts(c => c.filter(ct => ct.id !== id));
    } catch {
      setError('Could not remove contact.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

  const canAdd = contacts.length < 2;

  return (
    <div className="animate-fade-in">
      <PageHeader icon={<PhoneCall size={22} />} title="Emergency Contacts" subtitle="Up to 2 emergency contacts — Primary and Secondary" onBack={onBack} />

      {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '16px' }}>✓ {success}</div>}

      {!showForm && canAdd && (
        <div style={{ marginBottom: '20px' }}>
          <button className="btn btn-primary" onClick={openAdd} style={{ minHeight: '48px' }}>
            <Plus size={18} /> Add Emergency Contact
          </button>
        </div>
      )}

      {showForm && (
        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px', border: '2px solid var(--primary-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{editId ? 'Edit Contact' : `Add ${form.contact_type === 'primary' ? 'Primary' : 'Secondary'} Contact`}</h3>
            <button onClick={closeForm} className="btn btn-secondary" style={{ padding: '6px' }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Full Name *</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Contact person's full name" style={{ fontSize: '1rem', minHeight: '52px' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Relationship *</label>
                <input className="form-input" required value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} placeholder="e.g. Son, Daughter, Friend" style={{ fontSize: '1rem', minHeight: '52px' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Phone Number *</label>
                <input className="form-input" required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+60 12-345 6789" style={{ fontSize: '1rem', minHeight: '52px' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Alternative Phone <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input" type="tel" value={form.alt_phone} onChange={e => setForm(f => ({ ...f, alt_phone: e.target.value }))} placeholder="+60 3-1234 5678" style={{ fontSize: '1rem', minHeight: '52px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" onClick={closeForm} style={{ minHeight: '52px', padding: '0 22px', fontSize: '1rem' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, minHeight: '52px', fontSize: '1rem', fontWeight: 800 }}>
                {saving ? 'Saving…' : `💾 ${editId ? 'Update Contact' : 'Add Contact'}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {contacts.length === 0 && !showForm ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📞</div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No Emergency Contacts Yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Add a Primary contact. You can add a Secondary contact too.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {['primary', 'secondary'].map(type => {
            const contact = contacts.find(c => c.contact_type === type);
            return contact ? (
              <div key={type} className="glass-card" style={{ padding: '22px 26px', border: `2px solid ${type === 'primary' ? 'var(--primary-light)' : '#e0e7ff'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: type === 'primary' ? 'var(--primary)' : 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, flexShrink: 0 }}>
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{contact.name}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: type === 'primary' ? 'var(--primary-light)' : '#e0e7ff', color: type === 'primary' ? 'var(--primary)' : 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {type}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{contact.relationship} · {contact.phone}</div>
                      {contact.alt_phone && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Alt: {contact.alt_phone}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => openEdit(contact)} style={{ padding: '8px 14px' }}><Pencil size={16} /> Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(contact.id)} disabled={deletingId === contact.id} style={{ padding: '8px 14px' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};
