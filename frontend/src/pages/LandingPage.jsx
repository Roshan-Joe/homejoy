import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Activity, 
  Shield, 
  Check, 
  ArrowRight, 
  Clock, 
  Pill, 
  Bell, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  PhoneCall, 
  Play
} from 'lucide-react';

import newCaregiverImg from '../assets/homejoy_new_caregiver.png';
import newSeniorLivingImg from '../assets/homejoy_new_senior_living.png';
import newAppPreviewImg from '../assets/homejoy_new_app_preview.png';

export const LandingPage = ({ onRequestQuote, isQuoteModalOpen, setIsQuoteModalOpen }) => {
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
    <div className="landing-container" style={{
      backgroundColor: '#f7f9f8',
      color: '#0b1f28',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      minHeight: '100vh'
    }}>
      
      {/* HERO SECTION */}
      <section style={{
        padding: '60px 0 80px 0',
        background: 'radial-gradient(circle at 10% 20%, rgba(220, 245, 238, 0.4) 0%, rgba(247, 249, 248, 1) 80%)'
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center'
        }}>
          {/* Left Column: Hero Copy */}
          <div>
            {/* Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#e6f4f1',
              border: '1px solid #b2e0d8',
              borderRadius: '9999px',
              padding: '6px 16px',
              marginBottom: '24px'
            }}>
              <Activity size={16} style={{ color: '#00685b' }} />
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#00685b',
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}>
                CALM CARE, CLEARER DAYS
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: '#0b1f28',
              marginBottom: '20px'
            }}>
              Daily wellness care that keeps everyone <span style={{ color: '#00685b' }}>in the picture.</span>
            </h1>

            <p style={{
              fontSize: '1.15rem',
              lineHeight: 1.6,
              color: '#4a6068',
              marginBottom: '32px',
              maxWidth: '540px'
            }}>
              One gentle check-in turns everyday signals into a clear wellness picture for older people, families and care teams.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
              <Link to="/register" style={{
                backgroundColor: '#00685b',
                color: '#ffffff',
                fontSize: '1.05rem',
                fontWeight: 700,
                padding: '14px 28px',
                borderRadius: '9999px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(0, 104, 91, 0.28)',
                transition: 'all 0.2s'
              }}>
                <span>Start with HomeJoy</span>
                <ArrowRight size={18} />
              </Link>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.92rem',
                fontWeight: 600,
                color: '#4a6068'
              }}>
                <Shield size={18} style={{ color: '#00685b' }} />
                <span>Private by design</span>
              </div>
            </div>

            {/* Micro Feature Bullets */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: '#0b1f28'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} style={{ color: '#00685b' }} />
                <span>One-minute check-in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} style={{ color: '#00685b' }} />
                <span>Personal baseline</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} style={{ color: '#00685b' }} />
                <span>Clear care alerts</span>
              </div>
            </div>

            {/* Quick Role Portal Links */}
            <div style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4a6068', textTransform: 'uppercase', letterSpacing: '0.04em', width: '100%', marginBottom: '4px' }}>
                Explore Portals
              </span>
              <Link to="/login" style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#0b1f28',
                textDecoration: 'none'
              }}>
                👵 Elderly Portal
              </Link>
              <Link to="/login" style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#0b1f28',
                textDecoration: 'none'
              }}>
                👩‍⚕️ Caregiver Triage
              </Link>
              <Link to="/login" style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#0b1f28',
                textDecoration: 'none'
              }}>
                🩺 Admin Console
              </Link>
            </div>
          </div>

          {/* Right Column: Reference Style Interactive Mockup Card */}
          <div style={{ position: 'relative' }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '28px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 40px -10px rgba(0, 50, 40, 0.08), 0 2px 6px rgba(0, 0, 0, 0.02)'
            }}>
              {/* Card Window Top Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                paddingBottom: '14px',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f87171' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fbbf24' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#34d399' }} />
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4a6068', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  TODAY · 08:42
                </span>
              </div>

              {/* Resident Greeting Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '24px'
              }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#4a6068', fontWeight: 500 }}>Good morning, Anita</div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0b1f28', marginTop: '2px' }}>
                    Your daily picture
                  </h3>
                </div>

                <div style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em'
                }}>
                  LOW RISK
                </div>
              </div>

              {/* 3 Metric Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0b1f28' }}>124/78</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4a6068', marginTop: '4px' }}>Blood pressure</div>
                </div>

                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0b1f28' }}>98%</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4a6068', marginTop: '4px' }}>Oxygen</div>
                </div>

                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0b1f28' }}>3/3</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4a6068', marginTop: '4px' }}>Medicines</div>
                </div>
              </div>

              {/* Check-in Banner */}
              <div style={{
                backgroundColor: '#00685b',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '18px 20px'
              }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '4px' }}>Check-in complete</div>
                <div style={{ fontSize: '0.84rem', opacity: 0.9, lineHeight: 1.4 }}>
                  Sleep and appetite match your usual pattern.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID SECTION: "THE RIGHT SIGNAL, FOR THE RIGHT PERSON" */}
      <section id="features" style={{ padding: '80px 0', backgroundColor: '#ffffff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#e6f4f1',
              border: '1px solid #b2e0d8',
              borderRadius: '9999px',
              padding: '6px 16px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00685b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ONE CONNECTED CARE RHYTHM
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: '#0b1f28', letterSpacing: '-0.02em' }}>
              The right signal, for the right person.
            </h2>
          </div>

          {/* 6 Feature Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* Card 1 */}
            <div style={{
              backgroundColor: '#f7f9f8',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#e6f4f1',
                    color: '#00685b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle2 size={22} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>01</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0b1f28', marginBottom: '10px' }}>
                  A one-minute check-in
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#4a6068', lineHeight: 1.6 }}>
                  Six friendly questions about sleep, appetite, movement, mood, medicines and pain. Big buttons, no typing needed.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div style={{
              backgroundColor: '#f7f9f8',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#e6f4f1',
                    color: '#00685b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Activity size={22} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>02</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0b1f28', marginBottom: '10px' }}>
                  Blood pressure & oxygen
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#4a6068', lineHeight: 1.6 }}>
                  Simple entry for readings taken at home. Today's numbers stay visible for the person and their caregiver.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div style={{
              backgroundColor: '#f7f9f8',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#e6f4f1',
                    color: '#00685b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Heart size={22} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>03</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0b1f28', marginBottom: '10px' }}>
                  Wellness risk indicator
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#4a6068', lineHeight: 1.6 }}>
                  Each person is compared with their own usual pattern — never with other people — and the reasons are always shown.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div style={{
              backgroundColor: '#f7f9f8',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#e6f4f1',
                    color: '#00685b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Bell size={22} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>04</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0b1f28', marginBottom: '10px' }}>
                  Help at one press
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#4a6068', lineHeight: 1.6 }}>
                  A large Request Help button reaches only the assigned caregiver, who sees it immediately.
                </p>
              </div>
            </div>

            {/* Card 5 */}
            <div style={{
              backgroundColor: '#f7f9f8',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#e6f4f1',
                    color: '#00685b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users size={22} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>05</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0b1f28', marginBottom: '10px' }}>
                  Everyone in their own lane
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#4a6068', lineHeight: 1.6 }}>
                  Caregivers see only the residents assigned to them, while guardians receive comprehensive daily reports. Admin manages all permissions.
                </p>
              </div>
            </div>

            {/* Card 6 */}
            <div style={{
              backgroundColor: '#f7f9f8',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#e6f4f1',
                    color: '#00685b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ShieldCheck size={22} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>06</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0b1f28', marginBottom: '10px' }}>
                  Careful by design
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#4a6068', lineHeight: 1.6 }}>
                  Missing information is shown as missing, never assumed to be fine. HomeJoy supports decisions, it does not diagnose.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & CONSULTATION SECTION */}
      <section style={{ padding: '80px 0', backgroundColor: '#f7f9f8', borderTop: '1px solid #e2e8f0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'center'
          }}>
            {/* Contact Form */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '32px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 30px -5px rgba(0,0,0,0.04)'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00685b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                GET IN TOUCH
              </span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0b1f28', margin: '6px 0 20px 0' }}>
                Send Us a Message
              </h3>

              {contactSubmitted ? (
                <div style={{ padding: '20px', backgroundColor: '#dcfce7', borderRadius: '12px', color: '#15803d', fontWeight: 700 }}>
                  <CheckCircle2 size={24} style={{ marginBottom: '8px' }} />
                  Thank you! Your message has been sent successfully.
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.95rem',
                      outline: 'none',
                      backgroundColor: '#f8fafc'
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.95rem',
                      outline: 'none',
                      backgroundColor: '#f8fafc'
                    }}
                  />
                  <textarea
                    rows={3}
                    placeholder="How can we help you?"
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.95rem',
                      outline: 'none',
                      backgroundColor: '#f8fafc'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#00685b',
                      color: '#ffffff',
                      fontWeight: 700,
                      padding: '12px 24px',
                      borderRadius: '9999px',
                      fontSize: '0.95rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>

            {/* Media Image & App Overview */}
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00685b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SENIOR LIVING & COMMUNITY
              </span>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0b1f28', margin: '6px 0 16px 0' }}>
                A Reassuring Environment for Everyone
              </h2>
              <p style={{ fontSize: '1rem', color: '#4a6068', lineHeight: 1.6, marginBottom: '24px' }}>
                Promoting independence, daily wellness connection, and peace of mind for families across every stage of care.
              </p>
              <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}>
                <img src={newAppPreviewImg} alt="Senior woman using HomeJoy" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER DISCLAIMER */}
      <footer id="disclaimer" style={{
        padding: '32px 0',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        fontSize: '0.88rem',
        color: '#4a6068',
        textAlign: 'center'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Shield size={16} style={{ color: '#00685b', flexShrink: 0 }} />
          <span>HomeJoy supports wellness decisions. It does not diagnose illness or replace medical advice.</span>
        </div>
      </footer>

      {/* REQUEST QUOTE MODAL */}
      {isQuoteModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 31, 40, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setIsQuoteModalOpen(false)}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsQuoteModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                border: 'none',
                background: '#f1f5f9',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0b1f28', marginBottom: '16px' }}>
              Request Care Consultation
            </h3>

            {quoteSubmitted ? (
              <div style={{ padding: '20px', backgroundColor: '#dcfce7', borderRadius: '12px', color: '#15803d', fontWeight: 700, textAlign: 'center' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px' }} />
                Your request has been received! We will be in touch shortly.
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={quoteForm.name}
                  onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={quoteForm.email}
                  onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                />
                <select
                  value={quoteForm.careType}
                  onChange={(e) => setQuoteForm({ ...quoteForm, careType: e.target.value })}
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                >
                  <option value="residential">Residential Elder Care</option>
                  <option value="emergency">Emergency Risk Triage</option>
                  <option value="medication">Medication & Vital Tracking</option>
                </select>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#00685b',
                    color: '#ffffff',
                    fontWeight: 700,
                    padding: '12px',
                    borderRadius: '9999px',
                    border: 'none',
                    marginTop: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Submit Request
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
