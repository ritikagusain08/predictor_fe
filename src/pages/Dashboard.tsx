import { useEffect, useState } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Trophy, LogOut, Users, Flag, Plus, Hash,
  ChevronRight, MapPin, Timer, Gauge,
  Globe, CheckCircle2, Lock, Unlock, Copy, Share2,
  Send, LayoutDashboard, X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Match {
  matchId: number;
  gamedayId: number;
  circuitLocation: string;
  status: number;
}

interface UserLeague {
  leagueId: number;
  leagueName: string;
  matchId: number;
  leagueCode: string;
  membersCount: number;
}

interface UnjoinedLeague {
  id: number;
  leagueName: string;
  templateId: number;
  membersCount: number;
  template: {
    name: string;
  }
}

export default function Dashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictionStatus, setPredictionStatus] = useState<Record<number, boolean>>({});
  const [hasQuestionsStatus, setHasQuestionsStatus] = useState<Record<number, boolean>>({});
  const [userLeagues, setUserLeagues] = useState<UserLeague[]>([]);
  const [unjoinedLeagues, setUnjoinedLeagues] = useState<UnjoinedLeague[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showJoinCenter, setShowJoinCenter] = useState(false);
  const [createdLeagueData, setCreatedLeagueData] = useState<any>(null);

  const [newLeagueName, setNewLeagueName] = useState("");
  const [leagueType, setLeagueType] = useState("1");
  const [maxMembers, setMaxMembers] = useState(10);

  const [joinLeagueCode, setJoinLeagueCode] = useState("");
  const [loadingUnjoined, setLoadingUnjoined] = useState(false);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();
  const userIdStr = localStorage.getItem("userId");
  const userId = userIdStr ?? null;
  const username =
    localStorage.getItem("username") ||
    localStorage.getItem("name") ||
    localStorage.getItem("email")?.split("@")[0] ||
    "Player";

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data } = await api.get<Match[]>("/admin/api/matches/allmatches");
        const activeMatches = data.filter((m) => Number(m.status) === 1 || Number(m.status) === 2 || Number(m.status) === 3);
        setMatches(activeMatches);

        if (userId) {
          const statusMap: Record<number, boolean> = {};
          const questionMap: Record<number, boolean> = {};

          for (const match of activeMatches) {
            try {
              // 1. Check Prediction Status
              const { data: predData } = await api.get(`/api/predictions/get/${match.matchId}`);
              statusMap[match.matchId] = predData.predictions && predData.predictions.length > 0;

              // 2. Check Question Availability
              try {
                const { data: qData } = await api.get<any[]>(`/admin/api/questions/${match.matchId}`);
                questionMap[match.matchId] = Array.isArray(qData) && qData.length > 0;
              } catch (qErr) {
                questionMap[match.matchId] = false;
              }
            } catch (pErr) {
              console.error(`Status check failed for match ${match.matchId}`, pErr);
              statusMap[match.matchId] = false;
              questionMap[match.matchId] = false;
            }
          }
          setPredictionStatus(statusMap);
          setHasQuestionsStatus(questionMap);
        }
      } catch (err) {
        console.error("Error fetching matches", err);
      }
    };

    fetchMatches();
    if (userId) fetchLeagues();
  }, [userId]);

  const fetchLeagues = async () => {
    try {
      const { data } = await api.get<{ data: any[] }>("/api/league/allLeagues");
      setUserLeagues(data.data.map(l => ({
        leagueId: l.id,
        leagueName: l.leagueName,
        matchId: l.createdAtMatchId,
        leagueCode: l.leagueCode,
        membersCount: l.membersCount
      })));
    } catch (err) {
      console.error("Error fetching leagues", err);
    }
  };

  const fetchUnjoinedLeagues = async () => {
    try {
      setLoadingUnjoined(true);
      const { data } = await api.get<{ data: UnjoinedLeague[] }>("/api/league/unjoinedLeagues");
      setUnjoinedLeagues(data.data);
    } catch (err) {
      console.error("Error fetching unjoined leagues", err);
    } finally {
      setLoadingUnjoined(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinLeagueCode || !userId) return;
    try {
      await api.post("/api/league/joinLeagueByCode", {
        leagueCode: joinLeagueCode,
        userId: userId
      });
      setShowJoinCenter(false);
      setJoinLeagueCode("");
      fetchLeagues();
    } catch (err) {
      alert("Invalid code. Please try again.");
    }
  };

  const handleJoinPublicLeague = async (leagueId: number) => {
    if (!userId) return;
    try {
      await api.post("/api/league/joinLeague", {
        leagueId,
        userId
      });
      fetchUnjoinedLeagues();
      fetchLeagues();
    } catch (err) {
      console.error("Error joining public league", err);
      alert("Failed to join this league. Please try again.");
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName || !userId) {
      console.warn("Missing name or user ID");
      return;
    }

    // Safety: Find the best available match to link to this league
    const openMatch = matches.find(m => Number(m.status) === 1) || matches[0];

    if (!openMatch) {
      alert("No active races found to create a league. Please wait for the season to start!");
      return;
    }

    try {
      console.log("Calling createLeague API...");
      const { data } = await api.post("/api/league/createLeague", {
        leagueName: newLeagueName,
        templateId: Number(leagueType),
        maximumMembers: Number(maxMembers),
        matchId: openMatch.matchId,
        userId: userId
      });

      console.log("API Response:", data);
      setCreatedLeagueData(data.data);
      setShowCreateModal(false);
      setShowSuccessOverlay(true);

      setNewLeagueName("");
      setLeagueType("1");
      setMaxMembers(10);
      fetchLeagues();
    } catch (err) {
      console.error("Create League API Error:", err);
      alert("Failed to create league. Please check your connection.");
    }
  };

  const handleCopyLink = () => {
    const code = createdLeagueData?.leagueCode || "F1-RACE";
    const link = `${window.location.origin}/league/${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteCode = createdLeagueData?.leagueCode || "F1-CODE";
  const shareLink = `${window.location.origin}/league/${inviteCode}`;
  const shareText = `Join my Formula 1 Prediction League: ${createdLeagueData?.leagueName || 'Race'}! Use code: ${inviteCode}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-12 font-outfit relative">

      {/* 🔹 MEDIUM SUCCESS POPUP (FAIL-SAFE OVERLAY) */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md animate-in fade-in duration-300" />

          <div className="relative bg-neutral-900 border border-white/5 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-[0_0_80px_rgba(225,6,0,0.15)] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-red-600 p-8 flex flex-col items-center text-center space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-full bg-white/5 -skew-x-[30deg] translate-x-12" />
              <button onClick={() => setShowSuccessOverlay(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="bg-white/20 p-4 rounded-full mb-1 relative z-10">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black italic uppercase relative z-10 leading-none">League Ready!</h2>
              <p className="text-white/80 font-bold italic uppercase tracking-widest text-[9px] relative z-10">Dashboard Ready</p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-neutral-600">Access Token (Code)</Label>
                  <div className="bg-neutral-950 border border-white/5 p-4 rounded-xl flex items-center justify-between group">
                    <span className="font-mono text-3xl font-black italic text-red-600 tracking-tighter uppercase">{inviteCode}</span>
                    <Button variant="ghost" className="hover:bg-red-600/10 text-red-600 h-10 w-10 p-0" onClick={() => { navigator.clipboard.writeText(inviteCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-white hover:text-white">Direct Link</Label>
                  <div className="bg-neutral-950 border border-white/5 p-4 rounded-xl flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold text-white hover:text-white truncate italic">{shareLink}</span>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest text-[9px] h-8 px-4 shrink-0 rounded-lg" onClick={handleCopyLink}>
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <Separator className="flex-1 bg-white/5" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white hover:text-white">Share with racers</span>
                  <Separator className="flex-1 bg-white/5" />
                </div>
                <div className="flex justify-center gap-4">
                  <a href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareLink)}`} target="_blank" className="p-4 bg-neutral-950 border border-white/5 rounded-2xl hover:border-green-500 hover:bg-green-500/5 transition-all group">
                    <Send className="w-6 h-6 text-neutral-600 group-hover:text-green-500" />
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`} target="_blank" className="p-4 bg-neutral-950 border border-white/5 rounded-2xl hover:border-red-600 hover:bg-red-600/5 transition-all group">
                    <Share2 className="w-6 h-6 text-neutral-600 group-hover:text-red-600" />
                  </a>
                  <a href={`https://threads.net/intent/post?text=${encodeURIComponent(shareText + ' ' + shareLink)}`} target="_blank" className="p-4 bg-neutral-950 border border-white/5 rounded-2xl hover:border-white hover:bg-white/5 transition-all group">
                    <Globe className="w-6 h-6 text-neutral-600 group-hover:text-white" />
                  </a>
                </div>
              </div>

              {/* Redirection Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-neutral-800 text-white hover:text-white font-black uppercase italic tracking-widest h-12 rounded-xl text-[9px]"
                  onClick={() => { setShowSuccessOverlay(false); navigate("/dashboard"); }}
                >
                  <LayoutDashboard className="w-3 h-3 mr-2" /> Home Page
                </Button>
                <Button
                  className="bg-white text-black hover:bg-neutral-200 font-black uppercase italic tracking-widest h-12 rounded-xl text-[9px]"
                  onClick={() => navigate("/leagues")}
                >
                  Go to Leagues <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 NAVIGATION */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-neutral-950/90 backdrop-blur-xl h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/dashboard")}>
            <div className="bg-red-600 p-1 rounded-sm group-hover:rotate-12 transition-transform">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-black tracking-tighter uppercase italic text-2xl">F1 <span className="text-red-600">Predictor</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">
            <button className="text-white border-b-2 border-red-600 pb-1">Home</button>
            <button onClick={() => navigate("/my-results")} className="hover:text-white transition-colors">My Results</button>
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

      <div className="max-w-7xl mx-auto px-4 pt-12 space-y-20">
        <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600 italic">Driver Profile</p>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
              Welcome, <span className="text-red-600">{username}</span>
            </h1>
          </div>
        </section>

        {/* 🔹 RACE CARDS */}
        <section>
          <div className="grid grid-cols-1 gap-12">
            {matches.map((m) => (
              <Card key={m.matchId} className="relative bg-neutral-900 border-none hover:ring-2 hover:ring-red-600/50 transition-all group overflow-hidden shadow-2xl h-[480px] flex flex-col rounded-[3rem]">
                <div className="absolute inset-0">
                  <img
                    src="/track_bg.png"
                    alt="Track"
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
                </div>

                <div className="relative z-10 p-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 animate-in slide-in-from-left-4 duration-700">
                      <Badge className="bg-red-600 text-white font-black italic uppercase tracking-[0.2em] px-3 py-1 rounded-full border-none shadow-lg shadow-red-600/20 text-[10px]">
                        Round {m.gamedayId}
                      </Badge>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-[9px] italic">
                          <Gauge className="w-3.5 h-3.5" /> World Championship
                        </div>
                        <h3 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl leading-none">
                          {m.circuitLocation} <span className="text-red-600">GP</span>
                        </h3>
                      </div>
                    </div>

                    <div className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-full border-2 font-black uppercase italic tracking-widest text-sm shadow-xl skew-x-[-10deg]",
                      Number(m.status) === 1 && hasQuestionsStatus[m.matchId]
                        ? "bg-green-500/10 border-green-500 text-green-500 shadow-green-500/20 animate-pulse"
                        : (!hasQuestionsStatus[m.matchId] || Number(m.status) === 0)
                          ? "bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-yellow-500/20"
                          : "bg-red-500/10 border-red-500 text-red-500 shadow-red-500/20"
                    )}>
                      <div className="skew-x-[10deg] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
                        {Number(m.status) === 1 && hasQuestionsStatus[m.matchId]
                          ? "Open"
                          : (!hasQuestionsStatus[m.matchId] || Number(m.status) === 0)
                            ? "Coming Soon"
                            : Number(m.status) === 2
                              ? "Locked"
                              : Number(m.status) === 3
                                ? "Calculating"
                                : "Closed"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em] italic mb-1">Details</span>
                        <div className="flex items-center gap-2 font-black text-white italic text-base uppercase">
                          <Timer className="w-4 h-4 text-red-600" /> Main Event
                        </div>
                      </div>
                      <Separator orientation="vertical" className="h-8 bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em] italic mb-1">Location</span>
                        <div className="flex items-center gap-2 font-black text-white italic text-base uppercase">
                          <MapPin className="w-4 h-4 text-red-600" /> {m.circuitLocation}
                        </div>
                      </div>
                    </div>

                    {hasQuestionsStatus[m.matchId] && (
                      <Button
                        className="min-w-[240px] font-black uppercase italic tracking-tighter h-16 text-2xl transition-all shadow-2xl rounded-none border-b-4 skew-x-[-10deg] bg-red-600 border-red-800 hover:bg-red-700 hover:border-red-900 text-white shadow-red-600/30"
                        disabled={Number(m.status) >= 2}
                        onClick={() => navigate("/predict", { state: { match: m, isEdit: predictionStatus[m.matchId] } })}
                      >
                        <div className="skew-x-[10deg] flex items-center">
                          {Number(m.status) === 3 ? "Points Calculating" : Number(m.status) === 2 ? "Prediction Locked" : predictionStatus[m.matchId] ? "Edit Prediction" : "Predict Now"}
                          <ChevronRight className="w-8 h-8 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Button>
                    )}
                    {!hasQuestionsStatus[m.matchId] && (
                      <div className="min-w-[240px] h-16 border border-white/5 bg-neutral-950/50 flex items-center justify-center skew-x-[-10deg]">
                        <span className="skew-x-[10deg] text-[10px] font-black uppercase italic text-white hover:text-white tracking-widest">Coming Soon</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="bg-neutral-900 mb-10" />

        {/* 🔹 LEAGUES SECTION */}
        <section className="bg-neutral-900/40 rounded-[3rem] p-10 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[40%] h-full bg-red-600/5 blur-[120px] pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6 relative z-10">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-1 justify-center md:justify-start">
                <div className="w-1.5 h-8 bg-red-600 rounded-full" />
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Your Leagues</h2>
              </div>
              <p className="text-white hover:text-white font-medium max-w-sm italic text-base text-white/60">Challenge your friends in private leagues.</p>
              <Button
                variant="link"
                onClick={() => navigate("/leagues")}
                className="text-red-600 font-black uppercase italic tracking-widest text-[10px] p-0 h-auto mt-2 flex items-center gap-1 hover:text-red-500 transition-colors"
              >
                View all your competitions <ChevronRight className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex gap-4">
              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-black hover:bg-neutral-200 font-black uppercase italic h-14 px-8 rounded-none skew-x-[-10deg] shadow-lg shadow-white/10 text-lg">
                    <div className="skew-x-[10deg] flex items-center">
                      <Plus className="w-4 h-4 mr-2" /> Create League
                    </div>
                  </Button>
                </DialogTrigger>

                <DialogContent className="bg-neutral-900 border-neutral-800 text-white p-8 rounded-[2rem] max-w-md font-outfit">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-black italic uppercase">Create League</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-neutral-400">League Name</Label>
                      <Input id="name" placeholder="E.g. Speed Kings" className="bg-neutral-950 border-neutral-800 h-12 text-white focus:border-red-600 transition-colors rounded-lg text-sm" value={newLeagueName} onChange={e => setNewLeagueName(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">League Type</Label>
                      <RadioGroup value={leagueType} onValueChange={setLeagueType} className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => setLeagueType("1")}
                          className={cn(
                            "flex flex-col items-center justify-between rounded-lg border-2 bg-neutral-950 p-4 cursor-pointer transition-all",
                            leagueType === "1" ? "border-red-600 bg-red-600/5" : "border-neutral-800 hover:bg-neutral-900"
                          )}
                        >
                          <Lock className={cn("mb-2 h-5 w-5", leagueType === "1" ? "text-red-600" : "text-white hover:text-white")} />
                          <span className={cn("font-black italic uppercase text-[10px]", leagueType === "1" ? "text-white" : "text-white hover:text-white")}>Private</span>
                          <RadioGroupItem value="1" className="sr-only" />
                        </div>
                        <div
                          onClick={() => setLeagueType("2")}
                          className={cn(
                            "flex flex-col items-center justify-between rounded-lg border-2 bg-neutral-950 p-4 cursor-pointer transition-all",
                            leagueType === "2" ? "border-red-600 bg-red-600/5" : "border-neutral-800 hover:bg-neutral-900"
                          )}
                        >
                          <Unlock className={cn("mb-2 h-5 w-5", leagueType === "2" ? "text-red-600" : "text-neutral-600")} />
                          <span className={cn("font-black italic uppercase text-[10px]", leagueType === "2" ? "text-white" : "text-neutral-500")}>Public</span>
                          <RadioGroupItem value="2" className="sr-only" />
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="max" className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Max Members</Label>
                        <span className="text-red-600 font-mono font-bold text-xs">{maxMembers}</span>
                      </div>
                      <Input
                        id="max"
                        type="number"
                        min="2"
                        max="99999"
                        className="bg-neutral-950 border-neutral-800 h-12 text-white focus:border-red-600 transition-colors rounded-lg text-sm"
                        value={maxMembers}
                        onChange={e => setMaxMembers(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button onClick={handleCreateLeague} className="bg-red-600 hover:bg-red-700 w-full h-14 font-black uppercase italic tracking-widest text-white shadow-lg shadow-red-600/20 text-base rounded-xl">Create League</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* 🔹 JOIN CENTER DIALOG */}
              <Dialog open={showJoinCenter} onOpenChange={(val) => { setShowJoinCenter(val); if (val) fetchUnjoinedLeagues(); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-red-600 border-2 bg-red-600/5 hover:bg-red-600 text-white font-black uppercase italic h-14 px-10 rounded-none skew-x-[-10deg] text-lg shadow-xl shadow-red-600/10">
                    <div className="skew-x-[10deg] flex items-center">
                      <Flag className="w-5 h-5 mr-2 text-white" /> Join League
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white p-6 rounded-[2rem] max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-black italic uppercase text-center">Join Center</DialogTitle>
                    <DialogDescription className="text-white hover:text-white font-medium italic text-center text-[10px]">Browse public groups or enter a code.</DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="browse" className="w-full flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 bg-neutral-950 p-1 h-12 rounded-xl mb-4">
                      <TabsTrigger value="browse" className="font-black uppercase italic tracking-widest text-[10px] data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all rounded-lg">Available</TabsTrigger>
                      <TabsTrigger value="code" className="font-black uppercase italic tracking-widest text-[10px] data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all rounded-lg">Use Code</TabsTrigger>
                    </TabsList>

                    <TabsContent value="browse" className="flex-1 overflow-y-auto pr-2 mt-0 space-y-3">
                      {loadingUnjoined ? (
                        <div className="py-12 text-center animate-pulse text-white hover:text-white font-bold italic uppercase tracking-widest text-[10px]">Looking for leagues...</div>
                      ) : unjoinedLeagues.length > 0 ? (
                        unjoinedLeagues.map((l) => (
                          <div key={l.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between group hover:border-red-600/50 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-red-600/5 rounded-lg flex items-center justify-center border border-red-600/10">
                                <Trophy className="w-4 h-4 text-red-600" />
                              </div>
                              <div>
                                <div className="font-black italic uppercase text-base leading-none mb-1 group-hover:text-red-500 transition-colors">{l.leagueName}</div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-neutral-800 text-neutral-400 border-none text-[8px] font-black uppercase tracking-widest">{l.template?.name || "PUBLIC"}</Badge>
                                  <span className="text-[9px] font-bold text-neutral-600 italic uppercase">{l.membersCount} Members</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleJoinPublicLeague(l.id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest text-[9px] h-9 px-4 rounded-lg"
                            >
                              Join
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-neutral-600 text-[10px] italic">You've joined all available leagues!</div>
                      )}
                    </TabsContent>

                    <TabsContent value="code" className="mt-0 py-6 px-4 flex flex-col items-center justify-center space-y-6">
                      <div className="w-full space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Invite Code</Label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                            <Input
                              id="code"
                              placeholder="CODE-1234"
                              className="bg-neutral-950 border-neutral-800 h-14 pl-10 text-xl text-white focus:border-red-600 transition-colors uppercase font-mono tracking-widest rounded-lg"
                              value={joinLeagueCode}
                              onChange={e => setJoinLeagueCode(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleJoinByCode}
                          className="bg-red-600 hover:bg-red-700 w-full h-14 font-black uppercase italic tracking-widest text-white shadow-xl shadow-red-600/10 text-base rounded-lg mt-2"
                        >
                          Join League
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {userLeagues.slice(0, 3).map((l) => (
              <div
                key={l.leagueId}
                onClick={() => navigate(`/league/season-leaderboard/${l.leagueId}`)}
                className="p-6 bg-neutral-950/60 border border-white/5 rounded-none skew-x-[-5deg] hover:bg-neutral-950 hover:border-red-600/50 transition-all cursor-pointer flex items-center justify-between group shadow-xl"
              >
                <div className="skew-x-[5deg] flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600/5 rounded-sm flex items-center justify-center border border-red-600/10 group-hover:bg-red-600/20 transition-colors shadow-inner">
                    <Flag className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-black italic uppercase tracking-tight text-xl group-hover:text-red-500 transition-colors">{l.leagueName}</div>
                    <div className="text-[9px] text-white hover:text-white font-bold flex items-center gap-2 mt-1 uppercase tracking-widest italic">
                      <Users className="w-3 h-3" />
                      <span>{l.membersCount} Members</span>
                      <span>•</span>
                      <code className="text-white font-bold">{l.leagueCode}</code>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-neutral-800 group-hover:text-red-600 group-hover:translate-x-1 transition-all skew-x-[5deg]" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
