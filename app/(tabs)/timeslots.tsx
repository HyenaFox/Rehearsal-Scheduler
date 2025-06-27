import React from 'react';
import { useApp } from '../contexts/AppContext';
import TimeslotsScreen from '../screens/TimeslotsScreen';

export default function TimeslotsTab() {
  const { actors, setActors } = useApp();

  return (
    <TimeslotsScreen 
      onBack={() => {}} // No back needed in tabs
      actors={actors}
      setActors={setActors}
    />
  );
}
