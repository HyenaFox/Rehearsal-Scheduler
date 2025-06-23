import React from 'react';
import { useApp } from '../contexts/AppContext';
import ScenesScreen from '../screens/ScenesScreen';

export default function ScenesTab() {
  const { actors, setActors } = useApp();

  return (
    <ScenesScreen 
      onBack={() => {}} // No back needed in tabs
      actors={actors}
      setActors={setActors}
    />
  );
}
