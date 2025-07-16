import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add error handling for debugging
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('Starting Baba Dhudh Bhandar application...');
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  console.log('Application rendered successfully');
} catch (error) {
  console.error('Error starting application:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: red;">Application Error</h1>
      <p>There was an error starting the application:</p>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${error}</pre>
      <p>Please check the browser console for more details.</p>
    </div>
  `;
}
