import React from 'react';
import { Leaf } from 'lucide-react';

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-left">
        <Leaf size={16} color="#10b981" />
        <span><strong>Breathe Clean</strong> &bull; AI-Powered Indoor Air Quality & Ventilation Platform</span>
      </div>
      <div className="footer-right">
        <span>Clean Air</span>
        <span>&bull;</span>
        <span>Smart Spaces</span>
        <span>&bull;</span>
        <span>Better Health</span>
      </div>
    </footer>
  );
}
