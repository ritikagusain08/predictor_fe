import { useState, useEffect } from "react";
import { api } from "../api/api";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  ChevronLeft, 
  Medal, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Flag, 
  Timer,
  ShieldCheck,
  User,
  Settings,
  LogOut,
  UserMinus,
  Edit3,
  Check,
  Trash2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Match {
  matchId: number;
  gamedayId: number;
  circuitLocation: string;
  status: number;
}

interface LeagueMember {
  id: number;
  userId: string;
  isAdmin: boolean;
  user: {
    username: string;
  };
}

interface LeagueInfo {
  id: number;
  leagueName: string;
  membersCount: number;
  template?: {
    name: string;
    allowAdminDelete?: boolean;
    allowMemberRemoval?: boolean;
    allowRenaming?: boolean;
    allowUserLeave?: boolean;
    requireLeagueCode?: boolean;
  };
  user?: {
    username: string;
  };
  members?: LeagueMember[];
}

export default function LeagueLeaderboard() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [leagueInfo, setLeagueInfo] = useState<LeagueInfo | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("season");
  
  // Management States
  const [isEditingName, setIsEditingName] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId");

  const fetchLeagueInfo = async () => {
    if (!leagueId) return;
    try {
      const infoRes = await api.get(`/api/league/getLeagueInfo`, { params: { leagueId } });
      setLeagueInfo(infoRes.data.data);
      setNewLeagueName(infoRes.data.data.leagueName);
    } catch (err) {
      console.error("Error fetching league info:", err);
    }
  };

  const fetchInitialData = async () => {
    if (!leagueId) return;
    try {
      await fetchLeagueInfo();
      const matchesRes = await api.get<Match[]>("/admin/api/matches/allmatches");
      const completedMatches = (matchesRes.data || []).filter(m => Number(m.status) === 4);
      const sortedMatches = completedMatches.sort((a, b) => a.gamedayId - b.gamedayId);
      setMatches(sortedMatches);
    } catch (err) {
      console.error("Error fetching initial data:", err);
    }
  };

  const fetchRankings = async () => {
    if (!leagueId) return;
    try {
      setLoading(true);
      let endpoint = `/api/leaderboard/league/season-leaderboard/${leagueId}`;
      if (selectedMatchId !== "season") {
        endpoint = `/api/leaderboard/league/${leagueId}/${selectedMatchId}`;
      }
      const { data } = await api.get(endpoint);
      setRankings(data.data || []);
    } catch (err) {
      console.error("Error fetching rankings:", err);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [leagueId]);

  useEffect(() => {
    fetchRankings();
  }, [leagueId, selectedMatchId]);

  const handleUpdateName = async () => {
    if (!leagueId || !newLeagueName.trim()) return;
    try {
      setIsUpdating(true);
      await api.put("/api/league/updateLeague", {
        id: Number(leagueId),
        leagueName: newLeagueName.trim()
      });
      await fetchLeagueInfo();
      setIsEditingName(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update league name.";
      alert(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!leagueId) return;
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await api.post("/api/league/removeMember", {
        leagueId: Number(leagueId),
        memberId
      });
      await fetchLeagueInfo();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to remove member.";
      alert(msg);
    }
  };

  const handleLeaveLeague = async () => {
    if (!leagueId) return;
    if (!window.confirm("Are you sure you want to leave this league?")) return;
    try {
      await api.put("/api/league/disjoinLeague", {
        leagueId: Number(leagueId)
      });
      navigate("/leagues");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to leave league.";
      alert(msg);
    }
  };

  const handleDeleteLeague = async () => {
    if (!leagueId) return;
    if (!window.confirm("CRITICAL ACTION: Are you sure you want to DISBAND this league? This will remove all records for all members. This cannot be undone.")) return;
    try {
      await api.post("/api/league/deleteLeague", {
        leagueId: Number(leagueId)
      });
      navigate("/leagues");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete league.";
      alert(msg);
    }
  };

  const currentMember = leagueInfo?.members?.find(m => m.userId === currentUserId);
  const isAdmin = currentMember?.isAdmin || false;
  const isHost = leagueInfo ? (String((leagueInfo as any).userId) === currentUserId || isAdmin) : false;
  
  // Configurable permissions based on template
  const canRename = (isAdmin || isHost) && (leagueInfo?.template?.allowRenaming !== false);
  const canRemoveMember = (isAdmin || isHost) && (leagueInfo?.template?.allowMemberRemoval !== false);
  const canDeleteLeague = (isAdmin || isHost) && (leagueInfo?.template?.allowAdminDelete !== false);
  const canLeave = !isHost && (leagueInfo?.template?.allowUserLeave !== false) && Boolean(leagueInfo?.template?.name?.toUpperCase().includes("PRIVATE"));

  const getRankStyle = (index: number) => {
    if (index === 0) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]";
    if (index === 1) return "bg-slate-300/10 text-slate-300 border-slate-300/20 shadow-[0_0_15px_rgba(203,213,225,0.1)]";
    if (index === 2) return "bg-orange-400/10 text-orange-400 border-orange-400/20 shadow-[0_0_15px_rgba(251,146,60,0.1)]";
    return "bg-neutral-900/50 text-neutral-500 border-neutral-800";
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Medal className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" />;
    if (index === 2) return <Medal className="w-5 h-5 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-20 font-outfit relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[500px] bg-red-600/5 blur-[120px] pointer-events-none" />
      
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-neutral-950/90 backdrop-blur-xl h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/dashboard")}>
            <div className="bg-red-600 p-1 rounded-sm group-hover:rotate-12 transition-transform shadow-lg shadow-red-600/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-black tracking-tighter uppercase italic text-2xl">
              F1 <span className="text-red-600">Predictor</span>
            </span>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:text-white hover:text-red-500 hover:bg-red-500/10 font-bold group" 
            onClick={() => navigate("/leagues")}
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to League
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-12 space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-600/20 shadow-2xl shadow-red-600/10 shrink-0">
               <Flag className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600 italic">League Hub</p>
                {leagueInfo?.template?.name && (
                   <Badge className="bg-neutral-800 text-neutral-400 border-none text-[8px] font-black uppercase tracking-widest px-2 h-4">
                     {leagueInfo.template.name}
                   </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mb-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      value={newLeagueName} 
                      onChange={e => setNewLeagueName(e.target.value)}
                      className="bg-neutral-900 border-white/10 text-2xl font-black uppercase italic tracking-tighter h-12 w-64"
                    />
                    <Button size="icon" className="bg-green-600 hover:bg-green-700 h-12 w-12" onClick={handleUpdateName} disabled={isUpdating}>
                       {isUpdating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-12 w-12 text-white hover:text-white" onClick={() => { setIsEditingName(false); setNewLeagueName(leagueInfo?.leagueName || ""); }}>
                       <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ) : (
                  <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none flex items-center gap-4">
                    {leagueInfo?.leagueName || "League Standings"}
                    {canRename && (
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:text-white hover:text-white" onClick={() => setIsEditingName(true)}>
                        <Edit3 className="w-5 h-5" />
                      </Button>
                    )}
                  </h1>
                )}
              </div>
              <div className="flex items-center gap-4 text-white hover:text-white font-bold uppercase tracking-widest italic text-[10px]">
                <span className="flex items-center gap-1.5">
                   <Users className="w-3.5 h-3.5 text-red-600" />
                   <span className="text-neutral-300">{leagueInfo?.membersCount || 0}</span> Racers
                </span>
                {leagueInfo?.user?.username && (
                   <>
                    <span>•</span>
                    <span>Host <span className="text-neutral-300">{leagueInfo.user.username}</span></span>
                   </>
                )}
              </div>
            </div>
          </div>

          {canLeave && (
            <Button variant="outline" className="border-red-600/30 text-red-500 hover:bg-red-600 hover:text-white h-12 px-6 rounded-xl font-black uppercase italic tracking-widest text-[10px]" onClick={handleLeaveLeague}>
              <LogOut className="w-4 h-4 mr-2" /> Leave League
            </Button>
          )}
        </div>

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="bg-neutral-900/50 p-1 rounded-2xl border border-white/5 h-14 mb-8">
            <TabsTrigger value="leaderboard" className="rounded-xl font-black uppercase italic tracking-widest text-xs px-8 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all">
              <Trophy className="w-4 h-4 mr-2" /> Leaderboard
            </TabsTrigger>
            <TabsTrigger value="management" className="rounded-xl font-black uppercase italic tracking-widest text-xs px-8 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all">
              <Settings className="w-4 h-4 mr-2" /> League Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-6">
            <div className="flex justify-end">
              <div className="w-full md:w-64 space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-white hover:text-white italic ml-1">Rankings View</Label>
                 <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                    <SelectTrigger className="bg-neutral-900 border-white/5 h-14 rounded-xl text-neutral-200 font-bold italic">
                       <SelectValue placeholder="Select View" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/5 text-neutral-200 font-bold italic">
                       <SelectItem value="season">
                          <div className="flex items-center gap-2">
                             <TrendingUp className="w-4 h-4 text-red-600" /> Season Overall
                          </div>
                       </SelectItem>
                       {matches.map(m => (
                          <SelectItem key={m.matchId} value={m.matchId.toString()}>
                             <div className="flex items-center gap-2">
                                <Timer className="w-4 h-4 text-neutral-500" /> Rd {m.gamedayId}: {m.circuitLocation}
                             </div>
                          </SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>
            </div>

            <Card className="bg-neutral-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-neutral-950/40 border-b border-white/5">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="w-24 pl-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 italic">Pos</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 italic pl-12">Player</TableHead>
                      <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 italic">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-white/5"><TableCell colSpan={3} className="py-8 px-8"><Skeleton className="h-10 w-full bg-neutral-800" /></TableCell></TableRow>
                      ))
                    ) : rankings.length > 0 ? (
                      rankings.map((r, index) => (
                        <TableRow key={index} className="border-white/5 group hover:bg-white/[0.02] transition-colors">
                          <TableCell className="pl-8 py-5">
                            <div className={cn("w-11 h-11 rounded-xl border-2 flex items-center justify-center font-black text-lg transition-all", getRankStyle(index))}>
                              {getMedalIcon(index) || index + 1}
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                             <div className="flex items-center gap-4">
                               <div className="flex flex-col items-center justify-center min-w-[24px]">
                                  {r.trend === "UP" && <TrendingUp className="w-4 h-4 text-green-500 animate-in slide-in-from-bottom-1" />}
                                  {r.trend === "DOWN" && <TrendingDown className="w-4 h-4 text-red-600 animate-in slide-in-from-top-1" />}
                                  {(r.trend === "NEW" || r.trend === "STABLE" || !r.trend) && <Minus className="w-4 h-4 text-neutral-700" />}
                               </div>
                               <div className="w-10 h-10 rounded-full bg-neutral-950 border border-white/5 flex items-center justify-center text-[10px] font-black text-neutral-400 group-hover:text-red-500 uppercase italic transition-colors">
                                  {r.user?.username?.substring(0, 2).toUpperCase() || "??"}
                               </div>
                               <div className="flex flex-col">
                                 <span className="font-black text-lg uppercase italic text-neutral-200 group-hover:text-white transition-colors leading-none">
                                    {r.user?.username || "Unknown"}
                                 </span>
                                 {r.userId === currentUserId && (
                                   <span className="text-[8px] font-black text-red-600 uppercase tracking-widest mt-1">You</span>
                                 )}
                               </div>
                             </div>
                           </TableCell>
                          <TableCell className="text-right pr-8 py-5">
                             <span className="font-mono font-black text-3xl italic text-white tracking-tighter group-hover:text-red-500 transition-colors">
                               {r.points?.toLocaleString() || "0"}
                             </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="py-24 text-center opacity-30 font-black uppercase italic text-xs">No rankings available</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-neutral-950/40 p-8 border-b border-white/5 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter mb-1">Player Roster</CardTitle>
                    <p className="text-[10px] font-bold text-white hover:text-white uppercase italic tracking-widest">Active competitors in this league</p>
                  </div>
                  <Badge variant="outline" className="border-neutral-800 text-neutral-500 text-[10px] font-black uppercase">{leagueInfo?.members?.length || 0} Players</Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-white/5">
                    {leagueInfo?.members?.map((member, i) => (
                      <div key={i} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-white/5 flex items-center justify-center">
                            <User className="w-6 h-6 text-neutral-600" />
                          </div>
                          <div>
                            <p className="text-lg font-black uppercase italic text-neutral-200">{member.user.username}</p>
                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest italic">Member since Rd {leagueInfo?.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {member.isAdmin && (
                            <Badge className="bg-red-600/10 text-red-500 border-red-600/20 text-[10px] font-black uppercase px-3 py-1">
                              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Host
                            </Badge>
                          )}
                          {canRemoveMember && member.userId !== currentUserId && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-white hover:text-white hover:text-red-500 hover:bg-red-500/10"
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              <UserMinus className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] p-8">
                 <h3 className="text-sm font-black uppercase italic tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
                    <Info className="w-4 h-4 text-red-600" /> League Info
                 </h3>
                 <div className="space-y-4">
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600 mb-1">League ID</p>
                       <p className="text-sm font-mono font-bold text-neutral-300">#000{leagueInfo?.id}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600 mb-1">Race Type</p>
                       <p className="text-sm font-black uppercase italic text-white">{leagueInfo?.template?.name || "Standard"}</p>
                    </div>
                    <Separator className="bg-white/5 my-4" />
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600 mb-1">League Authority</p>
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[8px] font-black italic">
                             {leagueInfo?.user?.username?.substring(0,1).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-neutral-300">{leagueInfo?.user?.username}</span>
                       </div>
                    </div>
                 </div>
              </Card>

              {canDeleteLeague && (
                <div className="p-8 bg-red-600/5 border border-red-600/10 rounded-[2.5rem] space-y-6">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">Authority Actions</h3>
                   <p className="text-[10px] text-white hover:text-white font-medium italic leading-relaxed">As the League Host, you have full control over the league settings and members.</p>
                   <Button 
                    variant="outline" 
                    className="w-full border-red-600/50 text-red-500 hover:bg-red-600 hover:text-white h-12 rounded-xl font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-red-600/5"
                    onClick={handleDeleteLeague}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Disband League
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Info(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}
