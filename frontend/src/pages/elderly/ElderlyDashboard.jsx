import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import elderlyClientService from '../../services/elderlyClientService';
import { WellnessRiskBadge } from '../../components/elderly/WellnessRiskBadge';
import { ElderlyProfilePage } from './ElderlyProfilePage';
import { HealthInfoPage } from './HealthInfoPage';
import { HospitalInfoPage } from './HospitalInfoPage';
import { DoctorInfoPage } from './DoctorInfoPage';
import { MedicationsPage } from './MedicationsPage';
import { EmergencyContactsPage } from './EmergencyContactsPage';
import { CaregiverViewPage } from './CaregiverViewPage';
import { CheckInPage } from './CheckInPage';
import { WellnessHistoryPage } from './WellnessHistoryPage';
import { NotificationsPage } from './NotificationsPage';
import { ElderlySettingsPage } from './ElderlySettingsPage';
import { LoadingState } from '../../components/common/LoadingState';

import { DailyReminderModal } from '../../components/elderly/DailyReminderModal';
import { VitalsModal } from '../../components/elderly/VitalsModal';
import { RequestHelpModal } from '../../components/elderly/RequestHelpModal';
import { DailyReportModal } from '../../components/elderly/DailyReportModal';
import { VoiceCheckInModal } from '../../components/elderly/VoiceCheckInModal';
import { MedPassModal } from '../../components/elderly/MedPassModal';

import { VitalsGuardChart } from '../../components/elderly/VitalsGuardChart';
import { SmartPillCompanion } from '../../components/elderly/SmartPillCompanion';
import NotificationService from '../../services/NotificationService';

import { 
  HeartPulse, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  ArrowRight,
  Sun,
  Sunrise,
  Sunset,
  Sparkles,
  ShieldCheck,
  Pill,
  Bell,
  ChevronRight,
  UserCheck,
  Heart,
  Activity,
  Wind,
  ShieldAlert,
  FileText
} from 'lucide-react';

import elderlyWelcomeImg from '../../assets/elderly_welcome.png';
import dailyCheckinImg from '../../assets/daily_checkin.png';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMissingItems(profile, contacts, healthInfo) {
  const missing = [];
  if (!profile?.date_of_birth) missing.push('Date of Birth');
  if (!healthInfo?.conditions || healthInfo.conditions.length === 0) missing.push('Health Conditions');
  if (!contacts || contacts.length === 0) missing.push('Emergency Contact');
  return missing;
}

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: <Sunrise size={26} style={{ color: '#d97706' }} /> };
  if (hour < 17) return { text: 'Good Afternoon', icon: <Sun size={26} style={{ color: '#ea580c' }} /> };
  return { text: 'Good Evening', icon: <Sunset size={26} style={{ color: '#4f46e5' }} /> };
}

// ─── Main Dashboard Shell ─────────────────────────────────────────────────────

