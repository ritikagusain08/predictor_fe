import { useState, useEffect } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronLeft, Flag, FileText, ChevronRight, LogOut } from "lucide-react";
import type { Match } from "../types";

export default function MyResults() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<Match[]>("/admin/api/matches/allmatches");
      const pastMatches = data.filter(m => Number(m.status) === 4);
      const sorted = pastMatches.sort((a, b) => b.gamedayId - a.gamedayId);
      setMatches(sorted);
    } catch (err) {
      console.error("Error fetching matches", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-20 font-outfit relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[500px] bg-red-600/5 blur-[120px] pointer-events-none" />

      {/* 🔹 NAVIGATION */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-neutral-950/90 backdrop-blur-xl h-16 mb-12 relative">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/dashboard")}>
            <div className="bg-red-600 p-1 rounded-sm group-hover:rotate-12 transition-transform">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-black tracking-tighter uppercase italic text-2xl">F1 <span className="text-red-600">Predictor</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">
            <button onClick={() => navigate("/dashboard")} className="hover:text-white transition-colors">Home</button>
            <button className="text-white border-b-2 border-red-600 pb-1">My Results</button>
            <button onClick={() => navigate("/leaderboard")} className="hover:text-white transition-colors">Leaderboard</button>
            <button onClick={() => navigate("/leagues")} className="hover:text-white transition-colors">All Leagues</button>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-white hover:text-white hover:text-red-500 hover:bg-red-500/10 font-bold" onClick={() => { localStorage.clear(); navigate("/"); }}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600 italic mb-1">Race History</p>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
              My <span className="text-red-600">Results</span>
            </h1>
          </div>
          <Button onClick={() => navigate("/dashboard")} variant="outline" className="border-neutral-800 text-white rounded-xl hover:bg-neutral-800 shrink-0">
            <ChevronLeft className="w-4 h-4 mr-2" /> Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 italic flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-600" /> Completed Races
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">Loading Results...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-neutral-900/20">
              <FileText className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <p className="font-black uppercase italic text-neutral-400 text-sm tracking-widest">No past matches found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map(m => (
                <button
                  key={m.matchId}
                  onClick={() => navigate(`/match-results/${m.matchId}`)}
                  className="group relative flex flex-col items-start p-8 rounded-3xl border border-white/5 bg-neutral-900/40 hover:bg-neutral-900/80 transition-all text-left overflow-hidden shadow-xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-[40px] pointer-events-none group-hover:bg-red-600/10 transition-colors" />

                  <Badge className="bg-red-600 text-white font-black italic uppercase tracking-widest text-[10px] border-none shadow-md shadow-red-600/20 mb-4 px-3 py-1">
                    Round {m.gamedayId}
                  </Badge>

                  <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-tight mb-6">
                    {m.circuitLocation} <span className="text-red-600 text-lg">GP</span>
                  </h3>

                  <div className="mt-auto w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:text-red-500 transition-colors">
                    <span>View Predictions</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
