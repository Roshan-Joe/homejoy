/**
 * HomeJoy Browser Web-Push & System Notification Service
 * Pure client-side browser notifications complying with the "No SMS in v1" architectural rule.
 * 100% Free, zero external carrier SMS costs, standard HTML5 Notification API.
 */

class WebNotificationService {
  constructor() {
    // Bound helper so NotificationService.isSupported can also be inspected as a value if needed
  }

  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  async requestPermission() {
    if (!this.isSupported()) {
      console.warn('Web Push Notifications are not supported in this browser.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }

  sendNotification(title, options = {}) {
    if (!this.isSupported()) {
      console.log(`[In-App Notification Fallback]: ${title} — ${options.body || ''}`);
      return null;
    }

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          ...options
        });

        notif.onclick = () => {
          window.focus();
          if (options.onClickUrl) {
            window.location.href = options.onClickUrl;
          }
          notif.close();
        };

        return notif;
      } catch (err) {
        console.warn('Notification creation fallback notice:', err);
      }
    } else if (Notification.permission !== 'denied') {
      // Auto request permission on first notification attempt
      this.requestPermission().then((granted) => {
        if (granted) {
          this.sendNotification(title, options);
        }
      });
    }

    return null;
  }

  // Alias for sendNotification
  showNotification(title, options = {}) {
    return this.sendNotification(title, options);
  }

  // Pre-configured healthcare alert notification triggers
  notifyMedicationDue(medName, dosage, time) {
    return this.sendNotification('💊 HomeJoy Medication Reminder', {
      body: `It is time to take ${medName} (${dosage || 'prescribed dose'}) scheduled for ${time}.`,
      tag: 'medication-reminder'
    });
  }

  notifyCheckInReminder(residentName) {
    return this.sendNotification('☀️ Morning Wellness Check-In Due', {
      body: `Good morning ${residentName || ''}! Tap to start your quick 1-minute daily check-in with Joy.`,
      tag: 'checkin-reminder'
    });
  }

  notifyUrgentHelp(residentName, roomOrCategory) {
    return this.sendNotification('🚨 URGENT RESIDENT HELP REQUEST', {
      body: `${residentName || 'Resident'} (${roomOrCategory || 'Immediate care required'}) has requested assistance!`,
      requireInteraction: true,
      tag: 'urgent-help'
    });
  }

  // Alias for notifyUrgentHelp
  notifyUrgentHelpRequest(residentName, category) {
    return this.notifyUrgentHelp(residentName, category);
  }

  notifyMissedCheckInEscalation(residentName, tier) {
    return this.sendNotification(`⚠️ Tier ${tier} Escalation: Missed Check-In`, {
      body: `${residentName} has missed their daily wellness check-in. Safety protocol initiated.`,
      requireInteraction: true,
      tag: 'missed-checkin-escalation'
    });
  }

  notifyGuardianCheer(senderName, message) {
    return this.sendNotification(`💌 Cheer Card from ${senderName}`, {
      body: message || 'You received a loving wellness greeting!',
      tag: 'guardian-cheer'
    });
  }
}

export const NotificationService = new WebNotificationService();

// Support both property access NotificationService.isSupported and function call NotificationService.isSupported()
// by assigning a boolean property or a function with boolean valueOf
Object.defineProperty(NotificationService, 'isSupported', {
  value: function isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  },
  writable: true,
  configurable: true
});

export default NotificationService;
