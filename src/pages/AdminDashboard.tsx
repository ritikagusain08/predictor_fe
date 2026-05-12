import { useState, useEffect } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";
import type { Match } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Trophy, 
  Settings, 
  Flag, 
  ListTodo, 
  Calculator, 
  ChevronRight, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Timer,
  LogOut,
  Users,
  Search,
  Trash2,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Player {
  playerId: string;
  playerName: string;
}

interface Team {
  teamId: string;
  teamName: string;
}

interface OptionData {
  id?: number;     
  optionId: number; 
  optionDesc: string;
  points: number;
  position: number;
  isCorrect: boolean;
}

interface QuestionData {
  id: number;
  questionNo: number;
  questionDescription: string;
  questionType: string;
  choiceLimit: number;
  questionStatus: number;
  matchId: number;
  options: OptionData[];
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("questions"); 
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  // Manage Questions State
  const [viewMatchId, setViewMatchId] = useState<number>(0);
  const [questionsList, setQuestionsList] = useState<QuestionData[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);
  const [resolvingQuestion, setResolvingQuestion] = useState<QuestionData | null>(null);

  // Create Question State
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState<number>(0);
  const [questionNo, setQuestionNo] = useState<number>(1);
  const [description, setDescription] = useState("");
  const [type, setType] = useState("SINGLE OPTION");
  const [limit, setLimit] = useState(1);
  const [status, setStatus] = useState(0); 
  const [options, setOptions] = useState<OptionData[]>([
    { optionId: 1, optionDesc: "", points: 0, position: 0, isCorrect: false }
  ]);
  const [showDriverSelector, setShowDriverSelector] = useState(false);
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  
  // League Type State
  const [leagueTypeName, setLeagueTypeName] = useState("");
  const [requireCode, setRequireCode] = useState(true);
  const [isSearchable, setIsSearchable] = useState(true);
  const [allowLeave, setAllowLeave] = useState(true);
  const [allowRename, setAllowRename] = useState(true);
  const [allowDelete, setAllowDelete] = useState(true);
  const [allowMemberRemoval, setAllowMemberRemoval] = useState(true);
  const [creatorRole, setCreatorRole] = useState("ADMIN");
  const [hasMatchRange, setHasMatchRange] = useState(true);
  const [maxMembers, setMaxMembers] = useState(0);
  const [maxLeagues, setMaxLeagues] = useState(0);

  // League Sub-tabs
  const [leagueSubTab, setLeagueSubTab] = useState("list");
  const [leagueTypesList, setLeagueTypesList] = useState<any[]>([]);
  const [selectedLeagueType, setSelectedLeagueType] = useState<any | null>(null);
  const [editingLeagueType, setEditingLeagueType] = useState<any | null>(null);
  const [adminLeaguesList, setAdminLeaguesList] = useState<any[]>([]);
  const [selectedAdminLeague, setSelectedAdminLeague] = useState<any | null>(null);
  const [adminLeagueSubTab, setAdminLeagueSubTab] = useState("list");
  const [editingAdminLeague, setEditingAdminLeague] = useState<any | null>(null);
  
  // Admin League Form State
  const [adminLeagueName, setAdminLeagueName] = useState("");
  const [adminTemplateId, setAdminTemplateId] = useState(0);
  const [adminMaxMembers, setAdminMaxMembers] = useState(0);
  const [adminStartMatchId, setAdminStartMatchId] = useState(0);
  const [adminEndMatchId, setAdminEndMatchId] = useState(0);
  const [adminCreatedAtMatchId, setAdminCreatedAtMatchId] = useState(0);

  useEffect(() => {
    api.get("/admin/api/matches/allmatches").then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      const sortedMatches = list.sort((a: Match, b: Match) => a.matchId - b.matchId);
      setMatches(sortedMatches);
    }).catch(err => console.error("Matches Fetch Error:", err));

    api.get("/admin/api/players/allplayers").then((res) => {
      setPlayers(Array.isArray(res.data) ? res.data : []);
    }).catch(err => console.error("Players Fetch Error:", err));

