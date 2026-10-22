import React from 'react';
import { AITalkAssistant } from './AITalkAssistant';

export const VoiceCheckInModal = ({ isOpen, onClose, onApplyCheckIn, activeContext = {} }) => {
  return (
    <AITalkAssistant
      isOpen={isOpen}
      onClose={onClose}
      onApplyCheckIn={onApplyCheckIn}
      activeContext={activeContext}
    />
  );
};
