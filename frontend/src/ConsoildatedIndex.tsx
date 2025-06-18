import React from 'react';
import { createRoot } from 'react-dom/client';
import ConsolidatedApp from './ConsolidatedApp';
import './index.css';

// Add the required CSS animations
const additionalStyles = `
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
`;

// Inject the styles
const styleSheet = document.createElement("style");
styleSheet.innerText = additionalStyles;
document.head.appendChild(styleSheet);

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ConsolidatedApp />);
} else {
  console.error('Root container not found');
}