    api.get("/admin/api/teams/allteams").then((res) => {
      setTeams(Array.isArray(res.data) ? res.data : []);
    }).catch(err => console.error("Teams Fetch Error:", err));
  }, []);

  // Fetch questions when match selection changes
  useEffect(() => {
    if (viewMatchId > 0 && activeTab === "questions" && !resolvingQuestion) {
      fetchQuestions(viewMatchId);
    }
  }, [viewMatchId, activeTab, resolvingQuestion]);

  useEffect(() => {
    if (activeTab === "leaguetypes" && leagueSubTab === "list") {
      fetchLeagueTypes();
    }
    if (activeTab === "adminleagues") {
      fetchAdminLeagues();
      fetchLeagueTypes(); // To populate template dropdown
    }
  }, [activeTab, leagueSubTab, adminLeagueSubTab]);

  const fetchQuestions = async (mId: number) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/api/questions/${mId}`);
      console.log("DEBUG: Fetched Questions Data:", data); 
      // Sort questions by questionNo in ascending order
      const sortedQuestions = data.sort((a: QuestionData, b: QuestionData) => a.questionNo - b.questionNo);
      setQuestionsList(sortedQuestions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueTypes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/api/adminleaguetype/alladminleaguetypes");
      // Handle both [ ... ] and { data: [ ... ] } formats
      const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setLeagueTypesList(list);
    } catch (err) {
      console.error("Fetch League Types Error:", err);
      setLeagueTypesList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeagueType = async (id: number) => {
    if (!confirm("Are you sure you want to delete this league type? This cannot be undone.")) return;
    try {
      setLoading(true);
      await api.delete(`/admin/api/adminleaguetype/${id}`);
      alert("League Type deleted successfully!");
      fetchLeagueTypes();
    } catch (err) {
      console.error(err);
      alert("Failed to delete league type");
    } finally {
      setLoading(false);
    }
  };

  const startEditLeagueType = (type: any) => {
    setEditingLeagueType(type);
    setLeagueTypeName(type.name);
    setRequireCode(type.requireLeagueCode);
    setIsSearchable(type.isSearchable);
    setAllowLeave(type.allowUserLeave);
    setAllowRename(type.allowRenaming);
    setAllowDelete(type.allowAdminDelete);
    setAllowMemberRemoval(type.allowMemberRemoval);
    setCreatorRole(type.creatorRole);
    setHasMatchRange(type.hasMatchRange);
    setMaxMembers(type.defaultMaxMembers);
    setMaxLeagues(type.maxLeaguesPerUser);
    setLeagueSubTab("types");
  };

  const fetchAdminLeagues = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/api/adminleague/adminleague");
      const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setAdminLeaguesList(list);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdminLeague = async (id: number) => {
    if (!confirm("Delete this admin league?")) return;
    try {
      setLoading(true);
      await api.delete("/admin/adminleague/delete", { data: { id } });
      alert("League deleted!");
      fetchAdminLeagues();
    } catch (err) {
      alert("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const startEditAdminLeague = (league: any) => {
    setEditingAdminLeague(league);
    setAdminLeagueName(league.leagueName);
    setAdminTemplateId(league.templateId);
    setAdminMaxMembers(league.maximumMembers);
    setAdminStartMatchId(league.startMatchId);
    setAdminEndMatchId(league.endMatchId);
    setAdminCreatedAtMatchId(league.createdAtMatchId);
    setAdminLeagueSubTab("setup");
  };

  const getStatusLabel = (s: number) => {
    if (s === 0) return "NOT STARTED";
    if (s === 1) return "OPEN";
    if (s === 2) return "LOCKED";
    if (s === 3) return "PC STARTED";
    if (s === 4) return "PC DONE";
    return "Unknown";
  };

  const handleStatusChange = async (question: QuestionData, newStatus: number) => {
    try {
      setLoading(true);
      const payload = { questionStatus: newStatus };
      await api.put(`/admin/api/questions/${question.id}/status`, payload);
      alert(`Status updated to ${getStatusLabel(newStatus)}`);
      setQuestionsList(prev => prev.map(q => q.id === question.id ? { ...q, questionStatus: newStatus } : q));
    } catch (err: any) {
      console.error("Status Update Failed Detials:", err);
      alert(`Failed to update status`);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === "PODIUM") {
      setLimit(3);
      setOptions([]); 
      setShowDriverSelector(false);
      setShowTeamSelector(false);
      setSelectedDriverIds([]);
      setSelectedTeamIds([]);
    } else if (["PICK ONE OR MORE DRIVERS/CONSTUCTORS", "MULTI OPTION CHECKBOX", "SINGLE OPTION", "H2H"].includes(newType)) {
      setLimit(newType === "SINGLE OPTION" || newType === "H2H" ? 1 : 3);
      setOptions([]);
      setShowDriverSelector(false);
      setShowTeamSelector(false);
    } else {
      setLimit(1);
      setOptions([{ optionId: 1, optionDesc: "", points: 0, position: 0, isCorrect: false }]);
      setShowDriverSelector(false);
      setShowTeamSelector(false);
    }
  };

  const handleAddSelectedDrivers = () => {
    const newDrivers = players.filter(p => selectedDriverIds.includes(p.playerId));
    setOptions(prev => [
      ...prev,
      ...newDrivers.map((player, index) => ({
        optionId: prev.length + index + 1, // Use sequential for IDs initially
        optionDesc: player.playerName,
        points: 0,
        position: prev.length + index,
        isCorrect: false
      }))
    ]);
    setSelectedDriverIds([]);
    setShowDriverSelector(false);
  };

  const handleAddSelectedTeams = () => {
    const newTeams = teams.filter(t => selectedTeamIds.includes(t.teamId));
    setOptions(prev => [
      ...prev,
      ...newTeams.map((team, index) => ({
        optionId: prev.length + index + 1,
        optionDesc: team.teamName,
        points: 0,
        position: prev.length + index,
        isCorrect: false
      }))
    ]);
    setSelectedTeamIds([]);
    setShowTeamSelector(false);
  };

  // Removed unused toggleSelectAllDrivers and toggleSelectAllTeams functions

  const handleDriverToggle = (pId: string) => {
    if (selectedDriverIds.includes(pId)) {
      setSelectedDriverIds(selectedDriverIds.filter(id => id !== pId));
    } else {
      setSelectedDriverIds([...selectedDriverIds, pId]);
    }
  };

  const handleTeamToggle = (tId: string) => {
    if (selectedTeamIds.includes(tId)) {
      setSelectedTeamIds(selectedTeamIds.filter(id => id !== tId));
    } else {
      setSelectedTeamIds([...selectedTeamIds, tId]);
    }
  };

  const addOption = () => setOptions([...options, { optionId: options.length + 1, optionDesc: "", points: 0, position: options.length, isCorrect: false }]);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  const handleOptionChange = (index: number, f: keyof OptionData, v: any) => {
    const n = [...options]; n[index] = { ...n[index], [f]: v }; setOptions(n);
  };

  const handleEditQuestion = (q: QuestionData) => {
    setEditingQuestion(q);
    setMatchId(q.matchId);
    setQuestionNo(q.questionNo);
    setDescription(q.questionDescription);
    setType(q.questionType);
    setLimit(q.choiceLimit);
    setStatus(q.questionStatus);
    setOptions(q.options.map(opt => ({ 
      id: opt.id, 
      optionId: opt.optionId, 
      optionDesc: opt.optionDesc, 
      points: opt.points, 
      position: opt.position, 
      isCorrect: opt.isCorrect 
    })));
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { 
      questionNo, 
      questionDescription: description, 
      questionType: type, 
      choiceLimit: limit, 
      questionStatus: status, 
      matchId, 
      options: options.map(opt => ({ ...opt })) 
    };

    try {
      if (editingQuestion) {
        await api.put(`/admin/api/questions/${editingQuestion.id}`, payload);
        alert("Updated Successfully!");
      } else {
        await api.post("/admin/api/questions/create", payload);
        alert("Created Successfully!");
      }
      
      // Reset Form
      setEditingQuestion(null);
      setDescription(""); 
      setOptions([{ optionId: 1, optionDesc: "", points: 0, position: 0, isCorrect: false }]);
      setShowCreateForm(false);
      
      if (matchId === viewMatchId) fetchQuestions(viewMatchId);
    } catch (err) { 
      console.error(err);
      alert("Action Failed"); 
    } finally { 
      setLoading(false); 
    }
  };

  /** ðŸ”¹ RESOLVE LOGIC ðŸ”¹ */
  const [resolveOptions, setResolveOptions] = useState<OptionData[]>([]);

  const openResolveView = (q: QuestionData) => {
    setResolvingQuestion(q);
    setResolveOptions(q.options.map(opt => ({ 
        ...opt, 
        position: opt.position || 0 
    }))); 
  };

  const handleResolveOptionChange = (index: number, f: keyof OptionData, v: any) => {
    const updated = [...resolveOptions];
    updated[index] = { ...updated[index], [f]: v };
    
    // If it's a SINGLE type, ensure only one is correct
    if (resolvingQuestion?.questionType === "SINGLE" && f === "isCorrect" && v === true) {
      updated.forEach((opt, i) => { if (i !== index) opt.isCorrect = false; });
    }
    
    setResolveOptions(updated);
  };

  const submitResolution = async () => {
    if (!resolvingQuestion) return;

    // Validation
    const corrects = resolveOptions.filter(o => o.isCorrect);
    if (resolvingQuestion.questionType === "PODIUM") {
      if (corrects.length !== 3) {
        alert("PODIUM questions must have exactly 3 correct drivers (1st, 2nd, 3rd).");
        return;
      }
      const positions = corrects.map(c => c.position);
      if (!positions.includes(1) || !positions.includes(2) || !positions.includes(3)) {
        alert("Please assign unique positions (1, 2, 3) to the 3 winners.");
        return;
      }
    } else if (corrects.length === 0) {
      alert("Please mark at least one option as correct.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        questionId: resolvingQuestion.id,
        options: resolveOptions.map(o => ({
          optionId: o.optionId,
          position: o.position,
          isCorrect: o.isCorrect
        }))
      };

      await api.put(`/admin/api/questions/resolve/${resolvingQuestion.id}`, payload);
      alert("Question Resolved Successfully!");
      setResolvingQuestion(null);
      fetchQuestions(viewMatchId);
    } catch (err: any) {
      console.error(err);
      alert("Resolution failed");
    } finally {
      setLoading(false);
    }

  };

  const currentSelectedCount = resolveOptions.filter(o => o.isCorrect).length;

  return (
    <div className="flex min-h-screen bg-neutral-950 text-white font-sans relative">
      <div className="absolute top-0 right-0 w-[40%] h-[400px] bg-red-600/5 blur-[120px] pointer-events-none" />
      
      {/* 🔹 Sidebar */}
      <aside className="w-72 bg-neutral-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col sticky top-0 h-screen z-50">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10 cursor-pointer group" onClick={() => navigate("/dashboard")}>
            <div className="bg-red-600 p-2 rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-red-600/30">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <span className="font-black tracking-tighter uppercase italic text-xl">Admin <span className="text-red-600">Portal</span></span>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => { setActiveTab("matches"); setResolvingQuestion(null); setShowCreateForm(false); }} 
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black uppercase italic tracking-widest text-[10px] transition-all",
                activeTab === "matches" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Flag className="w-4 h-4" /> Matches
            </button>
            <button 
              onClick={() => { setActiveTab("questions"); setResolvingQuestion(null); setShowCreateForm(false); }} 
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black uppercase italic tracking-widest text-[10px] transition-all",
                activeTab === "questions" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <ListTodo className="w-4 h-4" /> Questions
            </button>
            <button 
              onClick={() => { setActiveTab("leaguetypes"); setResolvingQuestion(null); setShowCreateForm(false); }} 
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black uppercase italic tracking-widest text-[10px] transition-all",
                activeTab === "leaguetypes" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Settings className="w-4 h-4" /> League Types
            </button>
            <button 
              onClick={() => { setActiveTab("adminleagues"); setResolvingQuestion(null); setShowCreateForm(false); }} 
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black uppercase italic tracking-widest text-[10px] transition-all",
                activeTab === "adminleagues" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Trophy className="w-4 h-4" /> Admin Leagues
            </button>
            <button 
              onClick={() => { setActiveTab("calculations"); setResolvingQuestion(null); setShowCreateForm(false); }} 
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black uppercase italic tracking-widest text-[10px] transition-all",
                activeTab === "calculations" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Calculator className="w-4 h-4" /> Points Calculation
            </button>
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
           <Button 
            variant="ghost" 
            className="w-full justify-start text-neutral-400 hover:text-red-500 hover:bg-red-500/10 font-bold"
            onClick={() => { localStorage.clear(); navigate("/"); }}
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* 🔹 Main Content */}
      <main className="flex-1 p-12 max-w-7xl mx-auto w-full relative z-10">
        
        {activeTab === "matches" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600 italic mb-2">Race Control</p>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Match <span className="text-red-600">List</span></h1>
            </div>

            <Card className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-neutral-950/40 border-b border-white/5">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="w-24 pl-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">ID</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Circuit Location</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Status</TableHead>
                      <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((m) => (
                      <TableRow key={m.matchId} className="border-white/5 group hover:bg-white/[0.02] transition-colors">
                        <TableCell className="pl-8 py-5 font-mono font-bold text-red-600">#{m.matchId}</TableCell>
                        <TableCell className="py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-neutral-950 rounded-xl border border-white/5 flex items-center justify-center text-neutral-400 group-hover:text-red-500 transition-colors">
                               <Flag className="w-5 h-5" />
                            </div>
                            <span className="font-black text-lg uppercase italic text-neutral-200 group-hover:text-white transition-colors">{m.circuitLocation}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <Badge className={cn(
                            "px-3 py-1 font-black uppercase italic tracking-widest text-[9px] border-none shadow-sm",
                            m.status === 1 ? "bg-green-500/10 text-green-500 shadow-green-500/10 animate-pulse" :
                            m.status === 2 ? "bg-yellow-500/10 text-yellow-500 shadow-yellow-500/10" :
                            "bg-red-500/10 text-red-500 shadow-red-500/10"
                          )}>
                            {getStatusLabel(m.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8 py-5">
                          <select 
                            value={m.status} 
                            onChange={async (e) => {
                              const newStatus = Number(e.target.value);
                              try {
                                setLoading(true);
                                await api.put(`/admin/api/matchstatusupdate/match/status/${m.matchId}`, { status: newStatus });
                                setMatches(matches.map(match => match.matchId === m.matchId ? { ...match, status: newStatus } : match));
                                alert("Match status updated!");
                              } catch (error) {
                                alert("Failed to update match status");
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                            className="bg-neutral-950 border border-white/5 text-[10px] font-black uppercase italic tracking-widest rounded-lg px-4 h-10 outline-none focus:border-red-600 transition-all cursor-pointer text-white"
                          >
                            <option value={0}>NOT STARTED</option>
                            <option value={1}>OPEN</option>
                            <option value={2}>LOCKED</option>
                            <option value={3}>PC STARTED</option>
                            <option value={4}>PC DONE</option>
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600 italic mb-2">Questions & Rules</p>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                  {resolvingQuestion ? "Resolve Question" : 
                   editingQuestion ? "Edit Question" : 
                   showCreateForm ? "Add Question" : 
                   "Manage Questions"}
                </h1>
              </div>
              
              {!resolvingQuestion && (
                <Button 
                  onClick={() => {
                    if (showCreateForm || editingQuestion) {
                      setShowCreateForm(false);
                      setEditingQuestion(null);
                    } else {
                      setShowCreateForm(true);
                    }
                  }}
                  className={cn(
                    "h-10 px-6 font-black uppercase italic tracking-widest text-[10px] rounded-none skew-x-[-10deg] shadow-lg transition-all",
                    (showCreateForm || editingQuestion) ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-400" : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                  )}
                >
                  <div className="skew-x-[10deg] flex items-center">
                    {(showCreateForm || editingQuestion) ? "â† Back" : <><Plus className="w-4 h-4 mr-2" /> Add New Question</>}
                  </div>
                </Button>
              )}
            </div>

            {/* 🔹 RESOLUTION VIEW (SUB-TAB) */}
            {resolvingQuestion ? (
              <Card className="bg-neutral-900/40 border border-white/5 rounded-[3rem] p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[80px] pointer-events-none" />
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between border-b border-white/5 pb-8">
                    <div className="space-y-2">
                       <Badge className="bg-green-600/10 text-green-500 border-none font-black italic uppercase tracking-widest text-[10px]">Awaiting Resolution</Badge>
                       <h3 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">{resolvingQuestion.questionDescription}</h3>
                       <div className="flex items-center gap-4 text-neutral-400 font-bold uppercase tracking-widest italic text-[9px] pt-2">
                          <span>Type <span className="text-white">{resolvingQuestion.questionType}</span></span>
                          <span>â€¢</span>
                          <span>Limit <span className="text-white">{resolvingQuestion.choiceLimit}</span></span>
                       </div>
                    </div>
                    <Button variant="ghost" onClick={() => setResolvingQuestion(null)} className="text-neutral-400 hover:text-red-500 h-14 w-14 rounded-full">
                       <X className="w-6 h-6" />
                    </Button>
                  </div>

                  <Table>
                    <TableHeader className="bg-neutral-950/40 border-b border-white/5">
                      <TableRow className="border-none">
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Description</TableHead>
                        <TableHead className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic w-32">Status</TableHead>
                        <TableHead className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic w-32">Rank</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resolveOptions.map((opt, index) => (
                        <TableRow key={index} className={cn("border-white/5 transition-colors", opt.isCorrect ? "bg-green-500/5" : "hover:bg-white/[0.01]")}>
                          <TableCell className="py-5">
                            <span className="font-bold text-base uppercase text-neutral-100">{opt.optionDesc}</span>
                          </TableCell>
                          <TableCell className="text-center py-6">
                            <div className="flex justify-center">
                              <input 
                                type="checkbox" 
                                checked={opt.isCorrect} 
                                disabled={!opt.isCorrect && currentSelectedCount >= (resolvingQuestion.choiceLimit || 1)}
                                onChange={(e) => handleResolveOptionChange(index, "isCorrect", e.target.checked)} 
                                className="w-6 h-6 rounded-lg bg-neutral-950 border-white/10 checked:bg-green-600 accent-green-600 cursor-pointer"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-6">
                            <div className="flex justify-center">
                              <Input 
                                type="number"
                                value={opt.position} 
                                disabled={!opt.isCorrect}
                                onChange={(e) => handleResolveOptionChange(index, "position", Number(e.target.value))}
                                className="w-20 bg-neutral-950 border-white/10 text-center font-mono font-bold text-green-500 h-10 rounded-lg"
                                min={0}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end pt-6 border-t border-white/5">
                    <Button 
                      onClick={submitResolution}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white font-black uppercase italic tracking-widest h-16 px-12 rounded-xl shadow-xl shadow-green-600/20 text-lg"
                    >
                      {loading ? "Processing..." : "Save Results"}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (showCreateForm || editingQuestion) ? (
              /** ðŸ”¹ CREATION / EDIT VIEW ðŸ”¹ */
              <Card className="bg-neutral-900/40 border border-white/5 rounded-[3rem] p-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Parent Match</Label>
                      <select 
                        value={matchId} 
                        onChange={(e) => setMatchId(Number(e.target.value))} 
                        required 
                        className="w-full bg-neutral-950 border border-white/5 h-12 rounded-xl px-4 text-white text-sm font-bold italic outline-none focus:border-red-600 transition-all appearance-none"
                      >
                        <option value="" disabled>Select Match Sequence</option>
                        {matches.map(m => <option key={m.matchId} value={m.matchId}>{m.matchId} - {m.circuitLocation}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Sequence Position</Label>
                       <Input type="number" value={questionNo} onChange={(e) => setQuestionNo(Number(e.target.value))} required className="bg-neutral-950 border-white/5 h-12 rounded-xl font-mono text-red-600 text-lg font-black" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Prompt Description</Label>
                    <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      required  
                      className="w-full bg-neutral-950 border border-white/5 rounded-2xl p-6 text-white font-bold italic h-32 outline-none focus:border-red-600 transition-all"
                      placeholder="Enter the official question text..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Logic Type</Label>
                      <select 
                        value={type} 
                        onChange={(e) => handleTypeChange(e.target.value)} 
                        className="w-full bg-neutral-950 border border-white/5 h-12 rounded-xl px-4 text-white text-sm font-bold italic outline-none focus:border-red-600 transition-all"
                      >
                        <option value="PODIUM">PODIUM (Top 3)</option>
                        <option value="PICK ONE OR MORE DRIVERS/CONSTUCTORS">MULTI DRIVER</option>
                        <option value="MULTI OPTION CHECKBOX">CHECKBOXES</option>
                        <option value="SINGLE OPTION">SINGLE PICK</option>
                        <option value="H2H">HEAD-TO-HEAD</option>
                        <option value="BINARY">BINARY (Y/N)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Selection Cap</Label>
                       <Input type="number" value={limit} disabled={type === "PODIUM"} onChange={(e) => setLimit(Number(e.target.value))} className="bg-neutral-950 border-white/5 h-12 rounded-xl font-mono text-sm font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Initial Status</Label>
                       <Badge className="w-full h-12 bg-neutral-950 border border-white/5 text-neutral-400 font-black italic uppercase tracking-widest rounded-xl justify-center text-[9px]">NOT STARTED</Badge>
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black italic uppercase tracking-tighter text-red-600">Response Options</h3>
                       {["PODIUM", "PICK ONE OR MORE DRIVERS/CONSTUCTORS", "MULTI OPTION CHECKBOX", "SINGLE OPTION", "H2H"].includes(type) && (
                        <div className="flex gap-3">
                          <Button type="button" onClick={() => setShowDriverSelector(true)} className="bg-red-600/10 text-red-600 border border-red-600/20 hover:bg-red-600 hover:text-white h-10 px-4 rounded-lg font-black uppercase italic tracking-widest text-[9px]">
                            + Drivers
                          </Button>
                          {type !== "PODIUM" && (
                            <Button type="button" onClick={() => setShowTeamSelector(true)} className="bg-red-600/10 text-red-600 border border-red-600/20 hover:bg-red-600 hover:text-white h-10 px-4 rounded-lg font-black uppercase italic tracking-widest text-[9px]">
                              + Teams
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {options.map((opt, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 items-center bg-neutral-950 p-4 rounded-2xl border border-white/5 group hover:border-red-600/30 transition-all">
                          <div className="col-span-2">
                             <Input type="number" value={opt.optionId} readOnly={type === "PODIUM"} onChange={(e) => handleOptionChange(index, "optionId", Number(e.target.value))} className="bg-neutral-900 border-none text-center font-mono font-bold text-red-600" />
                          </div>
                          <div className="col-span-7">
                             <Input value={opt.optionDesc} placeholder="Option description..." readOnly={type === "PODIUM"} onChange={(e) => handleOptionChange(index, "optionDesc", e.target.value)} className="bg-neutral-900 border-none italic font-bold text-white" />
                          </div>
                          <div className="col-span-2">
                             <Input type="number" value={opt.points} onChange={(e) => handleOptionChange(index, "points", Number(e.target.value))} className="bg-neutral-900 border-none text-center font-mono font-bold text-white" />
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <Button type="button" onClick={() => removeOption(index)} variant="ghost" className="text-neutral-700 hover:text-red-600 h-10 w-10 p-0 rounded-full">
                               <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      {type === "BINARY" && (
                        <Button type="button" onClick={() => {
                          setOptions([
                            { optionId: 1, optionDesc: "Yes", points: 0, position: 1, isCorrect: false },
                            { optionId: 2, optionDesc: "No", points: 0, position: 2, isCorrect: false }
                          ]);
                        }} variant="outline" className="border-white/10 hover:bg-neutral-800 text-neutral-400 font-black uppercase italic tracking-widest text-[9px] h-12 rounded-xl">
                          Generate Binary (Y/N)
                        </Button>
                      )}
                      {!["PODIUM", "BINARY"].includes(type) && (
                        <Button type="button" onClick={addOption} variant="outline" className="border-white/10 hover:bg-neutral-800 text-neutral-400 font-black uppercase italic tracking-widest text-[9px] h-12 rounded-xl">
                          + Custom Option
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex justify-end">
                     <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest h-12 px-8 rounded-xl shadow-xl shadow-red-600/20 text-xs">
                      {loading ? "Processing..." : editingQuestion ? "Update Question" : "Create Question"}
                    </Button>
                  </div>
                </form>
              </Card>
            ) : (
              /** 🔽 LIST VIEW 🔽 */
              <div className="space-y-8 animate-in fade-in duration-700">
                <Card className="bg-neutral-900/40 border border-white/5 p-8 rounded-[2.5rem]">
                   <div className="flex items-center gap-4">
                      <Search className="w-5 h-5 text-red-600" />
                      <div className="flex-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Filter by Match</Label>
                        <select 
                          value={viewMatchId} 
                          onChange={(e) => setViewMatchId(Number(e.target.value))} 
                          className="w-full bg-transparent border-none text-sm font-black uppercase italic tracking-tight text-white outline-none cursor-pointer appearance-none"
                        >
                          <option value={0} className="bg-neutral-900 text-neutral-400">Select a Match</option>
                          {matches.map(m => <option key={m.matchId} value={m.matchId} className="bg-neutral-900">{m.matchId} - {m.circuitLocation}</option>)}
                        </select>
                      </div>
                   </div>
                </Card>

                {!loading && questionsList.length > 0 && (
                  <Card className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-neutral-950/40 border-b border-white/5">
                          <TableRow className="border-none hover:bg-transparent">
                            <TableHead className="w-20 pl-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">No.</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Prompt</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Type</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Status</TableHead>
                            <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Control</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {questionsList.map((q) => (
                            <TableRow key={q.id} className="border-white/5 group hover:bg-white/[0.02] transition-colors">
                              <TableCell className="pl-8 py-6 font-mono font-bold text-red-600">Q{q.questionNo}</TableCell>
                              <TableCell className="py-5">
                                <span className="font-bold text-neutral-100 group-hover:text-white transition-colors block max-w-md text-sm">{q.questionDescription}</span>
                              </TableCell>
                              <TableCell className="py-6">
                                <Badge variant="outline" className="border-neutral-800 text-neutral-400 text-[8px] font-black uppercase">{q.questionType}</Badge>
                              </TableCell>
                              <TableCell className="py-6">
                                <Badge className={cn(
                                  "px-3 py-1 font-black uppercase italic tracking-widest text-[9px] border-none shadow-sm",
                                  q.questionStatus === 1 ? "bg-green-600 text-white shadow-lg shadow-green-600/20" :
                                  q.questionStatus === 2 ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/10" :
                                  "bg-neutral-800 text-neutral-400 border border-white/5"
                                )}>
                                  {getStatusLabel(q.questionStatus)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right pr-8 py-6">
                                <div className="flex items-center justify-end gap-3">
                                  <select 
                                    value={q.questionStatus} 
                                    onChange={(e) => handleStatusChange(q, Number(e.target.value))}
                                    disabled={loading || q.questionStatus === 3 || q.questionStatus === 4}
                                    className="bg-neutral-950 border border-white/5 text-[9px] font-black uppercase italic tracking-widest rounded-lg px-3 h-9 outline-none focus:border-red-600 transition-all cursor-pointer text-white"
                                  >
                                    <option value={0}>NOT STARTED</option>
                                    <option value={1}>OPEN</option>
                                    <option value={2}>LOCKED</option>
                                    <option value={3} disabled>PC STARTED</option>
                                    <option value={4} disabled>PC DONE</option>
                                  </select>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleEditQuestion(q)}
                                    className="h-9 w-9 text-neutral-600 hover:text-white"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                  
                                  {(q.questionStatus === 2 || q.questionStatus === 3 || q.questionStatus === 4) && (
                                    <Button 
                                      onClick={() => openResolveView(q)}
                                      className={cn(
                                        "h-9 px-4 font-black uppercase italic tracking-widest text-[9px] rounded-lg shadow-sm transition-all",
                                        q.questionStatus >= 3 ? "bg-neutral-800 text-neutral-400" : "bg-green-600 hover:bg-green-700 text-white shadow-green-600/10"
                                      )}
                                    >
                                      {q.questionStatus >= 3 ? "Re-Resolve" : "Resolve"}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
                {viewMatchId > 0 && questionsList.length === 0 && !loading && (
                  <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                     <AlertCircle className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                     <p className="font-black uppercase italic text-neutral-400 text-sm tracking-widest">No questions found in this sector.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "leaguetypes" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600 italic mb-2">Template Settings</p>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">League <span className="text-red-600">Templates</span></h1>
              </div>
              
              <div className="flex bg-neutral-900/50 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => { setLeagueSubTab("list"); setSelectedLeagueType(null); }}
                  className={cn(
                    "px-6 py-2 rounded-lg text-[10px] font-black uppercase italic tracking-widest transition-all",
                    leagueSubTab === "list" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-neutral-500 hover:text-white"
                  )}
                >
                  All Templates
                </button>
                <button 
                  onClick={() => { 
                    setLeagueSubTab("types"); 
                    setSelectedLeagueType(null); 
                    setEditingLeagueType(null);
                    // Reset form
                    setLeagueTypeName("");
                    setRequireCode(true);
                    setIsSearchable(true);
                    setAllowLeave(true);
                    setAllowRename(true);
                    setAllowDelete(true);
                    setAllowMemberRemoval(true);
                    setCreatorRole("ADMIN");
                    setHasMatchRange(true);
                    setMaxMembers(0);
                    setMaxLeagues(0);
                  }}
                  className={cn(
                    "px-6 py-2 rounded-lg text-[10px] font-black uppercase italic tracking-widest transition-all",
                    leagueSubTab === "types" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-neutral-500 hover:text-white"
                  )}
                >
                  {editingLeagueType ? "Edit Template" : "New Template"}
                </button>
              </div>
            </div>

            {leagueSubTab === "list" && !selectedLeagueType && (
              <Card className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-neutral-950/40 border-b border-white/5">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="w-20 pl-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">ID</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Template Name</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Creator</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Max Members</TableHead>
                        <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Control</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(leagueTypesList) && leagueTypesList.map((type) => (
                        <TableRow key={type.id} className="border-white/5 group hover:bg-white/[0.02] transition-colors">
                          <TableCell className="pl-8 py-5 font-mono font-bold text-red-600">#{type.id}</TableCell>
                          <TableCell className="py-5 font-black uppercase italic text-sm text-white">{type.name}</TableCell>
                          <TableCell className="py-5">
                            <Badge variant="outline" className="border-neutral-800 text-neutral-400 text-[8px] font-black uppercase italic tracking-widest">{type.creatorRole}</Badge>
                          </TableCell>
                          <TableCell className="py-5 font-mono text-neutral-400 text-xs">
                            {type.defaultMaxMembers === 999999 ? "UNLIMITED" : type.defaultMaxMembers}
                          </TableCell>
                          <TableCell className="text-right pr-8 py-5">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                onClick={() => setSelectedLeagueType(type)}
                                className="h-8 px-4 font-black uppercase italic tracking-widest text-[9px] text-red-600 hover:text-white hover:bg-red-600 transition-all rounded-lg"
                              >
                                Details
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => startEditLeagueType(type)}
                                className="h-8 w-8 text-neutral-400 hover:text-white"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteLeagueType(type.id)}
                                className="h-8 w-8 text-neutral-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {leagueTypesList.length === 0 && !loading && (
                    <div className="py-20 text-center">
                       <AlertCircle className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
                       <p className="text-[10px] font-black uppercase italic tracking-widest text-neutral-500">No league types configured.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {leagueSubTab === "list" && selectedLeagueType && typeof selectedLeagueType === 'object' && (
              <Card className="bg-neutral-900/40 border border-white/5 rounded-[3rem] p-10 relative overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[80px] pointer-events-none" />
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between border-b border-white/5 pb-8">
                    <div className="space-y-2">
                       <Badge className="bg-red-600/10 text-red-600 border-none font-black italic uppercase tracking-widest text-[10px]">Template Info</Badge>
                       <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">{selectedLeagueType.name}</h3>
                    </div>
                    <Button variant="ghost" onClick={() => setSelectedLeagueType(null)} className="text-neutral-400 hover:text-red-500 h-10 px-4 font-black uppercase italic tracking-widest text-[10px]">
                       ← Back to List
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { label: "Require Code", val: selectedLeagueType.requireLeagueCode },
                      { label: "Searchable", val: selectedLeagueType.isSearchable },
                      { label: "Allow Leave", val: selectedLeagueType.allowUserLeave },
                      { label: "Allow Rename", val: selectedLeagueType.allowRenaming },
                      { label: "Admin Delete", val: selectedLeagueType.allowAdminDelete },
                      { label: "Member Removal", val: selectedLeagueType.allowMemberRemoval },
                      { label: "Match Range", val: selectedLeagueType.hasMatchRange },
                    ].map((config, idx) => (
                      <div key={idx} className="bg-neutral-950 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-tight text-neutral-500 italic">{config.label}</span>
                        <Badge className={cn("border-none text-[8px] font-black uppercase italic", config.val ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                           {config.val ? "YES" : "NO"}
                        </Badge>
                      </div>
                    ))}
                    <div className="bg-neutral-950 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-tight text-neutral-500 italic">Creator Role</span>
                      <span className="text-[10px] font-black uppercase italic text-white">{selectedLeagueType.creatorRole}</span>
                    </div>
                    <div className="bg-neutral-950 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-tight text-neutral-500 italic">Max Members</span>
                      <span className="text-[10px] font-black uppercase italic text-white">{selectedLeagueType.defaultMaxMembers === 999999 ? "UNLIMITED" : selectedLeagueType.defaultMaxMembers}</span>
                    </div>
                    <div className="bg-neutral-950 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-tight text-neutral-500 italic">Max Per User</span>
                      <span className="text-[10px] font-black uppercase italic text-white">{selectedLeagueType.maxLeaguesPerUser}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {leagueSubTab === "types" && (
              <Card className="bg-neutral-900/40 border border-white/5 rounded-[3rem] p-10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[80px] pointer-events-none" />
                 <div className="relative z-10 space-y-8">
                    <div className="border-b border-white/5 pb-6">
                       <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                         {editingLeagueType ? "Edit League Template" : "New League Template"}
                       </h3>
                       <p className="text-neutral-500 text-[10px] font-medium italic mt-1">Set the rules for new leagues</p>
                    </div>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setLoading(true);
                      try {
                        const payload = {
                          name: leagueTypeName,
                          requireLeagueCode: requireCode,
                          isSearchable,
                          allowUserLeave: allowLeave,
                          allowRenaming: allowRename,
                          allowAdminDelete: allowDelete,
                          allowMemberRemoval,
                          creatorRole,
                          hasMatchRange,
                          defaultMaxMembers: maxMembers,
                          maxLeaguesPerUser: maxLeagues
                        };
                        
                        if (editingLeagueType) {
                          await api.put(`/admin/api/adminleaguetype/${editingLeagueType.id}`, payload);
                          alert("League Type Updated Successfully!");
                        } else {
                          await api.post("/admin/api/adminleaguetype/create", payload);
                          alert("League Type Created Successfully!");
                        }
                        
                        setEditingLeagueType(null);
                        setLeagueTypeName("");
                        setLeagueSubTab("list");
                        fetchLeagueTypes();
                      } catch (error) {
                        alert(`Failed to ${editingLeagueType ? 'update' : 'create'} league type`);
                      } finally {
                        setLoading(false);
                      }
                    }} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Template Name</Label>
                          <Input 
                            value={leagueTypeName} 
                            onChange={(e) => setLeagueTypeName(e.target.value)} 
                            required 
                            placeholder="e.g. OFFICIAL CHAMPIONSHIP" 
                            className="bg-neutral-950 border-white/5 h-12 rounded-xl text-white font-bold italic" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Creator Role</Label>
                          <select 
                            value={creatorRole} 
                            onChange={(e) => setCreatorRole(e.target.value)} 
                            className="w-full bg-neutral-950 border border-white/5 h-12 rounded-xl px-4 text-white text-sm font-bold italic outline-none focus:border-red-600 transition-all appearance-none"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="USER">USER</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                          { label: "Require Code", state: requireCode, setter: setRequireCode },
                          { label: "Searchable", state: isSearchable, setter: setIsSearchable },
                          { label: "Allow Leave", state: allowLeave, setter: setAllowLeave },
                          { label: "Allow Rename", state: allowRename, setter: setAllowRename },
                          { label: "Admin Delete", state: allowDelete, setter: setAllowDelete },
                          { label: "Member Removal", state: allowMemberRemoval, setter: setAllowMemberRemoval },
                          { label: "Match Range", state: hasMatchRange, setter: setHasMatchRange },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-neutral-950 rounded-xl border border-white/5 group hover:border-red-600/30 transition-all">
                             <span className="text-[10px] font-black uppercase tracking-tight text-neutral-400 italic group-hover:text-white">{item.label}</span>
                             <input 
                              type="checkbox" 
                              checked={item.state} 
                              onChange={(e) => item.setter(e.target.checked)} 
                              className="w-5 h-5 rounded-md bg-neutral-900 border-white/10 checked:bg-red-600 accent-red-600 cursor-pointer"
                             />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Default Max Members</Label>
                            <Input 
                              type="number" 
                              value={maxMembers} 
                              onChange={(e) => setMaxMembers(Number(e.target.value))} 
                              className="bg-neutral-950 border-white/5 h-12 rounded-xl text-white font-mono font-bold" 
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Max Leagues Per User</Label>
                            <Input 
                              type="number" 
                              value={maxLeagues} 
                              onChange={(e) => setMaxLeagues(Number(e.target.value))} 
                              className="bg-neutral-950 border-white/5 h-12 rounded-xl text-white font-mono font-bold" 
                            />
                         </div>
                      </div>

                      <div className="pt-6 border-t border-white/5 flex justify-end">
                         <Button 
                          type="submit" 
                          disabled={loading} 
                          className="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest h-12 px-12 rounded-xl shadow-xl shadow-red-600/20 text-xs"
                         >
                           {loading ? "Saving..." : editingLeagueType ? "Update Template" : "Create Template"}
                         </Button>
                      </div>
                    </form>
                 </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "adminleagues" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600 italic mb-2">League Management</p>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Admin <span className="text-red-600">Leagues</span></h1>
              </div>
              
              <div className="flex bg-neutral-900/50 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => { setAdminLeagueSubTab("list"); setSelectedAdminLeague(null); setEditingAdminLeague(null); }}
                  className={cn(
                    "px-6 py-2 rounded-lg text-[10px] font-black uppercase italic tracking-widest transition-all",
                    adminLeagueSubTab === "list" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-neutral-500 hover:text-white"
                  )}
                >
                  All Leagues
                </button>
                <button 
                  onClick={() => { 
                    setAdminLeagueSubTab("setup"); 
                    setSelectedAdminLeague(null); 
                    setEditingAdminLeague(null);
                    setAdminLeagueName("");
                    setAdminTemplateId(0);
                    setAdminMaxMembers(0);
                    setAdminStartMatchId(0);
                    setAdminEndMatchId(0);
                    setAdminCreatedAtMatchId(0);
                  }}
                  className={cn(
                    "px-6 py-2 rounded-lg text-[10px] font-black uppercase italic tracking-widest transition-all",
                    adminLeagueSubTab === "setup" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-neutral-500 hover:text-white"
                  )}
                >
                  {editingAdminLeague ? "Edit League" : "Create League"}
                </button>
              </div>
            </div>

            {!selectedAdminLeague ? (
              <>
                {adminLeagueSubTab === "list" && (
                  <Card className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-neutral-950/40 border-b border-white/5">
                          <TableRow className="border-none hover:bg-transparent">
                            <TableHead className="w-20 pl-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">ID</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">League Name</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Template</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Capacity</TableHead>
                            <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 italic">Control</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adminLeaguesList.map((league) => (
                            <TableRow key={league.id} className="border-white/5 group hover:bg-white/[0.02] transition-colors">
                              <TableCell className="pl-8 py-5 font-mono font-bold text-red-600">#{league.id}</TableCell>
                              <TableCell className="py-5 font-black uppercase italic text-sm text-white">{league.leagueName}</TableCell>
                              <TableCell className="py-5">
                                <Badge variant="outline" className="border-red-600/20 text-red-600 text-[8px] font-black uppercase italic tracking-widest">{league.template?.name || "CUSTOM"}</Badge>
                              </TableCell>
                              <TableCell className="py-5 font-mono text-neutral-400 text-xs">
                                {league.maximumMembers} MEMBERS
                              </TableCell>
                              <TableCell className="text-right pr-8 py-5">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => setSelectedAdminLeague(league)}
                                    className="h-8 px-4 font-black uppercase italic tracking-widest text-[9px] text-red-600 hover:text-white hover:bg-red-600 transition-all rounded-lg"
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => startEditAdminLeague(league)}
                                    className="h-8 w-8 text-neutral-400 hover:text-white"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteAdminLeague(league.id)}
                                    className="h-8 w-8 text-neutral-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {adminLeaguesList.length === 0 && !loading && (
                        <div className="py-24 text-center">
                          <Trophy className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                          <p className="font-black uppercase italic text-neutral-500 text-[10px] tracking-widest">No active admin leagues found.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {adminLeagueSubTab === "setup" && (
                  <Card className="bg-neutral-900/40 border border-white/5 rounded-[3rem] p-10 relative overflow-hidden animate-in fade-in duration-500">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[80px] pointer-events-none" />
                    <div className="relative z-10 space-y-8">
                      <div className="border-b border-white/5 pb-6">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                          {editingAdminLeague ? "Edit Admin League" : "Create Admin League"}
                        </h3>
                        <p className="text-neutral-500 text-[10px] font-medium italic mt-1">Start a new league for users</p>
                      </div>

                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setLoading(true);
                        try {
                          const payload: any = {
                            leagueName: adminLeagueName,
                            templateId: Number(adminTemplateId),
                            userId: localStorage.getItem("userId") || "",
                            createdAtMatchId: Number(adminCreatedAtMatchId),
                            startMatchId: Number(adminStartMatchId),
                            endMatchId: Number(adminEndMatchId),
                            maximumMembers: Number(adminMaxMembers)
                          };

                          if (editingAdminLeague) {
                            payload.id = editingAdminLeague.id;
                            await api.put("/admin/adminleague/update", payload);
                            alert("League Updated Successfully!");
                          } else {
                            await api.post("/admin/adminleague/create", payload);
                            alert("League Launched Successfully!");
                          }

                          setEditingAdminLeague(null);
                          setAdminLeagueSubTab("list");
                          fetchAdminLeagues();
                        } catch (error) {
                          alert("Failed to process league");
                        } finally {
                          setLoading(false);
                        }
                      }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">League Name</Label>
                            <Input 
                              value={adminLeagueName} 
                              onChange={(e) => setAdminLeagueName(e.target.value)} 
                              required 
                              placeholder="e.g. SILVERSTONE GP SPECIAL" 
                              className="bg-neutral-950 border-white/5 h-12 rounded-xl text-white font-bold italic" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">League Template</Label>
                            <select 
                              value={adminTemplateId} 
                              onChange={(e) => setAdminTemplateId(Number(e.target.value))}
                              required
                              className="w-full bg-neutral-950 border border-white/5 h-12 rounded-xl px-4 text-white text-sm font-bold italic outline-none focus:border-red-600 transition-all appearance-none"
                            >
                              <option value={0}>Select Template</option>
                              {leagueTypesList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Max Capacity</Label>
                            <Input type="number" value={adminMaxMembers} onChange={(e) => setAdminMaxMembers(Number(e.target.value))} required className="bg-neutral-950 border-white/5 h-12 rounded-xl font-mono font-bold text-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Created Match ID</Label>
                            <Input type="number" value={adminCreatedAtMatchId} onChange={(e) => setAdminCreatedAtMatchId(Number(e.target.value))} required className="bg-neutral-950 border-white/5 h-12 rounded-xl font-mono font-bold text-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Start Match ID</Label>
                            <Input type="number" value={adminStartMatchId} onChange={(e) => setAdminStartMatchId(Number(e.target.value))} className="bg-neutral-950 border-white/5 h-12 rounded-xl font-mono font-bold text-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">End Match ID</Label>
                            <Input type="number" value={adminEndMatchId} onChange={(e) => setAdminEndMatchId(Number(e.target.value))} className="bg-neutral-950 border-white/5 h-12 rounded-xl font-mono font-bold text-white" />
                          </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={loading} 
                            className="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest h-12 px-12 rounded-xl shadow-xl shadow-red-600/20 text-xs"
                          >
                            {loading ? "Saving..." : editingAdminLeague ? "Save Changes" : "Create League"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-neutral-900/40 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[80px] pointer-events-none" />
                <div className="relative z-10 space-y-10">
                  <div className="flex items-center gap-6 border-b border-white/5 pb-10">
                    <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-600/20">
                      <Trophy className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                       <Badge className="bg-red-600/10 text-red-600 border-none font-black italic uppercase tracking-widest text-[10px] mb-2">League Info</Badge>
                       <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">{selectedAdminLeague.leagueName}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: "ID", val: `#${selectedAdminLeague.id}`, icon: Settings },
                      { label: "Template", val: selectedAdminLeague.template?.name, icon: Flag },
                      { label: "Max Members", val: selectedAdminLeague.maximumMembers, icon: Users },
                      { label: "Created At", val: selectedAdminLeague.createdAtMatchId, icon: Timer },
                    ].map((info, idx) => (
                      <div key={idx} className="bg-neutral-950 p-6 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center gap-2 text-neutral-500">
                          <info.icon className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-tight italic">{info.label}</span>
                        </div>
                        <p className="text-lg font-black uppercase italic text-white leading-none">{info.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-neutral-950/50 rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 bg-neutral-900/50 border-b border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-600 italic">Template Rules applied</span>
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedAdminLeague.template && Object.entries(selectedAdminLeague.template)
                        .filter(([_, v]) => typeof v === 'boolean')
                        .map(([key, val], idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-neutral-900/30 rounded-lg border border-white/5">
                          <span className="text-[8px] font-black uppercase text-neutral-400 italic truncate mr-2">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <Badge className={cn("border-none text-[8px] font-black uppercase italic", val ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                            {val ? "YES" : "NO"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "calculations" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600 italic mb-2">Points Runner</p>
               <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Match <span className="text-red-600">Standings</span></h1>
            </div>

            <Card className="bg-neutral-900/40 border border-white/5 p-12 rounded-[3rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 blur-[100px] pointer-events-none" />
               <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-24 h-24 bg-red-600/10 rounded-[2rem] flex items-center justify-center mx-auto border border-red-600/20 shadow-2xl shadow-red-600/10 group">
                       <Calculator className="w-10 h-10 text-red-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Points <span className="text-red-600">Calculation</span></h2>
                      <p className="text-neutral-500 text-[10px] font-medium italic">Update leaderboard and standings for the selected match</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-400 italic">Select Match</Label>
                    <div className="relative group">
                      <select 
                        value={viewMatchId} 
                        onChange={(e) => setViewMatchId(Number(e.target.value))} 
                        className="w-full bg-neutral-950 border border-white/5 h-12 rounded-xl px-4 text-sm font-black uppercase italic tracking-tight text-white outline-none focus:border-red-600 transition-all text-center appearance-none cursor-pointer hover:bg-neutral-900 shadow-inner"
                      >
                        <option value={0}>— SELECT MATCH —</option>
                        {matches.map(m => (
                          <option key={m.matchId} value={m.matchId}>
                             {m.circuitLocation} [RD {m.gamedayId}]
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-700 group-hover:text-red-600 transition-colors pointer-events-none rotate-90" />
                    </div>
                    {viewMatchId > 0 && (
                      <div className="flex justify-center mt-2">
                        <Badge className="bg-neutral-950 border-white/10 text-neutral-400 font-black italic uppercase tracking-widest text-[9px] px-4 h-8 flex items-center gap-2">
                          Status: <span className="text-red-600">{getStatusLabel(matches.find(m => m.matchId === viewMatchId)?.status || 0)}</span>
                        </Badge>
                      </div>
                    )}
                  </div>

                  {viewMatchId > 0 && (
                    <div className="pt-8 space-y-8 animate-in zoom-in-95 duration-500">
                      {matches.find(m => m.matchId === viewMatchId)?.status === 4 && (
                        <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl flex items-center justify-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-black uppercase italic tracking-widest text-green-500">Points already calculated for this match</span>
                        </div>
                      )}

                      <Button
                        onClick={async () => {
                          if (!confirm("Are you sure you want to run points calculation for this match? This cannot be undone easily.")) return;
                          try {
                            setLoading(true);
                            console.log("Sending Points Calculation Request:", { matchId: viewMatchId });
                            const response = await api.post(`/admin/api/pointscalculation/pc`, { matchId: viewMatchId });
                            console.log("Points Calculation Success:", response.data);
                            alert("Points Calculated Successfully!");
                            setMatches(matches.map(match => match.matchId === viewMatchId ? { ...match, status: 4 } : match));
                          } catch (error: any) {
                            console.error("Points Calculation Error Details:", error.response?.data || error);
                            const msg = error.response?.data?.message || error.message || "Failed to calculate points";
                            alert(`Error: ${msg}`);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest h-14 rounded-xl shadow-lg shadow-red-600/10 text-sm"
                      >
                        {loading ? "Processing..." : "Run Points Calculation"}
                      </Button>
                    </div>
                  )}
               </div>
            </Card>
          </div>
        )}
      </main>

      {/* 🔹 SELECTOR MODALS 🔹 */}
      {showDriverSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md" onClick={() => setShowDriverSelector(false)} />
          <Card className="relative bg-neutral-900 border border-white/10 rounded-[3rem] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <CardHeader className="bg-neutral-950 p-8 border-b border-white/5 flex flex-row items-center justify-between">
               <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Driver <span className="text-red-600">Selection</span></CardTitle>
               <Button variant="ghost" size="icon" onClick={() => setShowDriverSelector(false)} className="rounded-full"><X className="w-6 h-6" /></Button>
            </CardHeader>
            <CardContent className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {players.filter(p => !options.some(opt => opt.optionDesc === p.playerName)).map(p => (
                   <div 
                    key={p.playerId} 
                    onClick={() => handleDriverToggle(p.playerId)}
                    className={cn(
                      "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                      selectedDriverIds.includes(p.playerId) ? "bg-red-600 border-red-600 shadow-lg shadow-red-600/20" : "bg-neutral-950 border-white/5 hover:border-red-600/50"
                    )}
                   >
                     <span className={cn("font-black italic uppercase text-sm", selectedDriverIds.includes(p.playerId) ? "text-white" : "text-neutral-300 group-hover:text-white")}>
                       {p.playerName}
                     </span>
                     {selectedDriverIds.includes(p.playerId) && <Check className="w-4 h-4 text-white" />}
                   </div>
                ))}
              </div>
            </CardContent>
            <div className="p-8 bg-neutral-950 border-t border-white/5 flex gap-4">
               <Button onClick={handleAddSelectedDrivers} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest h-14 rounded-xl shadow-lg">Confirm Selection</Button>
               <Button variant="outline" onClick={() => setShowDriverSelector(false)} className="flex-1 border-white/10 text-neutral-400 font-black uppercase italic tracking-widest h-14 rounded-xl">Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {showTeamSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md" onClick={() => setShowTeamSelector(false)} />
          <Card className="relative bg-neutral-900 border border-white/10 rounded-[3rem] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <CardHeader className="bg-neutral-950 p-8 border-b border-white/5 flex flex-row items-center justify-between">
               <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Team <span className="text-red-600">Selection</span></CardTitle>
               <Button variant="ghost" size="icon" onClick={() => setShowTeamSelector(false)} className="rounded-full"><X className="w-6 h-6" /></Button>
            </CardHeader>
            <CardContent className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teams.filter(t => !options.some(opt => opt.optionDesc === t.teamName)).map(t => (
                   <div 
                    key={t.teamId} 
                    onClick={() => handleTeamToggle(t.teamId)}
                    className={cn(
                      "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                      selectedTeamIds.includes(t.teamId) ? "bg-red-600 border-red-600 shadow-lg shadow-red-600/20" : "bg-neutral-950 border-white/5 hover:border-red-600/50"
                    )}
                   >
                     <span className={cn("font-black italic uppercase text-sm", selectedTeamIds.includes(t.teamId) ? "text-white" : "text-neutral-300 group-hover:text-white")}>
                       {t.teamName}
                     </span>
                     {selectedTeamIds.includes(t.teamId) && <Check className="w-4 h-4 text-white" />}
                   </div>
                ))}
              </div>
            </CardContent>
            <div className="p-8 bg-neutral-950 border-t border-white/5 flex gap-4">
               <Button onClick={handleAddSelectedTeams} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest h-14 rounded-xl shadow-lg">Confirm Selection</Button>
               <Button variant="outline" onClick={() => setShowTeamSelector(false)} className="flex-1 border-white/10 text-neutral-400 font-black uppercase italic tracking-widest h-14 rounded-xl">Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
