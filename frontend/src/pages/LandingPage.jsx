import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartPulse, 
  PhoneCall, 
  Check, 
  Play, 
  X, 
  ShieldCheck, 
  HeartHandshake, 
  Smile, 
  Clock, 
  Pill, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  Users, 
  BrainCircuit, 
  Activity,
  Bed,
  Home,
  Shield,
  Send,
  CheckCircle2,
  ChevronLeft,
  Lock,
  FileText
} from 'lucide-react';

import newHeroImg from '../assets/homejoy_new_hero.png';
import newCaregiverImg from '../assets/homejoy_new_caregiver.png';
import newSeniorLivingImg from '../assets/homejoy_new_senior_living.png';
import newAppPreviewImg from '../assets/homejoy_new_app_preview.png';

export const LandingPage = ({ onRequestQuote, isQuoteModalOpen, setIsQuoteModalOpen }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTheme, setActiveTheme] = useState('coral');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [quoteForm, setQuoteForm] = useState({
    name: '',
    email: '',
    phone: '',
    careType: 'residential',
    message: ''
  });
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-carer-theme', activeTheme);
  }, [activeTheme]);

  const slides = [
    {
      title: "Daily Wellness Monitoring & Early Risk Triage for Seniors",
      sub: "HomeJoy connects elderly residents, caregivers, and doctors in one simple, reassuring system. Early detection helps care teams respond before minor symptoms become health emergencies.",
      tag: "COMPASSIONATE SENIOR CARE & MONITORING",
      img: newHeroImg
    },
    {
      title: "Reassuring Support for Seniors, Actionable Triage for Care Teams",
      sub: "Track daily check-ins, vital signs, medication schedules, and machine learning risk predictions with clear, accessible controls for every user role.",
      tag: "AI-BASED ELDERLY WELLNESS SYSTEM",
      img: newSeniorLivingImg
    }
  ];

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', phone: '', message: '' });
    }, 4000);
  };

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    setQuoteSubmitted(true);
    setTimeout(() => {
      setQuoteSubmitted(false);
      setIsQuoteModalOpen(false);
      setQuoteForm({ name: '', email: '', phone: '', careType: 'residential', message: '' });
    }, 3000);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Floating Theme Palette Switcher */}
      <div className="carer-floating-palette" title="Try color themes">
        <span className="carer-palette-title">COLOR PALETTE</span>
        <button className="carer-color-dot" style={{ background: '#f05654' }} onClick={() => setActiveTheme('coral')} title="Coral Red Theme" />
        <button className="carer-color-dot" style={{ background: '#0d9488' }} onClick={() => setActiveTheme('teal')} title="Emerald Teal Theme" />
        <button className="carer-color-dot" style={{ background: '#1e293b' }} onClick={() => setActiveTheme('navy')} title="Deep Navy Theme" />
        <button className="carer-color-dot" style={{ background: '#f97316' }} onClick={() => setActiveTheme('orange')} title="Sunset Orange Theme" />
        <button className="carer-color-dot" style={{ background: '#16a34a' }} onClick={() => setActiveTheme('green')} title="Fresh Green Theme" />
      </div>

      {/* HERO SECTION WITH NEW HERO BACKGROUND */}
      <section className="carer-hero-slider" style={{ backgroundImage: `url(${slides[activeSlide].img})` }}>
        <div className="carer-hero-overlay" />
        <div className="carer-triangle-bg" />

        <button className="carer-slider-arrow left" onClick={handlePrevSlide} aria-label="Previous Slide">
          <ChevronLeft size={24} />
        </button>
        <button className="carer-slider-arrow right" onClick={handleNextSlide} aria-label="Next Slide">
          <ChevronRight size={24} />
        </button>

        <div className="carer-hero-content">
          <span className="carer-subtitle-tag underlined" style={{ color: '#ffffff', fontSize: '0.95rem' }}>
            {slides[activeSlide].tag}
          </span>

          <h1 className="carer-hero-title">
            {slides[activeSlide].title}
          </h1>

          <p className="carer-hero-sub">
            {slides[activeSlide].sub}
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/register" className="carer-btn-coral">
              <span>REGISTER NOW</span>
            </Link>

            <Link to="/login" className="btn btn-secondary btn-lg" style={{ borderRadius: '4px', padding: '14px 28px', fontWeight: 800, background: '#ffffff', color: '#0f172a' }}>
              <span>SIGN IN TO PORTAL</span>
            </Link>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginLeft: '12px' }}>
              <Link to="/login" className="badge badge-role-elderly" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700 }}>
                👵 Elderly Portal
              </Link>
              <Link to="/login" className="badge badge-role-caregiver" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700 }}>
                👩‍⚕️ Caregiver Triage
              </Link>
              <Link to="/login" className="badge badge-role-admin" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700 }}>
                🩺 Doctor Console
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="carer-section-padding" style={{ background: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="carer-subtitle-tag">HOW HOMEJOY WORKS</span>
          <h2 className="carer-heading-main" style={{ margin: '0 auto', maxWidth: '720px' }}>
            Designed for the Real People in the Care Circle
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '640px', margin: '12px auto 0' }}>
            Whether you are a senior logging how you feel, a caregiver prioritizing your shift, or an administrator coordinating care.
          </p>
        </div>

        <div className="carer-grid-2col" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {/* For Elderly */}
          <div className="card" style={{ padding: '32px 28px', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0fdfa', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Smile size={28} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              For Seniors & Elderly Clients
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '18px' }}>
              Complete a simple 1-minute morning check-in on a screen built with large buttons and clear text. Record your mood, sleep quality, pain level, and appetite without tech stress.
            </p>
            <ul className="carer-checklist" style={{ margin: 0 }}>
              <li className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> 1-Tap daily health check-in</li>
              <li className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Medication schedule alarms</li>
              <li className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Emergency dial to assigned caregiver</li>
            </ul>
          </div>

          {/* For Caregivers */}
          <div className="card" style={{ padding: '32px 28px', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <HeartHandshake size={28} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              For Caregivers & Nurses
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '18px' }}>
              See a prioritized list of assigned residents flagged with High, Moderate, or Low wellness risk. Focus your time where care is needed most and log shift notes instantly.
            </p>
            <ul className="carer-checklist" style={{ margin: 0 }}>
              <li className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Priority risk badges (High / Moderate)</li>
              <li className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Resident check-in history timeline</li>
              <li className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Direct doctor assignment links</li>
            </ul>
          </div>

          {/* For Admins & Doctors */}
          <div className="card" style={{ padding: '32px 28px', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <ShieldCheck size={28} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              For Admins & Physicians
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '18px' }}>
              Manage resident-caregiver pairings, assign primary physicians, monitor facility-wide health analytics, and control user roles with complete data security.
            </p>
            <ul className="carer-checklist" style={{ margin: 0 }}>
              <li className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Resident & Caregiver pairing tools</li>
              <li className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Role permission management</li>
              <li className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Facility-wide wellness trends</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION WITH NEW CAREGIVER IMAGE */}
      <section id="services-section" className="carer-section-padding" style={{ background: '#f8fafc' }}>
        <div className="carer-grid-2col">
          <div>
            <span className="carer-subtitle-tag">SERVICES OVERVIEW</span>
            <h2 className="carer-heading-main">
              Everything Needed for Early Detection and Daily Care
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.02rem', lineHeight: 1.6, marginBottom: '24px' }}>
              HomeJoy brings together daily health questions, prescription reminders, AI risk models, and direct caregiver communication into a unified platform.
            </p>

            <div className="carer-feature-boxes">
              <div className="carer-service-box">
                <div className="carer-box-icon"><Bed size={24} /></div>
                <div>
                  <div className="carer-box-title">Daily Wellness Log</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Mood, Pain, Sleep, Appetite</div>
                </div>
              </div>
              <div className="carer-service-box">
                <div className="carer-box-icon"><PhoneCall size={24} /></div>
                <div>
                  <div className="carer-box-title">24/7 Care Escalation</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Instant SOS Alert Trigger</div>
                </div>
              </div>
            </div>

            <div className="carer-progress-wrapper">
              <div className="carer-progress-header">
                <span>Senior Residence Satisfaction</span>
                <span>86%</span>
              </div>
              <div className="carer-progress-track">
                <div className="carer-progress-fill" style={{ width: '86%' }} />
              </div>
            </div>

            <ul className="carer-checklist">
              <li className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Supporting Seniors with Compassion and Expertise</li>
              <li className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Actionable Risk Triage for Care Coordinators</li>
            </ul>

            <a href="#about-section" className="carer-btn-coral">READ MORE</a>
          </div>

          <div className="carer-media-stack">
            <img src={newCaregiverImg} alt="Nurse checking vital signs on tablet with senior" className="carer-media-main-img" style={{ borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }} />
            <button className="carer-video-play-btn" onClick={() => setIsVideoModalOpen(true)} aria-label="Play Overview Video">
              <Play size={28} style={{ marginLeft: '4px', fill: 'currentColor' }} />
            </button>
          </div>
        </div>
      </section>

      {/* ABOUT & TRUST SECTION WITH NEW SENIOR LIVING IMAGE */}
      <section id="about-section" style={{ background: '#ffffff', padding: '80px 0', position: 'relative' }}>
        <div className="carer-section-padding" style={{ padding: 0 }}>
          <div className="carer-grid-2col">
            <div className="carer-media-stack">
              <img src={newSeniorLivingImg} alt="Senior couple in sunlit garden" className="carer-media-main-img" style={{ borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }} />
            </div>

            <div>
              <span className="carer-subtitle-tag">DATA PRIVACY & CLINICAL TRUST</span>
              <h2 className="carer-heading-main">
                Built on Trust, Privacy, and Responsible Data Handling
              </h2>

              <p style={{ color: '#64748b', fontSize: '1.02rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Health information demands strict confidentiality. HomeJoy enforces role-based authorization to ensure seniors, family members, caregivers, and physicians only access data relevant to their role.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div className="carer-check-item"><div className="carer-check-icon"><Lock size={14} /></div> Role-based data access</div>
                <div className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Encrypted health check-ins</div>
                <div className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Audit-ready caregiver logs</div>
                <div className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Non-diagnostic AI risk triage</div>
                <div className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> 24/7 Emergency Dialing</div>
                <div className="carer-check-item"><div className="carer-check-icon"><Check size={14} /></div> Direct Doctor Escalations</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <a href="#contact-section" className="carer-btn-coral">CONTACT CARE TEAM</a>
                <div className="carer-founder-spotlight">
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--carer-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>JM</div>
                  <div>
                    <div className="carer-founder-name">Jon Martin</div>
                    <div className="carer-founder-role">Co-Founder & Care Lead</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & GET IN TOUCH WITH NEW APP PREVIEW IMAGE */}
      <section id="contact-section" className="carer-contact-section-bg">
        <div className="carer-section-padding" style={{ padding: 0 }}>
          <div className="carer-grid-2col">
            <div className="carer-contact-card">
              <span className="carer-subtitle-tag">GET IN TOUCH</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '24px' }}>
                Write Email
              </h3>

              {contactSubmitted ? (
                <div style={{ padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#16a34a', fontWeight: 700 }}>
                  <CheckCircle2 size={24} style={{ marginBottom: '8px' }} />
                  Thank you! Your message has been sent successfully. Our care team will respond shortly.
                </div>
              ) : (
                <form onSubmit={handleContactSubmit}>
                  <div className="carer-form-group">
                    <input type="text" className="carer-input-field" placeholder="Your Name" required value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
                  </div>
                  <div className="carer-form-group">
                    <input type="email" className="carer-input-field" placeholder="Email Address" required value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
                  </div>
                  <div className="carer-form-group">
                    <input type="tel" className="carer-input-field" placeholder="Phone Number" required value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                  </div>
                  <div className="carer-form-group">
                    <textarea className="carer-input-field" rows="4" placeholder="Write a Message" required value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
                  </div>
                  <button type="submit" className="carer-btn-coral" style={{ width: '100%', borderRadius: '8px' }}>
                    SEND A MESSAGE
                  </button>
                </form>
              )}
            </div>

            <div>
              <span className="carer-subtitle-tag">SENIOR CARE EXPERIENCE</span>
              <h2 className="carer-heading-main">A Reassuring Home Environment</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', margin: '32px 0' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div className="carer-box-icon" style={{ width: '56px', height: '56px' }}><Shield size={28} /></div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>Safety & Security Assurance</h3>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>Continuous AI risk tracking and verified check-in dispatching for complete senior safety.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div className="carer-box-icon" style={{ width: '56px', height: '56px' }}><Home size={28} /></div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>Comfortable Independent Living</h3>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>Promoting resident autonomy, daily wellness engagement, and connection with loved ones.</p>
                  </div>
                </div>
              </div>

              <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' }}>
                <img src={newAppPreviewImg} alt="Senior woman and caregiver using smartphone app" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO OVERVIEW MODAL */}
      {isVideoModalOpen && (
        <div className="carer-modal-backdrop" onClick={() => setIsVideoModalOpen(false)}>
          <div className="carer-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="carer-modal-close" onClick={() => setIsVideoModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
              HomeJoy Platform Overview
            </h3>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', background: '#0f172a', marginBottom: '20px' }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                title="HomeJoy Demonstration"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              See how HomeJoy unifies daily health check-ins, caregiver triage, and clinical escalation to protect elderly health every day.
            </p>
          </div>
        </div>
      )}

      {/* REQUEST QUOTE MODAL */}
      {isQuoteModalOpen && (
        <div className="carer-modal-backdrop" onClick={() => setIsQuoteModalOpen(false)}>
          <div className="carer-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="carer-modal-close" onClick={() => setIsQuoteModalOpen(false)}>
              <X size={20} />
            </button>
            <span className="carer-subtitle-tag">FREE CARE CONSULTATION</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
              Request A Care Quote
            </h3>

            {quoteSubmitted ? (
              <div style={{ padding: '24px', background: '#f0fdf4', borderRadius: '12px', color: '#16a34a', fontWeight: 700, textAlign: 'center' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 12px' }} />
                Your request has been received! A care coordinator will contact you shortly.
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit}>
                <div className="carer-form-group">
                  <input type="text" className="carer-input-field" placeholder="Full Name" required value={quoteForm.name} onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })} />
                </div>
                <div className="carer-form-group">
                  <input type="email" className="carer-input-field" placeholder="Email Address" required value={quoteForm.email} onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })} />
                </div>
                <div className="carer-form-group">
                  <input type="tel" className="carer-input-field" placeholder="Phone Number" required value={quoteForm.phone} onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })} />
                </div>
                <div className="carer-form-group">
                  <select className="carer-input-field" value={quoteForm.careType} onChange={(e) => setQuoteForm({ ...quoteForm, careType: e.target.value })}>
                    <option value="residential">Residential Elder Care</option>
                    <option value="emergency">24/7 Emergency Risk Triage</option>
                    <option value="medication">Medication & Vital Tracking</option>
                    <option value="physician">On-Site Physician Services</option>
                  </select>
                </div>
                <div className="carer-form-group">
                  <textarea className="carer-input-field" rows="3" placeholder="Describe your care needs..." value={quoteForm.message} onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })} />
                </div>
                <button type="submit" className="carer-btn-coral" style={{ width: '100%', borderRadius: '8px' }}>
                  SUBMIT QUOTE REQUEST
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;

