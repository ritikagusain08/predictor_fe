import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Trophy,
  ChevronLeft,
  Plus,
  Users,
  Globe,
  Hash,
  ArrowRight,
  Flag,
  Lock,
  Unlock,
  CheckCircle2,
  Copy,
  Share2,
  Send,
  LayoutDashboard,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Match {
  matchId: number;
  gamedayId: number;
  circuitLocation: string;
  status: number;
}

interface AllLeague {
  id: number;
  leagueName: string;
  templateId: number;
  membersCount: number;
  leagueCode?: string;
  matchId?: number;
  template?: { name: string };
  user?: { username?: string };
}

interface UnjoinedLeague {
  id: number;
  leagueName: string;
  templateId: number;
  membersCount: number;
  template: { name: string };
}

type LeagueKind = "sponsored" | "public" | "private" | "global" | "mini" | "unknown";

function normalizeAllLeaguesResponse(data: unknown): AllLeague[] {
  if (Array.isArray(data)) return data as AllLeague[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as AllLeague[];
    if (Array.isArray(o.leagues)) return o.leagues as AllLeague[];
    if (Array.isArray(o.userLeagues)) return o.userLeagues as AllLeague[];
  }
  return [];
}

function getLeagueKindMeta(templateName: string | undefined): {
  kind: LeagueKind;
  label: string;
  badgeClass: string;
  rowAccent: string;
} {
  const raw = (templateName || "").toUpperCase().replace(/\s+/g, "_");
  if (raw.includes("SPONSOR")) {
    return {
      kind: "sponsored",
      label: "Sponsored",
      badgeClass: "bg-yellow-500/15 text-yellow-500 border-yellow-500/25",
      rowAccent: "group-hover:border-yellow-500/40",
    };
  }
  if (raw === "PUBLIC" || raw.includes("PUBLIC")) {
    return {
      kind: "public",
      label: "Public",
      badgeClass: "bg-neutral-800 text-neutral-300 border-neutral-700",
      rowAccent: "group-hover:border-neutral-500/40",
    };
  }
  if (raw === "PRIVATE" || raw.includes("PRIVATE")) {
    return {
      kind: "private",
      label: "Private",
      badgeClass: "bg-red-600/15 text-red-400 border-red-600/25",
      rowAccent: "group-hover:border-red-600/50",
    };
  }
  if (raw.includes("GLOBAL")) {
    return {
      kind: "global",
      label: "Global",
      badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
      rowAccent: "group-hover:border-red-500/35",
    };
  }
  if (raw.includes("MINI")) {
    return {
      kind: "mini",
      label: "Mini",
      badgeClass: "bg-violet-500/10 text-violet-300 border-violet-500/20",
      rowAccent: "group-hover:border-violet-500/35",
    };
  }
  return {
    kind: "unknown",
    label: templateName ? templateName : "League",
    badgeClass: "bg-neutral-800 text-neutral-400 border-neutral-700",
    rowAccent: "group-hover:border-red-600/50",
  };
}