export const ElderlyDashboard = () => {
  const { user, logout } = useAuth();
  const [screen, setScreen] = useState('home');
  const [profile, setProfile] = useState(null);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [healthInfo, setHealthInfo] = useState(null);
  const [caregiver, setCaregiver] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dailyStatus, setDailyStatus] = useState(null);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isMedPassModalOpen, setIsMedPassModalOpen] = useState(false);
  const [todayReport, setTodayReport] = useState(null);
  const [activeHelpRequest, setActiveHelpRequest] = useState(null);

  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem('hj_banner_dismissed') === '1'
  );
  const [showNotifBanner, setShowNotifBanner] = useState(() => {
    try {
      const supported = typeof NotificationService?.isSupported === 'function'
        ? NotificationService.isSupported()
        : Boolean(NotificationService?.isSupported);
      return Boolean(supported && typeof Notification !== 'undefined' && Notification.permission === 'default');
    } catch {
      return false;
    }
  });

  const loadHome = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      elderlyClientService.getProfile(),
      elderlyClientService.getTodayCheckin(),
      elderlyClientService.getNotifications(),
      elderlyClientService.getEmergencyContacts(),
      elderlyClientService.getHealthInfo(),
      elderlyClientService.getCaregiver(),
      elderlyClientService.getDailyStatus(),
      elderlyClientService.getDailyReport(),
      elderlyClientService.getHelpRequests(),
    ]);
    if (results[0].status === 'fulfilled') setProfile(results[0].value);
    if (results[1].status === 'fulfilled') setTodayCheckin(results[1].value);
    if (results[2].status === 'fulfilled') setNotificationCount(results[2].value.length);
    if (results[3].status === 'fulfilled') setContacts(results[3].value);
    if (results[4].status === 'fulfilled') setHealthInfo(results[4].value);
    if (results[5].status === 'fulfilled') setCaregiver(results[5].value);
    if (results[6].status === 'fulfilled') {
      const statusData = results[6].value;
      setDailyStatus(statusData);
      if (statusData.show_9am_reminder) {
        setIsReminderModalOpen(true);
      }
    }
    if (results[7].status === 'fulfilled') setTodayReport(results[7].value);
    if (results[8].status === 'fulfilled' && results[8].value.length > 0) {
      setActiveHelpRequest(results[8].value[0]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadHome(); }, [loadHome]);

  const handleAcknowledgeReminder = async () => {
    try {
      await elderlyClientService.acknowledgeReminder();
    } catch (e) {
      console.error(e);
    }
    setIsReminderModalOpen(false);
  };

  const goHome = () => {
    setScreen('home');
    loadHome();
  };

  const dismissBanner = () => {
    sessionStorage.setItem('hj_banner_dismissed', '1');
    setBannerDismissed(true);
  };

  const missingItems = getMissingItems(profile, contacts, healthInfo);
  const showBanner = !bannerDismissed && missingItems.length > 0 && !loading;
  const greeting = getTimeBasedGreeting();
  const firstName = profile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Friend';

  // Render sub-screens
  if (screen !== 'home') {
    const sharedProps = { onBack: goHome };
    const screens = {
      profile:             <ElderlyProfilePage {...sharedProps} />,
      health:              <HealthInfoPage {...sharedProps} />,
      hospital:            <HospitalInfoPage {...sharedProps} />,
      doctor:              <DoctorInfoPage {...sharedProps} />,
      medications:         <MedicationsPage {...sharedProps} />,
      'emergency-contacts':<EmergencyContactsPage {...sharedProps} />,
      caregiver:           <CaregiverViewPage {...sharedProps} />,
      checkin:             <CheckInPage {...sharedProps} onSuccess={goHome} />,
      'wellness-history':  <WellnessHistoryPage {...sharedProps} />,
      notifications:       <NotificationsPage {...sharedProps} />,
      settings:            <ElderlySettingsPage {...sharedProps} onLogout={logout} />,
    };
    return (
      <div className="scrim-bg-wrapper page-bg-elderly" style={{ padding: '24px 0' }}>
        <div className="scrim-overlay-warm" />
        <div className="scrim-content elderly-view container-narrow page-wrapper">
          {screens[screen] || null}
        </div>
      </div>
    );
  }

  return (
    <div className="scrim-bg-wrapper page-bg-elderly" style={{ padding: '24px 0' }}>
      <div className="scrim-overlay-warm" />
      <div className="scrim-content elderly-view container-narrow page-wrapper">
        {/* Header */}
        <header className="card glass-card" style={{

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        marginBottom: '24px',
        borderRadius: 'var(--radius-xl)',
        border: '1.5px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
            flexShrink: 0
          }}>
            {((profile?.full_name || user?.full_name || 'U')).charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-hover)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                HomeJoy Elderly Portal
              </span>
            </div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px', lineHeight: 1.2 }}>
              {profile?.full_name || user?.full_name || 'Welcome Back'}
            </h1>
          </div>
        </div>

        <button
          id="elderly-signout-btn"
          onClick={logout}
          className="btn btn-danger btn-sm"
          style={{ minHeight: '46px', padding: '10px 20px', fontSize: '0.95rem', fontWeight: 700, borderRadius: 'var(--radius-lg)' }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Free Web Push Notification Opt-in Prompt */}
      {showNotifBanner && (
        <div
          className="card glass-card animate-fade-in"
          style={{
            marginBottom: '20px',
            padding: '16px 20px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '2px solid #86efac',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#14532d' }}>
                Enable Gentle Check-in & Pill Reminders
              </div>
              <div style={{ fontSize: '0.825rem', color: '#166534', marginTop: '2px' }}>
                Receive pleasant screen chimes when it's time for check-in or taking your vitamins & pills (100% free).
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={async () => {
                const granted = await NotificationService.requestPermission();
                if (granted) {
                  NotificationService.showNotification("HomeJoy Daily Companion", {
                    body: "Reminders active! We'll chime when it's time for check-in or medication."
                  });
                }
                setShowNotifBanner(false);
              }}
              className="btn btn-primary btn-sm"
              style={{ background: '#059669', borderColor: '#059669', fontWeight: 800, padding: '8px 16px' }}
            >
              Turn On Reminders
            </button>
            <button
              onClick={() => setShowNotifBanner(false)}
              style={{ background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 700 }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* Hero Welcome Message Banner */}
      {!loading && (
        <section className="elderly-hero-card">
          <div className="elderly-hero-content">
            <div className="elderly-hero-text">
              <div className="elderly-welcome-badge">
                <Sparkles size={16} />
                <span>Daily Care & Wellness</span>
              </div>
              <h2 className="elderly-hero-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span>{greeting.text}, {firstName}!</span>
                {greeting.icon}
              </h2>
              <p className="elderly-hero-sub">
                Welcome to your HomeJoy personal health space. We are dedicated to ensuring your comfort, safety, and well-being every step of the way today.
              </p>

              <div className="elderly-tip-box">
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Heart size={20} />
                </div>
                <div style={{ fontSize: '0.925rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  <strong>Daily Wellness Reminder:</strong> Remember to stay hydrated and take a relaxed 5-minute breather today. You're doing wonderful! 🌸
                </div>
              </div>
            </div>

            <div className="elderly-hero-image-wrap">
              <div 
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '30px',
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdfa 100%)',
                  border: '2px solid #bae6fd',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 28px rgba(2, 132, 199, 0.15)'
                }}
              >
                <ShieldCheck size={64} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Profile Completion Warning Banner */}
      {showBanner && (
        <div id="profile-completion-banner" className="alert alert-warning animate-fade-in" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '18px 22px',
          marginBottom: '28px',
          borderRadius: 'var(--radius-lg)',
          borderWidth: '2px'
        }}>
          <AlertTriangle size={28} style={{ color: 'var(--risk-mod-text)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--risk-mod-text)' }}>
              Please complete your health profile details
            </div>
            <div style={{ fontSize: '0.925rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Missing information: <strong>{missingItems.join(', ')}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              id="banner-complete-btn"
              onClick={() => setScreen(missingItems.includes('Emergency Contact') ? 'emergency-contacts' : missingItems.includes('Health Conditions') ? 'health' : 'profile')}
              className="btn btn-primary btn-sm"
              style={{ minHeight: '48px', padding: '10px 18px', fontWeight: 800 }}
            >
              <span>Complete Now</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={dismissBanner}
              className="btn btn-ghost btn-sm"
              aria-label="Dismiss banner"
              style={{ minHeight: '48px', padding: '10px', fontSize: '1.2rem', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Urgent Request Help Trigger Banner */}
      {!loading && (
        <section style={{ marginBottom: '24px' }}>
          <div className="card glass-card" style={{
            backgroundColor: activeHelpRequest && activeHelpRequest.status !== 'Resolved' ? '#fff1f2' : '#ffffff',
            border: activeHelpRequest && activeHelpRequest.status !== 'Resolved' ? '2px solid #fda4af' : '1px solid var(--border)',
            borderRadius: '20px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                backgroundColor: '#ffe4e6', color: '#e11d48',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.2)'
              }}>
                <ShieldAlert size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Need Immediate Assistance?
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  {activeHelpRequest && activeHelpRequest.status !== 'Resolved' ? (
                    <span style={{ color: '#be123c', fontWeight: 700 }}>
                      Help Request Active — Caregiver status: <strong>{activeHelpRequest.status}</strong>
                    </span>
                  ) : (
                    <span>Assigned Caregiver: <strong>{caregiver?.caregiver_name || 'Assigned Staff'}</strong></span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHelpModalOpen(true)}
              style={{
                backgroundColor: '#e11d48',
                color: '#ffffff',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 6px 18px rgba(225, 29, 72, 0.35)',
                minHeight: '52px'
              }}
            >
              <ShieldAlert size={22} />
              <span>REQUEST HELP</span>
            </button>
          </div>
        </section>
      )}

      {/* Today's Monitoring Section */}
      {!loading && (
        <section className="card glass-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '28px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Daily Senior Monitoring Workflow
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0' }}>
                Today's Monitoring
              </h2>
            </div>

            <div style={{
              padding: '8px 18px', borderRadius: '20px', fontSize: '0.88rem', fontWeight: 800,
              backgroundColor: dailyStatus?.overall_completed ? '#dcfce7' : '#fef3c7',
              color: dailyStatus?.overall_completed ? '#15803d' : '#b45309',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              {dailyStatus?.overall_completed ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{dailyStatus?.overall_completed ? "Today's monitoring completed" : `${dailyStatus?.items_remaining || 0} items remaining`}</span>
            </div>
          </div>

          {/* 3 Main Monitoring Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Checkin Item */}
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <HeartPulse size={22} color="var(--primary)" />
                <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '3px 8px', borderRadius: '10px', backgroundColor: dailyStatus?.checkin_completed ? '#dcfce7' : '#fee2e2', color: dailyStatus?.checkin_completed ? '#166534' : '#991b1b' }}>
                  {dailyStatus?.checkin_completed ? '✓ Completed' : '⏳ Pending'}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Daily Wellness Check-in</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {dailyStatus?.today_checkin?.mood ? `Mood: ${dailyStatus.today_checkin.mood}` : 'Not logged today'}
              </div>
            </div>

            {/* Blood Pressure Item */}
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Heart size={22} color="#e11d48" />
                <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '3px 8px', borderRadius: '10px', backgroundColor: dailyStatus?.bp_completed ? '#dcfce7' : '#fee2e2', color: dailyStatus?.bp_completed ? '#166534' : '#991b1b' }}>
                  {dailyStatus?.bp_completed ? '✓ Entered' : '⏳ Pending'}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Blood Pressure</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {dailyStatus?.today_vitals?.systolic ? `${dailyStatus.today_vitals.systolic} / ${dailyStatus.today_vitals.diastolic} mmHg` : 'Not entered'}
              </div>
            </div>

            {/* Oxygen Item */}
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Wind size={22} color="#0284c7" />
                <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '3px 8px', borderRadius: '10px', backgroundColor: dailyStatus?.oxygen_completed ? '#dcfce7' : '#fee2e2', color: dailyStatus?.oxygen_completed ? '#166534' : '#991b1b' }}>
                  {dailyStatus?.oxygen_completed ? '✓ Entered' : '⏳ Pending'}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Oxygen Level</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {dailyStatus?.today_vitals?.oxygen_saturation ? `${dailyStatus.today_vitals.oxygen_saturation} % SpO₂` : 'Not entered'}
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {!dailyStatus?.checkin_completed && (
                <button onClick={() => setScreen('checkin')} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
                  <HeartPulse size={16} />
                  <span>Start Check-In</span>
                </button>
              )}

              <button onClick={() => setIsVitalsModalOpen(true)} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
                <Activity size={16} />
                <span>{dailyStatus?.vitals_completed ? "Edit Today's Vitals" : "Enter Today's Vitals"}</span>
              </button>
            </div>

            <button onClick={() => setIsReportModalOpen(true)} className="btn btn-ghost btn-sm" style={{ fontWeight: 700, color: 'var(--primary)' }}>
              <FileText size={16} />
              <span>View Today's Report</span>
            </button>
          </div>
        </section>
      )}

      {/* Enhanced Wellness Status Strip */}
      {!loading && profile && (
        <section className="elderly-wellness-banner">
          <div className="elderly-wellness-left">
            <div 
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #e8f5e9 100%)',
                border: '2px solid #c8e6c9',
                color: '#2e7d32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(46, 125, 50, 0.1)',
                flexShrink: 0
              }}
            >
              <HeartPulse size={32} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-hover)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Your Health & Wellness Status
              </div>
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <WellnessRiskBadge riskLevel={profile.risk_level || 'Low'} size="lg" />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Evaluated based on your daily responses & vitals
              </div>
            </div>
          </div>

          <div>
            {todayCheckin?.completed ? (
              <div className="badge badge-risk-low" style={{ padding: '12px 22px', fontSize: '1rem', borderRadius: 'var(--radius-lg)', gap: '10px' }}>
                <CheckCircle2 size={22} style={{ color: '#16a34a' }} />
                <span style={{ fontWeight: 800 }}>Check-In Completed Today!</span>
              </div>
            ) : (
              <button
                id="quick-checkin-btn"
                onClick={() => setScreen('checkin')}
                className="btn btn-primary btn-lg animate-pulse"
                style={{ minHeight: '54px', fontWeight: 800, padding: '14px 26px', fontSize: '1.05rem', boxShadow: '0 8px 20px rgba(13, 148, 136, 0.3)' }}
              >
                <HeartPulse size={24} />
                <span>Start Today's Check-In</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Modals */}
      <DailyReminderModal
        isOpen={isReminderModalOpen}
        onClose={handleAcknowledgeReminder}
        pendingItems={dailyStatus?.pending_items || []}
        onCompleteNow={(target) => {
          if (target === 'checkin') {
            setScreen('checkin');
          } else if (target === 'vitals') {
            setIsVitalsModalOpen(true);
          } else if (!dailyStatus?.checkin_completed) {
            setScreen('checkin');
          } else {
            setIsVitalsModalOpen(true);
          }
        }}
      />

      <VitalsModal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        onVitalsSaved={loadHome}
        initialVitals={dailyStatus?.today_vitals}
      />

      <RequestHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onRequestSent={loadHome}
        assignedCaregiver={dailyStatus?.assigned_caregiver}
      />

      <DailyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={todayReport}
      />

      <VoiceCheckInModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyCheckIn={(data) => {
          console.log('Voice checkin data applied:', data);
          setScreen('checkin');
        }}
      />

      <MedPassModal
        isOpen={isMedPassModalOpen}
        onClose={() => setIsMedPassModalOpen(false)}
        elderlyData={{ profile, healthInfo, contacts }}
      />

      {loading && <LoadingState message="Loading your care dashboard..." size="lg" />}

      {/* Standout Innovations Quick Trigger Bar */}
      {!loading && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '24px' }}>
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="pastel-card pastel-card-lavender"
            style={{
              padding: '18px 24px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#7c3aed', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={26} />
            </div>
            <div>
              <span className="pastel-badge pastel-badge-lavender" style={{ fontSize: '0.72rem', padding: '2px 8px', marginBottom: '4px' }}>
                AI VOICE & CARE COMPANION
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4c1d95', margin: 0 }}>
                Chat with Joy AI Assistant 🎙️
              </h3>
            </div>
          </button>

          <button
            onClick={() => setIsMedPassModalOpen(true)}
            className="pastel-card pastel-card-rose"
            style={{
              padding: '18px 24px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e11d48', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={26} />
            </div>
            <div>
              <span className="pastel-badge pastel-badge-rose" style={{ fontSize: '0.72rem', padding: '2px 8px', marginBottom: '4px' }}>
                PARAMEDIC & SOS
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#9f1239', margin: 0 }}>
                MedPass Passport 🪪
              </h3>
            </div>
          </button>
        </section>
      )}

      {/* Standout Innovations: Smart Pill Companion & VitalsGuard Chart */}
      {!loading && (
        <>
          <SmartPillCompanion />
          <VitalsGuardChart />
        </>
      )}

      {/* Quick Summary Highlights */}
      {!loading && (
        <section className="elderly-stats-grid">
          <div className="elderly-stat-card" onClick={() => setScreen('medications')}>
            <div className="elderly-stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Pill size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 700 }}>Medications</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                Schedule & Prescriptions
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-light)' }} />
          </div>

          <div className="elderly-stat-card" onClick={() => setScreen('caregiver')}>
            <div className="elderly-stat-icon" style={{ background: '#f0fdf4', color: '#059669' }}>
              <UserCheck size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 700 }}>Caregiver Team</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                {caregiver ? caregiver.full_name || 'Caregiver Assigned' : 'Care Team Active'}
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-light)' }} />
          </div>

          <div className="elderly-stat-card" onClick={() => setScreen('notifications')}>
            <div className="elderly-stat-icon" style={{ background: '#eff6ff', color: '#2563eb', position: 'relative' }}>
              <Bell size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 700 }}>Messages</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                {notificationCount > 0 ? `${notificationCount} New Alert${notificationCount > 1 ? 's' : ''}` : 'No New Messages'}
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-light)' }} />
          </div>
        </section>
      )}

      {/* Main Feature Tiles */}
      {!loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2 style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '0.2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
              <span>Main Care Options</span>
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tap any card to view details</span>
          </div>

          <div className="elderly-tile-grid">
            {MAIN_TILES.map(tile => (
              <FeatureTile
                key={tile.id}
                tile={tile}
                badge={tile.id === 'notifications' && notificationCount > 0 ? notificationCount : null}
                onPress={() => setScreen(tile.id)}
              />
            ))}
          </div>

          {/* More Options */}
          <div style={{ marginBottom: '16px', marginTop: '12px' }}>
            <h2 style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '0.2px'
            }}>
              Additional Services & Info
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '32px' }}>
            {MORE_TILES.map(tile => (
              <MoreTile key={tile.id} tile={tile} onPress={() => setScreen(tile.id)} />
            ))}
          </div>
        </>
      )}

        {/* Global Floating AI Voice Assistant Trigger */}
        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="floating-ai-trigger"
          aria-label="Talk to Joy AI Assistant"
        >
          <Sparkles size={20} />
          <span>Talk to Joy 🎙️</span>
        </button>
        </div>
      </div>
    );
  };


