import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

import { setBaseUrl } from '@workspace/api-client-react';

setBaseUrl("https://workspaceapi-server-production-6236.up.railway.app");

createRoot(document.getElementById('root')!).render(<App />);
