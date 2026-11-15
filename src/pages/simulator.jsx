import '../../data.js';
import '../shell';
import React from 'react';
import {createRoot} from 'react-dom/client';
import SIDashboard from '../components/SIDashboard';
createRoot(document.getElementById('react-si-dashboard')).render(<SIDashboard/>);