export default function Leagues() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [userLeagues, setUserLeagues] = useState<AllLeague[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showJoinCenter, setShowJoinCenter] = useState(false);
  const [createdLeagueData, setCreatedLeagueData] = useState<Record<string, unknown> | null>(null);

  const [newLeagueName, setNewLeagueName] = useState("");
  const [leagueType, setLeagueType] = useState("1");
  const [maxMembers, setMaxMembers] = useState(10);

  const [unjoinedLeagues, setUnjoinedLeagues] = useState<UnjoinedLeague[]>([]);
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

  const trimmedJoinCode = useMemo(() => joinLeagueCode.trim(), [joinLeagueCode]);

  const fetchAllLeagues = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<unknown>("/api/league/allLeagues");
      setUserLeagues(normalizeAllLeaguesResponse(data));
    } catch (err) {
      console.error(err);
      setUserLeagues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data } = await api.get<Match[]>("/admin/api/matches/allmatches");
        const activeMatches = data.filter((m) => Number(m.status) === 1 || Number(m.status) === 2 || Number(m.status) === 3);
        setMatches(activeMatches);
      } catch (err) {
        console.error("Error fetching matches", err);
      }
    };
    fetchMatches();
    fetchAllLeagues();
  }, []);

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

  useEffect(() => {
    if (showJoinCenter) {
      fetchUnjoinedLeagues();
    }
  }, [showJoinCenter]);

  const handleJoinByCode = async () => {
    if (!trimmedJoinCode || !userId) return;
    try {
      await api.post("/api/league/joinLeagueByCode", {
        leagueCode: trimmedJoinCode,
        userId,
      });
      setShowJoinCenter(false);
      setJoinLeagueCode("");
      fetchAllLeagues();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid code. Please try again.";
      alert(msg);
    }
  };

  const handleJoinPublicLeague = async (leagueId: number) => {
    if (!userId) return;
    try {
      await api.post("/api/league/joinLeague", { leagueId, userId });
      fetchUnjoinedLeagues();
      fetchAllLeagues();
    } catch (err) {
      console.error("Error joining public league", err);
      alert("Failed to join this league. Please try again.");
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName || !userId) return;

    const openMatch = matches.find((m) => Number(m.status) === 1) || matches[0];
    if (!openMatch) {
      alert("No active races found to create a league. Please wait for the season to start!");
      return;
    }

    try {
      const { data } = await api.post<{ data: Record<string, unknown> }>("/api/league/createLeague", {
        leagueName: newLeagueName,
        templateId: Number(leagueType),
        maximumMembers: Number(maxMembers),
        matchId: openMatch.matchId,
        userId,
      });
      setCreatedLeagueData(data.data ?? null);
      setShowCreateModal(false);
      setShowSuccessOverlay(true);
      setNewLeagueName("");
      setLeagueType("1");
      setMaxMembers(10);
      fetchAllLeagues();
    } catch (err) {
      console.error("Create League API Error:", err);
      alert("Failed to create league. Please check your connection.");
    }
  };

  const handleCopyLink = () => {
    const code = (createdLeagueData?.leagueCode as string) || "F1-RACE";
    const link = `${window.location.origin}/league/${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteCode = (createdLeagueData?.leagueCode as string) || "F1-CODE";
  const shareLink = `${window.location.origin}/league/${inviteCode}`;
  const shareText = `Join my Formula 1 Prediction League: ${(createdLeagueData?.leagueName as string) || "Race"}! Use code: ${inviteCode}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4 font-outfit">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-400 font-medium tracking-widest uppercase text-xs italic">Loading leagues...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-12 font-outfit relative">
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md animate-in fade-in duration-300" />

          <div className="relative bg-neutral-900 border border-white/5 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-[0_0_80px_rgba(225,6,0,0.15)] animate-in zoom-in-95 duration-300">
            <div className="bg-red-600 p-8 flex flex-col items-center text-center space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-full bg-white/5 -skew-x-[30deg] translate-x-12" />
              <button
                type="button"
                onClick={() => setShowSuccessOverlay(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="bg-white/20 p-4 rounded-full mb-1 relative z-10">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black italic uppercase relative z-10 leading-none">League Ready!</h2>
              <p className="text-white/80 font-bold italic uppercase tracking-widest text-[9px] relative z-10">Leagues initialized and online</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-neutral-600">Access Token (Code)</Label>
                  <div className="bg-neutral-950 border border-white/5 p-4 rounded-xl flex items-center justify-between group">
                    <span className="font-mono text-3xl font-black italic text-red-600 tracking-tighter uppercase">{inviteCode}</span>
                    <Button
                      variant="ghost"
                      className="hover:bg-red-600/10 text-red-600 h-10 w-10 p-0"
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-white hover:text-white">Direct Link</Label>
                  <div className="bg-neutral-950 border border-white/5 p-4 rounded-xl flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold text-white hover:text-white truncate italic">{shareLink}</span>
                    <Button
                      size="sm"
                      type="button"
                      className="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest text-[9px] h-8 px-4 shrink-0 rounded-lg"
                      onClick={handleCopyLink}
                    >
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <Separator className="flex-1 bg-white/5" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white hover:text-white">Share with racers</span>
                  <Separator className="flex-1 bg-white/5" />
                </div>
                <div className="flex justify-center gap-4">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareLink)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 bg-neutral-950 border border-white/5 rounded-2xl hover:border-green-500 hover:bg-green-500/5 transition-all group"
                  >
                    <Send className="w-6 h-6 text-neutral-600 group-hover:text-green-500" />
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 bg-neutral-950 border border-white/5 rounded-2xl hover:border-red-600 hover:bg-red-600/5 transition-all group"
                  >
                    <Share2 className="w-6 h-6 text-neutral-600 group-hover:text-red-600" />
                  </a>
                  <a
                    href={`https://threads.net/intent/post?text=${encodeURIComponent(shareText + " " + shareLink)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 bg-neutral-950 border border-white/5 rounded-2xl hover:border-white hover:bg-white/5 transition-all group"
                  >
                    <Globe className="w-6 h-6 text-neutral-600 group-hover:text-white" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button
                  variant="outline"
                  type="button"
                  className="border-white/10 hover:bg-neutral-800 text-white hover:text-white font-black uppercase italic tracking-widest h-12 rounded-xl text-[9px]"
                  onClick={() => {
                    setShowSuccessOverlay(false);
                    navigate("/dashboard");
                  }}
                >
                  <LayoutDashboard className="w-3 h-3 mr-2" /> Home Page
                </Button>
                <Button
                  type="button"
                  className="bg-white text-black hover:bg-neutral-200 font-black uppercase italic tracking-widest h-12 rounded-xl text-[9px]"
                  onClick={() => {
                    setShowSuccessOverlay(false);
                    fetchAllLeagues();
                  }}
                >
                  Stay here <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-neutral-950/90 backdrop-blur-xl h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/dashboard")}>
            <div className="bg-red-600 p-1 rounded-sm group-hover:rotate-12 transition-transform">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-black tracking-tighter uppercase italic text-2xl">
              F1 <span className="text-red-600">Predictor</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <div className="text-[10px] text-white hover:text-white font-black uppercase tracking-[0.3em] italic">Player </div>
              <div className="text-sm font-bold text-neutral-200 italic">{username}</div>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:text-white hover:text-red-500 hover:bg-red-500/10 font-bold" onClick={() => navigate("/dashboard")}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-12 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600 italic">Leagues</p>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white mb-2">
              Your <span className="text-red-600">Leagues</span>
            </h1>
            <p className="text-neutral-500 font-medium italic text-white/60 max-w-xl">
              Public, private, sponsored, global, or mini — every league you&apos;ve joined or created lives here.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-black hover:bg-neutral-200 font-black uppercase italic h-14 px-8 rounded-none skew-x-[-10deg] shadow-lg shadow-white/10 text-lg"
            >
              <div className="skew-x-[10deg] flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Create League
              </div>
            </Button>
            <Button
              type="button"
              onClick={() => setShowJoinCenter(true)}
              variant="outline"
              className="border-red-600 border-2 bg-red-600/5 hover:bg-red-600 text-white font-black uppercase italic h-14 px-10 rounded-none skew-x-[-10deg] text-lg shadow-xl shadow-red-600/10"
            >
              <div className="skew-x-[10deg] flex items-center">
                <Flag className="w-5 h-5 mr-2 text-white" />
                Join League
              </div>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card
            className="relative bg-neutral-900 border-none hover:ring-2 hover:ring-red-600/50 transition-all group overflow-hidden shadow-2xl rounded-[2.5rem] lg:col-span-1 cursor-pointer"
            onClick={() => navigate("/leaderboard")}
          >
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-transparent" />
              <div className="absolute -top-16 -right-20 w-72 h-72 bg-red-600/10 blur-[80px]" />
            </div>

            <CardHeader className="relative z-10 border-b border-white/5 bg-neutral-950/30 py-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-neutral-300 italic flex items-center gap-2">
                  <Globe className="w-4 h-4 text-red-600" /> Global Standings
                </CardTitle>
                <Badge className="bg-neutral-800 text-neutral-300 border-none text-[8px] font-black uppercase tracking-widest italic">All Players</Badge>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 p-6">
              <p className="text-neutral-500 font-medium italic mb-6 text-white/60">
                See season rankings and match performance across everyone.
              </p>
              <div className="inline-flex items-center gap-2 text-red-500 font-black uppercase italic tracking-widest text-[10px]">
                View standings <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/40 rounded-[3rem] p-0 border border-white/5 relative overflow-hidden lg:col-span-2">
            <div className="absolute top-0 right-0 w-[40%] h-full bg-red-600/5 blur-[120px] pointer-events-none" />
            <CardHeader className="border-b border-white/5 bg-neutral-950/20 py-5 relative z-10">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-neutral-300 italic flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-600" /> Your leagues
                </CardTitle>
                <Badge className="bg-neutral-800 text-neutral-300 border-none text-[8px] font-black uppercase tracking-widest italic">
                  {userLeagues.length} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 relative z-10">
              {userLeagues.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mb-4">
                    <Flag className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="font-black italic uppercase text-neutral-200 mb-1 tracking-tight">No leagues yet</div>
                  <p className="text-sm text-neutral-500 italic mb-6 text-white/60">Create one or browse the join center.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest h-11 px-5 rounded-xl shadow-lg shadow-red-600/20"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create league
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowJoinCenter(true)}
                      variant="outline"
                      className="border-white/10 hover:bg-neutral-800 text-neutral-200 font-black uppercase italic tracking-widest h-11 px-5 rounded-xl"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Join center
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userLeagues.map((league) => {
                    const meta = getLeagueKindMeta(league.template?.name);
                    const canOpen = true; // All joined leagues can be opened to view leaderboard
                    const host = league.user?.username;
                    return (
                      <div
                        key={league.id}
                        role={canOpen ? "button" : undefined}
                        tabIndex={canOpen ? 0 : undefined}
                        onClick={() => {
                          if (canOpen) navigate(`/league/season-leaderboard/${league.id}`);
                        }}
                        onKeyDown={(e) => {
                          if (canOpen && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            navigate(`/league/season-leaderboard/${league.id}`);
                          }
                        }}
                        className={cn(
                          "p-6 bg-neutral-950/60 border border-white/5 rounded-none skew-x-[-5deg] transition-all flex flex-col gap-3 shadow-xl",
                          meta.rowAccent,
                          canOpen
                            ? "hover:bg-neutral-950 cursor-pointer group"
                            : "opacity-90 cursor-not-allowed border-dashed"
                        )}
                      >
                        <div className="skew-x-[5deg] flex items-start justify-between gap-3 min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 bg-red-600/5 rounded-sm flex items-center justify-center border border-red-600/10 group-hover:bg-red-600/20 transition-colors shadow-inner shrink-0">
                              <Flag className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-black italic uppercase tracking-tight text-lg text-neutral-100 truncate group-hover:text-red-500 transition-colors">
                                {league.leagueName}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest border", meta.badgeClass)}>
                                  {meta.label}
                                </Badge>
                                {league.template?.name && meta.kind === "unknown" && (
                                  <Badge variant="outline" className="border-neutral-700 text-neutral-400 text-[8px] font-black uppercase">
                                    {league.template.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-6 h-6 text-neutral-800 group-hover:text-red-600 group-hover:translate-x-1 transition-all shrink-0" />
                        </div>
                        <div className="skew-x-[5deg] flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-white hover:text-white font-bold uppercase tracking-widest italic">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {league.membersCount} members
                          </span>
                          {host && (
                            <>
                              <span>•</span>
                              <span>
                                Host <span className="text-neutral-300">{host}</span>
                              </span>
                            </>
                          )}
                          {league.leagueCode && (
                            <>
                              <span>•</span>
                              <code className="text-white font-bold">{league.leagueCode}</code>
                            </>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator className="bg-neutral-900 mb-2" />
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white p-8 rounded-[2rem] max-w-md font-outfit">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black italic uppercase">Create League</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLeague} className="space-y-6 py-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                League Name
              </Label>
              <Input
                id="name"
                placeholder="E.g. Speed Kings"
                className="bg-neutral-950 border-neutral-800 h-12 text-white focus:border-red-600 transition-colors rounded-lg text-sm"
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">League Type</Label>
              <RadioGroup value={leagueType} onValueChange={setLeagueType} className="grid grid-cols-2 gap-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLeagueType("1")}
                  onKeyDown={(e) => e.key === "Enter" && setLeagueType("1")}
                  className={cn(
                    "flex flex-col items-center justify-between rounded-lg border-2 bg-neutral-950 p-4 cursor-pointer transition-all",
                    leagueType === "1" ? "border-red-600 bg-red-600/5" : "border-neutral-800 hover:bg-neutral-900"
                  )}
                >
                  <Lock className={cn("mb-2 h-5 w-5", leagueType === "1" ? "text-red-600" : "text-neutral-600")} />
                  <span className={cn("font-black italic uppercase text-[10px]", leagueType === "1" ? "text-white" : "text-neutral-500")}>Private</span>
                  <RadioGroupItem value="1" className="sr-only" />
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLeagueType("2")}
                  onKeyDown={(e) => e.key === "Enter" && setLeagueType("2")}
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
                <Label htmlFor="max" className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Max Members
                </Label>
                <span className="text-red-600 font-mono font-bold text-xs">{maxMembers}</span>
              </div>
              <Input
                id="max"
                type="number"
                min={2}
                max={99999}
                className="bg-neutral-950 border-neutral-800 h-12 text-white focus:border-red-600 transition-colors rounded-lg text-sm"
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit" className="bg-red-600 hover:bg-red-700 w-full h-14 font-black uppercase italic tracking-widest text-white shadow-lg shadow-red-600/20 text-base rounded-xl">
                Create League
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showJoinCenter}
        onOpenChange={(val) => {
          setShowJoinCenter(val);
          if (val) fetchUnjoinedLeagues();
        }}
      >
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white p-6 rounded-[2rem] max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black italic uppercase text-center">Join Center</DialogTitle>
            <DialogDescription className="text-white hover:text-white font-medium italic text-center text-[10px]">Browse public groups or enter a code.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="browse" className="w-full flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 bg-neutral-950 p-1 h-12 rounded-xl mb-4">
              <TabsTrigger
                value="browse"
                className="font-black uppercase italic tracking-widest text-[10px] data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all rounded-lg"
              >
                Available
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className="font-black uppercase italic tracking-widest text-[10px] data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all rounded-lg"
              >
                Use Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="flex-1 overflow-y-auto pr-2 mt-0 space-y-3">
              {loadingUnjoined ? (
                <div className="py-12 text-center animate-pulse text-white hover:text-white font-bold italic uppercase tracking-widest text-[10px]">Looking for leagues...</div>
              ) : unjoinedLeagues.length > 0 ? (
                unjoinedLeagues.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between group hover:border-red-600/50 transition-all"
                  >
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
                      type="button"
                      onClick={() => handleJoinPublicLeague(l.id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest text-[9px] h-9 px-4 rounded-lg"
                    >
                      Join
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-neutral-600 text-[10px] italic">You&apos;ve joined all available leagues!</div>
              )}
            </TabsContent>

            <TabsContent value="code" className="mt-0 py-6 px-4 flex flex-col items-center justify-center space-y-6">
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    Invite Code
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                    <Input
                      id="code"
                      placeholder="CODE-1234"
                      className="bg-neutral-950 border-neutral-800 h-14 pl-10 text-xl text-white focus:border-red-600 transition-colors uppercase font-mono tracking-widest rounded-lg"
                      value={joinLeagueCode}
                      onChange={(e) => setJoinLeagueCode(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
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
  );
}
