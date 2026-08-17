import React, { useState, useEffect } from 'react';
import { CheckCircle2, Plus, Filter, Clock, AlertCircle, Trash2, Calendar } from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';

export const CaregiverTasksView = ({ assignedElderly = [] }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    elderly_id: assignedElderly[0]?.id || '',
    title: '',
    description: '',
    priority: 'Medium',
    due_date: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await caregiverPortalService.getTasks({
        priority: priorityFilter,
        status: statusFilter
      });
      setTasks(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.elderly_id || !newTask.title.trim()) return;

    try {
      setSubmitting(true);
      await caregiverPortalService.createTask(newTask);
      setActionMsg('New caregiver task created.');
      setTimeout(() => setActionMsg(''), 3000);
      setShowAddModal(false);
      setNewTask({
        elderly_id: assignedElderly[0]?.id || '',
        title: '',
        description: '',
        priority: 'Medium',
        due_date: new Date().toISOString().split('T')[0]
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await caregiverPortalService.updateTask(task.id, { status: nextStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Caregiver Daily Tasks</h1>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Lightweight task manager to track daily check-ins, medication verifications, and patient care routines.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={18} />
            <span>Create New Task</span>
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ minWidth: '150px' }}>
            <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Task Statuses</option>
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <select className="form-input" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="alert alert-success animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
          <CheckCircle2 size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 600 }}>No caregiver tasks found</h3>
          <p style={{ fontSize: '0.88rem', margin: '0 0 16px 0' }}>Click "Create New Task" to add your first care reminder.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map((t) => {
            const isDone = t.status === 'Completed';
            return (
              <div
                key={t.id}
                className="glass-card"
                style={{
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
                  opacity: isDone ? 0.75 : 1,
                  background: isDone ? '#f8fafc' : '#fff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => handleToggleStatus(t)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  <div>
                    <div style={{
                      fontWeight: 700, fontSize: '0.98rem', color: isDone ? '#64748b' : '#1e293b',
                      textDecoration: isDone ? 'line-through' : 'none'
                    }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: '0.83rem', color: '#64748b', marginTop: '2px' }}>
                      For <strong>{t.elderly_name}</strong> • Due: {t.due_date || 'Today'}
                      {t.description && ` • "${t.description}"`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                    background: t.priority === 'High' ? '#fee2e2' : (t.priority === 'Medium' ? '#fef3c7' : '#e0e7ff'),
                    color: t.priority === 'High' ? '#b91c1c' : (t.priority === 'Medium' ? '#b45309' : '#3730a3')
                  }}>
                    {t.priority}
                  </span>

                  <span style={{
                    padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                    background: isDone ? '#d1fae5' : '#f1f5f9',
                    color: isDone ? '#047857' : '#475569'
                  }}>
                    {t.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', background: '#fff' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0' }}>Create Caregiver Task</h3>

            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Select Assigned Patient</label>
                <select
                  className="form-input"
                  value={newTask.elderly_id}
                  onChange={(e) => setNewTask({ ...newTask, elderly_id: e.target.value })}
                  required
                >
                  {assignedElderly.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Check morning blood pressure"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Additional notes for care routine..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-input"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
