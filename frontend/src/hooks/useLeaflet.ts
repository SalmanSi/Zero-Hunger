import { useEffect } from 'react';

const loadLeafletStyles = () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.integrity = 'sha256-20TPEQ1bY9K9K4Q0Q1Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0Q=';
  link.crossOrigin = '';
  document.head.appendChild(link);
};

export const useLeaflet = () => {
  useEffect(() => {
    loadLeafletStyles();
  }, []);
};

export default useLeaflet;