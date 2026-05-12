import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trophy, ChevronLeft, Settings, Share2, Users, Crown, LogOut, Trash2, Copy, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  userId: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isDisjoined: boolean;
  isRemoved: boolean;
}

interface LeagueInfo {
  leagueId: number;
  leagueName: string;
  matchId: number;
  leagueCode: string;
  membersCount: number;
  allMembers: Member[];
}

export default function LeagueDetails() {
  const { leagueCode } = useParams<{ leagueCode: string }>();
  const [league, setLeague] = useState<LeagueInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId");

  const fetchLeagueInfo = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{ leagueInfo: LeagueInfo }>(`/api/privateLeague/getLeagueInfo/${leagueCode}`);
      setLeague(data.leagueInfo);
    } catch (err) {
      console.error("Error fetching league info", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leagueCode) {
      fetchLeagueInfo();
    }
  }, [leagueCode]);

  const currentUser = league?.allMembers.find(m => m.userId === currentUserId);
  const isAdmin = currentUser?.isAdmin || false;

  const handleLeaveLeague = async () => {
    try {
      await api.put("/api/privateLeague/disjoin", { userId: currentUserId, leagueCode });
      navigate("/leagues");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to leave league");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await api.put("/api/privateLeague/removeMember", { userId: currentUserId, leagueCode, memberId });
      fetchLeagueInfo();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to remove member");
    }
  };

  const handleDeleteLeague = async () => {
    try {
      await api.delete("/api/privateLeague/deleteLeague", { data: { userId: currentUserId, leagueCode } });
      navigate("/leagues");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete league");
    }
  };

  const copyCode = () => {
    if (league) {
      navigator.clipboard.writeText(league.leagueCode);
      // Success toast or alert can go here
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-neutral-400 font-medium tracking-widest uppercase text-xs">Accessing Arena Data...</p>
    </div>
  );

  if (!league) return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
      <ShieldAlert className="w-16 h-16 text-red-900 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Unauthorized Access</h2>
      <p className="text-neutral-500 mb-6">This league does not exist or you do not have permission to view it.</p>
      <Button onClick={() => navigate("/leagues")} variant="outline" className="border-neutral-800">Return to Lobby</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-12">
      {/* 🔹 HEADER */}
      <nav className="w-full border-b border-neutral-800 bg-neutral-950 h-16 flex items-center px-4 mb-8">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-white" onClick={() => navigate("/leagues")}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-3">
             <Trophy className="w-4 h-4 text-red-500" />
             <span className="font-black italic uppercase text-xs tracking-widest">League Arena</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-white" onClick={() => setShowShare(true)}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-white" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4">
        {/* 🔹 LEAGUE HERO */}
        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                 <Badge className="bg-red-600/10 text-red-500 border-red-500/20">Private Arena</Badge>
                 <Badge variant="outline" className="border-neutral-800 text-neutral-500 font-mono">{league.leagueCode}</Badge>
              </div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">{league.leagueName}</h1>
           </div>
           
           <div className="flex items-center gap-4 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800 backdrop-blur-sm self-center md:self-end">
              <div className="flex items-center gap-2 pr-4 border-r border-neutral-800">
                 <Users className="w-5 h-5 text-neutral-500" />
                 <div>
                    <div className="text-[10px] font-black uppercase text-neutral-600">Pilots</div>
                    <div className="text-lg font-bold leading-none">{league.membersCount}</div>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Crown className="w-5 h-5 text-yellow-500" />
                 <div>
                    <div className="text-[10px] font-black uppercase text-neutral-600">Leader</div>
                    <div className="text-lg font-bold leading-none">{league.allMembers[0]?.name || "---"}</div>
                 </div>
              </div>
           </div>
        </div>

        {/* 🔹 MEMBERS LIST TABLE */}
        <Card className="bg-neutral-900/40 border-neutral-800 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-neutral-800/50">
             <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
               <Users className="w-4 h-4" /> Member Roster
             </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-neutral-950/50">
                <TableRow className="border-neutral-800 hover:bg-transparent">
                  <TableHead className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest">Pilot</TableHead>
                  <TableHead className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest hidden md:table-cell">Contact</TableHead>
                  <TableHead className="text-right text-neutral-500 font-bold uppercase text-[10px] tracking-widest">Authority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {league.allMembers.map((member) => (
                  <TableRow key={member.userId} className={cn("border-neutral-800 group", member.userId === currentUserId && "bg-red-600/5")}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                         <div className={cn(
                           "w-10 h-10 rounded-xl flex items-center justify-center font-bold border transition-colors",
                           member.isAdmin ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" : "bg-neutral-800 border-neutral-700 text-neutral-400"
                         )}>
                            {member.name.substring(0, 2).toUpperCase()}
                         </div>
                         <div>
                            <div className="font-bold text-neutral-200">
                               {member.name} {member.userId === currentUserId && <span className="text-[10px] text-red-500 ml-1 font-black uppercase tracking-widest">(You)</span>}
                            </div>
                            <div className="text-[10px] text-neutral-600 md:hidden">{member.email}</div>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                       <span className="text-sm text-neutral-500">{member.email}</span>
                    </TableCell>
                    <TableCell className="text-right">
                       {member.isAdmin ? (
                         <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px] uppercase font-black">Admin</Badge>
                       ) : (
                         <Badge variant="outline" className="text-neutral-600 border-neutral-800 text-[10px] uppercase font-black">Pilot</Badge>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 🔹 FOOTER INVITE */}
        <div className="mt-8 p-6 bg-gradient-to-r from-red-600/10 to-transparent border border-red-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center border border-red-500/30">
                 <Share2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                 <div className="font-bold text-white">Expand your arena</div>
                 <p className="text-xs text-neutral-500">Invite more pilots to compete using the unique entry code.</p>
              </div>
           </div>
           <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-2xl border border-neutral-800 w-full md:w-auto">
              <code className="px-3 font-mono font-bold text-red-400 text-lg">{league.leagueCode}</code>
              <Button size="icon" onClick={copyCode} variant="ghost" className="hover:bg-neutral-800 text-neutral-500 hover:text-white">
                 <Copy className="w-4 h-4" />
              </Button>
           </div>
        </div>
      </div>

      {/* 🔹 SETTINGS DIALOG */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
           <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                 <Settings className="w-5 h-5 text-neutral-500" />
                 Arena Settings
              </DialogTitle>
              <DialogDescription>Modify league properties or manage pilot access.</DialogDescription>
           </DialogHeader>
           
           <div className="space-y-6 py-4">
              <div className="space-y-2">
                 <Label className="text-xs font-black uppercase tracking-widest text-neutral-500">Pilot List</Label>
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {league.allMembers.map((m) => (
                       <div key={m.userId} className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold">
                                {m.name.substring(0,2).toUpperCase()}
                             </div>
                             <span className="text-sm font-medium">{m.name} {m.userId === currentUserId && "(You)"}</span>
                          </div>
                          {isAdmin && m.userId !== currentUserId && !m.isAdmin && (
                             <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:bg-red-500/10 hover:text-red-400 h-8 px-2"
                              onClick={() => { if(window.confirm(`Remove ${m.name}?`)) handleRemoveMember(m.userId) }}
                             >
                                <Trash2 className="w-4 h-4" />
                             </Button>
                          )}
                       </div>
                    ))}
                 </div>
              </div>

              <Separator className="bg-neutral-800" />
              
              <div className="space-y-3">
                 {isAdmin ? (
                    <Button 
                      variant="destructive" 
                      className="w-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20"
                      onClick={() => { if(window.confirm("CRITICAL: Delete this league?")) handleDeleteLeague() }}
                    >
                       <Trash2 className="w-4 h-4 mr-2" /> Delete Arena Permanently
                    </Button>
                 ) : (
                    <Button 
                      variant="outline" 
                      className="w-full border-neutral-800 hover:bg-red-500/10 hover:text-red-500"
                      onClick={() => { if(window.confirm("Leave this league?")) handleLeaveLeague() }}
                    >
                       <LogOut className="w-4 h-4 mr-2" /> Leave Arena
                    </Button>
                 ) }
              </div>
           </div>
        </DialogContent>
      </Dialog>

      {/* 🔹 SHARE DIALOG */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-sm">
           <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                 <Share2 className="w-5 h-5 text-red-500" />
                 Invite Pilots
              </DialogTitle>
              <DialogDescription>Share this code with your friends to bring them into the race.</DialogDescription>
           </DialogHeader>
           
           <div className="flex flex-col items-center gap-6 py-6">
              <div className="text-center">
                 <div className="text-[10px] font-black uppercase text-neutral-600 tracking-widest mb-2">Arena Entry Code</div>
                 <div className="text-5xl font-black italic uppercase tracking-tighter text-red-500 bg-red-500/5 px-6 py-3 rounded-2xl border border-red-500/20">
                    {league.leagueCode}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                 <Button variant="outline" className="border-neutral-800" onClick={copyCode}>
                    <Copy className="w-4 h-4 mr-2" /> Copy
                 </Button>
                 <Button className="bg-red-600 hover:bg-red-700 font-bold" onClick={() => window.open(`mailto:?subject=Join my F1 Private League!&body=Hey! Compete with me in our F1 Private League. Join using code: ${league.leagueCode}`)}>
                    Email Invite
                 </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
