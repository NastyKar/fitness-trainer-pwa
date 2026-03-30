import React from 'react';
import LandingPage from '../LandingPage';

function EntryPoint({ onTrainerLogin, onClientLogin }) {
  return (
    <LandingPage 
      onClientLogin={onClientLogin}
      onTrainerLogin={onTrainerLogin}
    />
  );
}

export default EntryPoint;