// ─── Tile Definitions ─────────────────────────────────────────────────────────

const MAIN_TILES = [
  { 
    id: 'checkin',            
    label: "Today's Check-In",    
    desc: "Track daily mood & wellness status",
    emoji: '❤️',  
    color: '#0d9488', 
    bg: '#f0fdfa', 
    border: '#99f6e4' 
  },
  { 
    id: 'profile',            
    label: 'My Profile',          
    desc: 'View & update personal profile',
    emoji: '👤',  
    color: '#7c3aed', 
    bg: '#f5f3ff', 
    border: '#ddd6fe' 
  },
  { 
    id: 'medications',        
    label: 'My Medicines',        
    desc: 'Daily prescription dosages & times',
    emoji: '💊',  
    color: '#d97706', 
    bg: '#fffbeb', 
    border: '#fde68a' 
  },
  { 
    id: 'emergency-contacts', 
    label: 'Emergency Contacts',  
    desc: 'Instant emergency & guardian calls',
    emoji: '🚑',  
    color: '#dc2626', 
    bg: '#fef2f2', 
    border: '#fecaca' 
  },
  { 
    id: 'doctor',             
    label: 'My Doctor',           
    desc: 'Primary care physician details',
    emoji: '🩺',  
    color: '#059669', 
    bg: '#f0fdf4', 
    border: '#bbf7d0' 
  },
  { 
    id: 'notifications',      
    label: 'My Messages',         
    desc: 'Alerts, updates & caregiver notes',
    emoji: '🔔',  
    color: '#2563eb', 
    bg: '#eff6ff', 
    border: '#bfdbfe' 
  },
];

