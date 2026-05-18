// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MatchPrediction from "./pages/MatchPrediction";
import Leaderboard from "./pages/Leaderboard";
import Register from "./pages/Register";
import { setAuthToken } from "./api/api";
import RoleSelection from "./pages/RoleSelection";
import AdminDashboard from "./pages/AdminDashboard";
import Leagues from "./pages/Leagues";
import LeagueDetails from "./pages/LeagueDetails";
import MyResults from "./pages/MyResults";
import MatchResultDetails from "./pages/MatchResultDetails";
import LeagueLeaderboard from "./pages/LeagueLeaderboard";

const token = localStorage.getItem("token");

if (token) {
  setAuthToken(token);
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-results" element={<MyResults />} />
        <Route path="/match-results/:matchId" element={<MatchResultDetails />} />
        <Route path="/predict" element={<MatchPrediction />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/leagues" element={<Leagues />} />
        <Route path="/league/:leagueCode" element={<LeagueDetails />} />
        <Route path="/league/season-leaderboard/:leagueId" element={<LeagueLeaderboard />} />
      </Routes> 
    </BrowserRouter>
  );
}

export default App;