import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { frFR } from '@mui/material/locale';

// Layout components
import AppLayout from './components/Layout/AppLayout';

// Pages
import Dashboard from './components/Dashboard/Dashboard';
import GsmCalculator from './components/NetworkForms/GsmCalculator';
import UmtsCalculator from './components/NetworkForms/UmtsCalculator';
import HertzianLinkCalculator from './components/NetworkForms/HertzianLinkCalculator';
import OpticalLinkCalculator from './components/NetworkForms/OpticalLinkCalculator';
import ProjectsList from './components/Projects/ProjectsList';
import ProjectDetails from './components/Projects/ProjectDetails';
import ResultsViewer from './components/Results/ResultsViewer';
import UmtsResultsViewer from './components/Results/UmtsResultsViewer';
import HertzianResultsViewer from './components/Results/HertzianResultsViewer';
// Les composants de rapports ont été supprimés

// Create a custom theme with French locale
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5'
    }
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif'
    ].join(','),
  }
}, frFR);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="calculator/gsm" element={<GsmCalculator />} />
            <Route path="calculator/umts" element={<UmtsCalculator />} />
            <Route path="calculator/hertzian" element={<HertzianLinkCalculator />} />
            <Route path="calculator/optical" element={<OpticalLinkCalculator />} />
            <Route path="results/:id" element={<ResultsViewer />} />
            <Route path="results/umts/:id" element={<UmtsResultsViewer />} />
            <Route path="results/hertzian/:id" element={<HertzianResultsViewer />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