const MORE_TILES = [
  { id: 'health',           label: 'Health Info',       emoji: '🏥', desc: 'Medical history' },
  { id: 'hospital',         label: 'Hospital Info',     emoji: '🏨', desc: 'Nearby facilities' },
  { id: 'caregiver',        label: 'My Caregiver',      emoji: '👩‍⚕️', desc: 'Care team contact' },
  { id: 'wellness-history', label: 'Wellness History',  emoji: '📊', desc: 'Past check-in records' },
  { id: 'settings',         label: 'Settings',          emoji: '⚙️', desc: 'App preferences' },
];

// ─── Tile Components ──────────────────────────────────────────────────────────

const FeatureTile = ({ tile, badge, onPress }) => {
  return (
    <button
      id={`tile-${tile.id}`}
      onClick={onPress}
      className="elderly-tile"
      style={{
        '--tile-color': tile.color,
        borderColor: tile.border || 'var(--border)'
      }}
      aria-label={`${tile.label} - ${tile.desc}`}
    >
      {badge && (
        <span className="badge badge-alert-new" style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          fontSize: '0.825rem',
          fontWeight: 900,
          padding: '4px 10px',
          boxShadow: '0 2px 6px rgba(194, 65, 12, 0.2)'
        }}>
          {badge > 9 ? '9+' : badge} New
        </span>
      )}

      <div className="elderly-tile-header">
        <div className="elderly-tile-icon-wrap" style={{ backgroundColor: tile.bg, color: tile.color }}>
          {tile.emoji}
        </div>
        <ChevronRight size={20} style={{ color: 'var(--text-light)', opacity: 0.7 }} />
      </div>

      <div>
        <div className="elderly-tile-title">{tile.label}</div>
        <div className="elderly-tile-desc">{tile.desc}</div>
      </div>
    </button>
  );
};

const MoreTile = ({ tile, onPress }) => {
  return (
    <button
      id={`more-tile-${tile.id}`}
      onClick={onPress}
      className="card card-hover"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--border)',
        minHeight: '56px',
        width: '100%',
        textAlign: 'left'
      }}
    >
      <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{tile.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: '0.975rem', color: 'var(--text-main)' }}>{tile.label}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tile.desc}</div>
      </div>
    </button>
  );
};

export default ElderlyDashboard;

