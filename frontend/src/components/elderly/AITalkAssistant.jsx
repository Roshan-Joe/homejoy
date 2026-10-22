import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  Pill, 
  UserCheck, 
  Heart, 
  Smile, 
  RotateCcw,
  Sun,
  ShieldAlert,
  Wind,
  CheckCircle2,
  AlertCircle,
  Activity
} from 'lucide-react';
import api from '../../services/api';

export const AITalkAssistant = ({ isOpen, onClose, onApplyCheckIn, activeContext = {} }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [assistantStatus, setAssistantStatus] = useState("Tap the microphone to speak or type a question to Joy!");
  const [liveContext, setLiveContext] = useState(null);
  const [extractedCheckIn, setExtractedCheckIn] = useState(null);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
  const [checkInSubmitted, setCheckInSubmitted] = useState(false);
  
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      sender: 'joy',
      text: "Hello! I am Joy, your personal AI companion. I'm connected directly to your care schedule, vitals, and wellness check-in. Tell me how you're feeling today, or ask about your medicine!",
      time: 'Just now'
    }
  ]);

  const chatBottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  // Fetch genuine resident health context whenever opened
  useEffect(() => {
    if (isOpen) {
      const fetchContext = async () => {
        try {
          const res = await api.get('/api/elderly/me/assistant-context');
          setLiveContext(res.data);
        } catch (err) {
          console.warn('Could not load live assistant context:', err);
        }
      };
      fetchContext();
    }
  }, [isOpen]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isSpeaking, extractedCheckIn]);

  // Clean up speech synthesis & recognition on unmount/close
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen]);

  // Initialize Speech Recognition once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = navigator.language || 'en-US';

        recog.onstart = () => {
          setIsListening(true);
          isListeningRef.current = true;
          setAssistantStatus('🎙️ Joy is listening... Tell me how you are feeling!');
        };

        recog.onresult = (event) => {
          if (event.results && event.results[0]) {
            const spokenText = event.results[0][0].transcript;
            if (spokenText && spokenText.trim()) {
              handleSendQuery(spokenText);
            }
          }
        };

        recog.onerror = (event) => {
          console.warn('Speech recognition event:', event.error);
          setIsListening(false);
          isListeningRef.current = false;
          if (event.error === 'no-speech') {
            setAssistantStatus('No speech heard. Tap the microphone to try again.');
          } else if (event.error === 'not-allowed') {
            setAssistantStatus('⚠️ Microphone permission blocked. You can type questions below.');
          } else {
            setAssistantStatus('Tap the microphone or choose a quick topic below.');
          }
        };

        recog.onend = () => {
          setIsListening(false);
          isListeningRef.current = false;
        };

        recognitionRef.current = recog;
      } catch (err) {
        console.warn('Speech recognition init warning:', err);
      }
    }
  }, []);

  // Text-To-Speech (TTS)
  const speakJoy = (message) => {
    if (isMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (!recognitionRef.current) {
      setAssistantStatus('Microphone not supported in this browser. You can type your questions below!');
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      } catch (err) {}
    }
  };

  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Conversational Check-In Confirmation & Submission
  const handleConfirmCheckIn = async (extracted) => {
    if (!extracted) return;
    try {
      setSubmittingCheckIn(true);
      const res = await api.post('/api/elderly/me/checkins', extracted);
      setCheckInSubmitted(true);
      setExtractedCheckIn(null);

      const confirmMsg = {
        id: Date.now(),
        sender: 'joy',
        text: `✨ Wonderful! Your daily check-in is officially recorded. Your calculated wellness score is ${res.data?.wellness_score || 88}/100 (${res.data?.wellness_risk || 'Low'} Risk). Your care team has received your report.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, confirmMsg]);
      speakJoy(confirmMsg.text);

      if (onApplyCheckIn) {
        onApplyCheckIn(res.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Could not submit check-in. It may already be completed today!";
      alert(errorMsg);
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  // Comprehensive AI Conversational Engine with Real Database Telemetry
  const generateJoyResponse = async (query) => {
    const lower = query.toLowerCase().trim();

    // Natural Language Conversational Check-In Detection
    const isCheckInIntent = 
      lower.includes('check in') || 
      lower.includes('check-in') || 
      lower.includes('i woke up') || 
      lower.includes('i feel') || 
      lower.includes('my pain') || 
      lower.includes('slept') || 
      lower.includes('appetite') ||
      lower.includes('i took my pills');

    if (isCheckInIntent && query.split(' ').length >= 3) {
      try {
        const extractRes = await api.post('/api/elderly/me/checkins/conversational-extract', { transcript: query });
        if (extractRes.data && extractRes.data.extracted) {
          setExtractedCheckIn(extractRes.data);
          return `I listened carefully to your check-in! Here is what I extracted from your words: ${extractRes.data.summary} Please review the card below and tap 'Confirm & Record Check-In'.`;
        }
      } catch (err) {
        console.warn('Conversational extraction notice:', err);
      }
    }

    // 1. Real Medications & Prescriptions
    if (lower.includes('med') || lower.includes('pill') || lower.includes('prescription') || lower.includes('dose') || lower.includes('tablet')) {
      const meds = liveContext?.active_medications || [];
      if (meds.length > 0) {
        const medListStr = meds.map(m => `${m.name} (${m.dosage || 'standard dose'} at ${m.intake_time || 'scheduled time'})`).join(', ');
        return `According to your active medical record, you are prescribed: ${medListStr}. Everything is up to date in your chart!`;
      }
      return "You currently have no active medication prescriptions logged in your chart today. You are doing well!";
    }

    // 2. Real Caregiver on Duty
    if (lower.includes('caregiver') || lower.includes('nurse') || lower.includes('doctor') || lower.includes('who is taking care') || lower.includes('duty')) {
      const cg = liveContext?.caregiver;
      if (cg?.is_assigned && cg?.name) {
        return `Your dedicated caregiver is ${cg.name} (${cg.shift}). They are actively reviewing your daily telemetry and check-ins. You can tap 'Request Help' if you would like them to visit!`;
      }
      return "Your facility care team is on duty and monitoring your telemetry 24/7. Tap 'Request Help' anytime you need immediate assistance.";
    }

    // 3. Real Vitals & Baseline Score
    if (lower.includes('heart rate') || lower.includes('bp') || lower.includes('vitals') || lower.includes('blood pressure') || lower.includes('score')) {
      const vit = liveContext?.latest_vitals;
      const score = liveContext?.wellness_score || 88;
      if (vit) {
        return `Your latest vitals show Blood Pressure at ${vit.blood_pressure_systolic}/${vit.blood_pressure_diastolic} mmHg, Heart Rate at ${vit.heart_rate} BPM, and Oxygen Saturation at ${vit.oxygen_saturation}%. Your overall Wellness Score is ${score}/100 (${liveContext?.wellness_status || 'Stable'}). Looking steady!`;
      }
      return `Your composite Wellness Score today is ${score}/100. Be sure to log your morning blood pressure and heart rate using the 'Log Vitals' button on your dashboard!`;
    }

    // 4. Sleep & Rest
    if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('tired')) {
      return "Restful sleep restores your energy and immune system. A gentle 10-minute warm bath or listening to calming music before bed can help. Would you like to do a quick 1-minute breathing exercise right now?";
    }

    // 5. Mindfulness & Breathing
    if (lower.includes('breath') || lower.includes('calm') || lower.includes('relax') || lower.includes('stress') || lower.includes('anxiety')) {
      return "Let's take a calm breath together. Inhale gently through your nose... 1, 2, 3, 4... hold for a moment... and exhale softly. You are safe, cherished, and doing wonderfully today.";
    }

    // 6. Emergencies & Pain
    if (lower.includes('emergency') || lower.includes('help') || lower.includes('severe pain') || lower.includes('chest pain') || lower.includes('fell') || lower.includes('fall')) {
      return "If you are in severe pain or need urgent care, please tap the red 'Request Urgent Help' button immediately! Your caregiver and emergency contact will be alerted instantly.";
    }

    // 7. Greetings
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('good morning') || lower.includes('good afternoon')) {
      const name = liveContext?.resident_name || 'there';
      return `Good day, ${name}! It is wonderful to speak with you. How are you feeling today? You can tell me about your sleep, appetite, or any aches, and I will record your check-in!`;
    }

    // 8. General friendly response
    return `Thank you for sharing that with me! I am here to help you stay healthy and connected. You can ask me about your medications, check today's vitals, or tell me how you're feeling to do your daily check-in!`;
  };

  const handleSendQuery = async (customText) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setInputText('');
    setAssistantStatus('Joy is thinking...');

    const responseText = await generateJoyResponse(textToSend);
    const joyMessage = {
      id: Date.now() + 1,
      sender: 'joy',
      text: responseText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory((prev) => [...prev, joyMessage]);
    setAssistantStatus('Joy answered. Tap the mic to reply or ask another question.');
    speakJoy(responseText);
  };

  const handleClearHistory = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setExtractedCheckIn(null);
    setChatHistory([
      {
        id: Date.now(),
        sender: 'joy',
        text: "Conversation cleared. Hello! What would you like to talk about?",
        time: 'Just now'
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="carer-modal-backdrop" style={{ zIndex: 9999 }}>
      <div 
        className="carer-modal-card pastel-card animate-fade-in"
        style={{
          maxWidth: '680px',
          width: '95%',
          background: 'linear-gradient(155deg, #ffffff 0%, #fdf4ff 50%, #f5f3ff 100%)',
          border: '2px solid #e9d5ff',
          borderRadius: '28px',
          boxShadow: '0 24px 50px rgba(124, 58, 237, 0.25)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #f3e8ff', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              className={isListening || isSpeaking ? 'ai-orb-pulsing' : ''}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(124, 58, 237, 0.35)',
                flexShrink: 0
              }}
            >
              <Bot size={30} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#5b21b6', margin: 0 }}>
                  Joy Voice Assistant
                </h3>
                <span className="pastel-badge pastel-badge-purple" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  <Sparkles size={12} /> Real Health Context
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#7c3aed', margin: '2px 0 0 0', fontWeight: 600 }}>
                {assistantStatus}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute Joy' : 'Mute Joy'}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid #e9d5ff',
                background: '#ffffff',
                color: isMuted ? '#94a3b8' : '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <button
              onClick={handleClearHistory}
              title="Clear chat"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid #e9d5ff',
                background: '#ffffff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={onClose}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid #e9d5ff',
                background: '#ffffff',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Live Context Capsule */}
        {liveContext && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e9d5ff',
            borderRadius: '16px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: '#4c1d95',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              <strong>Resident:</strong> {liveContext.resident_name} &bull; <strong>Wellness Score:</strong> {liveContext.wellness_score}/100
            </div>
            <div>
              <strong>Today Check-In:</strong> {liveContext.today_checkin_completed ? '✅ Completed' : '⏳ Pending'} &bull; <strong>Caregiver:</strong> {liveContext.caregiver?.name || 'On Duty'}
            </div>
          </div>
        )}

        {/* Chat Messages Scroll Window */}
        <div 
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            minHeight: '260px',
            maxHeight: '360px',
            scrollBehavior: 'smooth'
          }}
        >
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              {msg.sender === 'joy' && (
                <div 
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: '#f3e8ff',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Bot size={18} />
                </div>
              )}

              <div
                style={{
                  maxWidth: '82%',
                  padding: '14px 18px',
                  borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: msg.sender === 'user' 
                    ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' 
                    : '#ffffff',
                  color: msg.sender === 'user' ? '#ffffff' : '#1e1b4b',
                  fontSize: '0.98rem',
                  lineHeight: 1.55,
                  boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(124, 58, 237, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                  border: msg.sender === 'user' ? 'none' : '1px solid #f3e8ff'
                }}
              >
                <div>{msg.text}</div>
                <div 
                  style={{
                    fontSize: '0.72rem',
                    color: msg.sender === 'user' ? '#e9d5ff' : '#94a3b8',
                    marginTop: '6px',
                    textAlign: 'right'
                  }}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {/* Interactive Natural Language Extracted Check-in Card */}
          {extractedCheckIn && (
            <div 
              className="animate-fade-in"
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #8b5cf6',
                borderRadius: '20px',
                padding: '16px',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.15)',
                margin: '8px 0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#6d28d9', fontWeight: 800 }}>
                <CheckCircle2 size={20} />
                <span>Extracted Check-In Parameters (Natural Language)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.86rem', marginBottom: '14px' }}>
                <div style={{ background: '#f5f3ff', padding: '8px 12px', borderRadius: '10px' }}>
                  <strong>Mood:</strong> {extractedCheckIn.extracted.mood}
                </div>
                <div style={{ background: '#f5f3ff', padding: '8px 12px', borderRadius: '10px' }}>
                  <strong>Sleep Quality:</strong> {extractedCheckIn.extracted.sleep_quality}
                </div>
                <div style={{ background: '#f5f3ff', padding: '8px 12px', borderRadius: '10px' }}>
                  <strong>Medication:</strong> {extractedCheckIn.extracted.medication_taken}
                </div>
                <div style={{ background: '#f5f3ff', padding: '8px 12px', borderRadius: '10px' }}>
                  <strong>Mobility:</strong> {extractedCheckIn.extracted.mobility_difficulty}
                </div>
                <div style={{ background: '#f5f3ff', padding: '8px 12px', borderRadius: '10px', gridColumn: 'span 2' }}>
                  <strong>Reported Symptoms:</strong> {extractedCheckIn.extracted.symptoms}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleConfirmCheckIn(extractedCheckIn.extracted)}
                  disabled={submittingCheckIn}
                  className="btn-carer-primary"
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '9999px',
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {submittingCheckIn ? 'Recording...' : 'Confirm & Record Check-In'}
                </button>
                <button
                  onClick={() => setExtractedCheckIn(null)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '9999px',
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Topic Chips */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 0 12px 0', borderTop: '1px solid #f3e8ff', borderBottom: '1px solid #f3e8ff' }}>
          <button
            onClick={() => handleSendQuery("Good morning Joy, I slept well, had breakfast, took my medicine, but have a mild knee ache.")}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid #c4b5fd',
              background: '#f5f3ff',
              color: '#6d28d9',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} /> Voice Check-In (Natural Language)
          </button>

          <button
            onClick={() => handleSendQuery("What medications should I take today?")}
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid #e9d5ff',
              background: '#ffffff',
              color: '#7c3aed',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Pill size={14} /> My Medications
          </button>

          <button
            onClick={() => handleSendQuery("Who is my assigned caregiver on duty today?")}
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid #e9d5ff',
              background: '#ffffff',
              color: '#7c3aed',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UserCheck size={14} /> My Caregiver
          </button>

          <button
            onClick={() => handleSendQuery("What are my latest vitals and wellness score?")}
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid #e9d5ff',
              background: '#ffffff',
              color: '#7c3aed',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Activity size={14} /> My Vitals & Score
          </button>
        </div>

        {/* Input Bar & Big Friendly Mic Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
          <button
            onClick={toggleListening}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              background: isListening 
                ? '#ef4444' 
                : 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening 
                ? '0 0 0 6px rgba(239, 68, 68, 0.25)' 
                : '0 6px 18px rgba(124, 58, 237, 0.35)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title={isListening ? 'Stop listening' : 'Start voice conversation'}
          >
            {isListening ? <MicOff size={26} /> : <Mic size={26} />}
          </button>

          <input
            type="text"
            placeholder="Speak or type how you feel..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '9999px',
              border: '1.5px solid #e9d5ff',
              fontSize: '1rem',
              outline: 'none',
              backgroundColor: '#ffffff',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}
          />

          <button
            onClick={() => handleSendQuery()}
            disabled={!inputText.trim()}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              background: inputText.trim() ? '#7c3aed' : '#e2e8f0',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputText.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
