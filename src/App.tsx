import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { BossPage } from './pages/BossPage';
import { MachinePage, SystemPage } from './pages/ChallengePages';
import { CodingPage } from './pages/CodingPage';
import { HomePage } from './pages/HomePage';
import { LabPage } from './pages/LabPage';
import { LevelPage } from './pages/LevelPage';
import { MapPage } from './pages/MapPage';
import { MissionPage } from './pages/MissionPage';
import { MockPage } from './pages/MockPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { StoreProvider } from './state/store';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/level/:id" element={<LevelPage />} />
            <Route path="/mission/:levelId/:topicId" element={<MissionPage />} />
            <Route path="/boss/:levelId" element={<BossPage />} />
            <Route path="/coding/:id" element={<CodingPage />} />
            <Route path="/lab/:id" element={<LabPage />} />
            <Route path="/machine/:id" element={<MachinePage />} />
            <Route path="/system/:id" element={<SystemPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/mock" element={<MockPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </StoreProvider>
  );
}
