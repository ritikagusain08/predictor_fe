import { useState, useEffect } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";
import type { Match } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  ChevronLeft, 
  Medal, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Timer,
  LayoutDashboard
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const [selectedMatchId, setSelectedMatchId] = useState<string>("overall");
  const [matches, setMatches] = useState<Match[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data } = await api.get<Match[]>("/admin/api/matches/allmatches");
        const sortedMatches = (data || []).sort((a, b) => b.gamedayId - a.gamedayId);
        setMatches(sortedMatches);
      } catch (err) {
        console.error("Error fetching matches:", err);
      }
    };
    fetchMatches();
  }, []);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        let endpoint = "/api/leaderboard/season-leaderboard";
        if (selectedMatchId !== "overall") {
          endpoint = `/api/leaderboard/${selectedMatchId}/match-leaderboard`;
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

    fetchRankings();
  }, [selectedMatchId]);

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
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[50%] h-[500px] bg-red-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent" />

      {/* Navigation */}
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
            className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 font-bold group" 
            onClick={() => navigate("/dashboard")}
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-12 space-y-10">
        {/* Global Standings Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-600/20 shadow-2xl shadow-red-600/10 relative group shrink-0">
               <div className="absolute inset-0 bg-red-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
               <Trophy className="w-10 h-10 text-red-600 relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600 italic">Global Hall of Fame</p>
                <Badge className="bg-neutral-800 text-neutral-400 border-none text-[8px] font-black uppercase tracking-widest px-2 h-4">
                  All Drivers
                </Badge>
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white mb-2 leading-none">
                World <span className="text-red-600">Standings</span>
              </h1>
              <p className="text-neutral-500 font-bold uppercase tracking-widest italic text-[10px]">
                Competing against every pilot on the global grid
              </p>
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="w-full md:w-64 space-y-2">
             <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 italic ml-1">Rankings View</Label>
             <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                <SelectTrigger className="bg-neutral-900 border-white/5 h-14 rounded-xl text-neutral-200 font-bold italic focus:ring-red-600/50">
                   <SelectValue placeholder="Select View" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/5 text-neutral-200 font-bold italic">
                   <SelectItem value="overall" className="focus:bg-red-600/10 focus:text-red-500">
                      <div className="flex items-center gap-2">
                         <TrendingUp className="w-4 h-4 text-red-600" />
                         Season Overall
                      </div>
                   </SelectItem>
                   <Separator className="my-1 bg-white/5" />
                   {matches.map(m => (
                      <SelectItem key={m.matchId} value={m.matchId.toString()} className="focus:bg-red-600/10 focus:text-red-500">
                         <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4 text-neutral-500" />
                            Rd {m.gamedayId}: {m.circuitLocation}
                         </div>
                      </SelectItem>
                   ))}
                </SelectContent>
             </Select>
          </div>
        </div>

        {/* Global Leaderboard Table Card */}
        <Card className="bg-neutral-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
          
          <CardHeader className="bg-neutral-950/40 py-6 px-8 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter">
                  {selectedMatchId === "overall" ? "Championship Standings" : "Grand Prix Results"}
                </CardTitle>
              </div>
              <Badge variant="outline" className="bg-red-600/10 border-red-600/20 text-red-500 text-[10px] font-black uppercase italic px-3 py-1">
                {rankings.length} Active Pilots
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-neutral-950/20 border-b border-white/5">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-24 pl-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 italic">Pos</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 italic pl-12">Pilot</TableHead>
                  <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 italic">Pts Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-white/5 bg-transparent">
                      <TableCell className="pl-8"><Skeleton className="h-10 w-10 rounded-lg bg-neutral-800" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-48 bg-neutral-800" /></TableCell>
                      <TableCell className="text-right pr-8"><Skeleton className="h-8 w-16 bg-neutral-800 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : rankings.length > 0 ? (
                  rankings.map((r, index) => (
                    <TableRow key={index} className="border-white/5 group hover:bg-white/[0.02] transition-colors relative">
                      <TableCell className="pl-8 py-5">
                        <div className={cn(
                          "w-11 h-11 rounded-xl border-2 flex items-center justify-center font-black text-lg transition-all group-hover:scale-110 group-hover:skew-x-[-10deg]",
                          getRankStyle(index)
                        )}>
                          <div className={cn(index < 3 ? "skew-x-0" : "skew-x-[10deg]")}>
                             {getMedalIcon(index) || index + 1}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center min-w-[24px]">
                             {r.trend === "UP" && <TrendingUp className="w-4 h-4 text-green-500 animate-in slide-in-from-bottom-1" />}
                             {r.trend === "DOWN" && <TrendingDown className="w-4 h-4 text-red-600 animate-in slide-in-from-top-1" />}
                             {(r.trend === "NEW" || r.trend === "STABLE" || !r.trend) && <Minus className="w-4 h-4 text-neutral-700" />}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-neutral-950 border border-white/5 flex items-center justify-center overflow-hidden group-hover:border-red-600/50 transition-colors">
                             <div className="text-[10px] font-black text-neutral-400 group-hover:text-red-500 uppercase italic">
                                {r.user?.username?.substring(0, 2).toUpperCase() || "??"}
                             </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-lg uppercase italic text-neutral-200 group-hover:text-white transition-colors leading-none mb-1">
                               {r.user?.username || "Unknown Racer"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8 py-5">
                        <div className="flex flex-col items-end">
                           <span className="font-mono font-black text-3xl italic text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:text-red-500 transition-colors">
                             {r.points?.toLocaleString() || "0"}
                           </span>
                           <span className="text-[8px] font-black text-neutral-600 uppercase tracking-[0.2em] italic">Total Pts</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-32 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-30">
                          <LayoutDashboard className="w-12 h-12 text-neutral-500" />
                          <p className="text-neutral-500 font-black uppercase italic tracking-widest text-[10px]">
                            No data points registered for this selection
                          </p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Footer Helper */}
        <div className="flex justify-center pt-4">
           <div className="inline-flex items-center gap-6 px-8 py-4 bg-neutral-900/40 border border-white/5 rounded-full backdrop-blur-sm">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 italic">Live Global Feed</span>
              </div>
              <Separator orientation="vertical" className="h-4 bg-white/10" />
              <p className="text-[10px] font-bold text-neutral-600 italic uppercase">
                 Standings are verified by FIA (Formula Interactive Association)
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}