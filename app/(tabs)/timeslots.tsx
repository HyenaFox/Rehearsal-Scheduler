import React from 'react';
import TimeslotsScreen from '../screens/TimeslotsScreen';

export default function TimeslotsTab() {
  return (
    <TimeslotsScreen 
      onBack={() => {}} // No back needed in tabs
    />
  );
}
