import React, { useState, useEffect } from 'react';
import { CheckSquare } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';
import { WellnessRiskBadge } from '../../components/elderly/WellnessRiskBadge';
import { PageHeader } from './ElderlyProfilePage';

const STEPS = [
  {
    id: 'medication_taken',
    question: 'Have you taken your medications today?',
    description: 'Select the option that best describes your medication intake today.',
    emoji: '💊',
    options: ['Yes, all taken', 'Yes, partially taken', 'No, not taken', 'No medication today'],
  },
  {
    id: 'appetite',
    question: 'How was your appetite today?',
    description: 'Think about how well you ate during all meals today.',
    emoji: '🍽️',
    options: ['Excellent', 'Good', 'Fair', 'Poor', 'No Appetite'],
  },
  {
    id: 'sleep_quality',
    question: 'How was your sleep last night?',
    description: 'Consider how rested you feel this morning.',
    emoji: '😴',
    options: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'],
  },
  {
    id: 'mobility_difficulty',
    question: 'How is your movement and balance today?',
    description: 'Think about walking, getting up from a chair, or moving around.',
    emoji: '🚶',
    options: ['No difficulty', 'Slight difficulty', 'Moderate difficulty', 'Significant difficulty'],
  },
  {
    id: 'mood',
    question: 'How are you feeling emotionally today?',
    description: 'Your emotional wellness is just as important as physical wellness.',
    emoji: '😊',
    options: ['Great', 'Good', 'Okay', 'Not Great', 'Poor'],
  },
  {
    id: 'symptoms',
    question: 'Any symptoms or discomfort today?',
    description: 'Mention any aches, pains, or other symptoms you\'re experiencing.',
    emoji: '🩺',
    isText: true,
    placeholder: 'e.g. Mild headache, slight dizziness (leave blank if none)',
  },
];

const OPTION_COLORS = {
  // Positive
  'Yes, all taken': '#10b981', 'Excellent': '#10b981', 'No difficulty': '#10b981', 'Great': '#10b981', 'Good': '#10b981',
  // Neutral
  'Yes, partially taken': '#f59e0b', 'Fair': '#f59e0b', 'Okay': '#f59e0b', 'Slight difficulty': '#f59e0b',
  // Negative
  'No, not taken': '#ef4444', 'No Appetite': '#ef4444', 'Poor': '#ef4444', 'Very Poor': '#ef4444',
  'Significant difficulty': '#ef4444', 'Moderate difficulty': '#f59e0b', 'Not Great': '#f59e0b',
  'No medication today': '#94a3b8',
};

export const CheckInPage = ({ onBack, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    elderlyClientService.getTodayCheckin()
      .then(data => {
        if (data.completed) {
          setAlreadyDone(true);
          setTodayCheckin(data.checkin);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const currentAnswer = answers[step?.id] || '';

  const handleSelect = (value) => {
    setAnswers(a => ({ ...a, [step.id]: value }));
  };

  const handleNext = () => {
    if (!currentAnswer && !step.isText) return;
    if (isLast) {
      handleSubmit();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => setCurrentStep(s => s - 1);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        date: today,
        medication_taken: answers.medication_taken,
        appetite: answers.appetite,
        sleep_quality: answers.sleep_quality,
        mobility_difficulty: answers.mobility_difficulty,
        mood: answers.mood,
        symptoms: answers.symptoms || '',
        notes: '',
      };
      const res = await elderlyClientService.submitCheckin(payload);
      setResult(res);
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === 'string' ? d : 'Could not submit check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Checking today's status...</div>;

  if (alreadyDone && todayCheckin && !result) {
    return (
      <div className="animate-fade-in">
        <PageHeader icon={<CheckSquare size={22} />} title="Today's Check-In" subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} onBack={onBack} />
        <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>✅</div>
          <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '8px', color: 'var(--text-main)' }}>Check-In Already Completed!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Great job! You've already done your wellness check-in for today.</p>
          <WellnessRiskBadge riskLevel={todayCheckin.wellness_risk} size="lg" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '16px' }}>Come back tomorrow for your next check-in.</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="animate-fade-in">
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '8px', color: 'var(--text-main)' }}>Check-In Complete!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Well done for taking care of your wellness today.</p>
          <WellnessRiskBadge riskLevel={result.wellness_risk} size="lg" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '12px', lineHeight: '1.5' }}>
            This is a wellness indicator, not a medical diagnosis. If you feel unwell, please contact your caregiver.
          </p>
          <button className="btn btn-primary" onClick={onSuccess} style={{ marginTop: '24px', width: '100%', minHeight: '52px', fontSize: '1rem' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentStep) / STEPS.length) * 100;

  return (
    <div className="animate-fade-in">
      <PageHeader icon={<CheckSquare size={22} />} title="Daily Wellness Check-In" subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} onBack={onBack} />

      {/* Progress bar */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Step {currentStep + 1} of {STEPS.length}</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700 }}>{Math.round(progress)}% complete</span>
        </div>
        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Step card */}
      <div className="glass-card" style={{ padding: '36px 32px', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '14px' }}>{step.emoji}</div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e293b', lineHeight: '1.4', marginBottom: '10px' }}>{step.question}</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{step.description}</p>
        </div>

        {step.isText ? (
          <textarea
            className="form-input"
            value={currentAnswer}
            onChange={e => handleSelect(e.target.value)}
            placeholder={step.placeholder}
            rows={4}
            style={{ width: '100%', resize: 'vertical', fontSize: '1rem', minHeight: '100px' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {step.options.map(opt => {
              const selected = currentAnswer === opt;
              const color = OPTION_COLORS[opt] || '#0d9488';
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '18px 22px', borderRadius: '14px', textAlign: 'left',
                    border: `2.5px solid ${selected ? color : '#e2e8f0'}`,
                    background: selected ? `${color}15` : '#fff',
                    color: selected ? color : '#1e293b',
                    fontWeight: selected ? 800 : 600, fontSize: '1.05rem',
                    cursor: 'pointer', transition: 'all 0.2s', minHeight: '62px',
                    display: 'flex', alignItems: 'center', gap: '14px',
                  }}
                >
                  <span style={{ width: '26px', height: '26px', borderRadius: '50%', border: `2.5px solid ${selected ? color : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: selected ? color : 'transparent' }}>
                    {selected && <span style={{ color: '#fff', fontSize: '13px', fontWeight: 900 }}>✓</span>}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {error && <div className="alert alert-error" style={{ marginTop: '20px' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', gap: '12px' }}>
          {currentStep > 0 ? (
            <button className="btn btn-secondary" onClick={handleBack} style={{ minHeight: '58px', padding: '0 24px', fontSize: '1.05rem', fontWeight: 700 }}>
              ← Back
            </button>
          ) : <div />}
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={(!currentAnswer && !step.isText) || submitting}
            style={{ minHeight: '58px', padding: '0 32px', fontSize: '1.05rem', fontWeight: 800, flex: '0 0 auto', borderRadius: '14px' }}
          >
            {submitting ? 'Saving…' : isLast ? '✔ Done! Submit Check-In' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};
