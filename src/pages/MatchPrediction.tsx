import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import type { Question } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, ChevronLeft, ChevronRight, Rocket, CheckCircle2, 
  Zap, Search, ZapOff, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MatchPrediction() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { match, isEdit } = state || {};
  const matchId = match?.matchId;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  
  // 🔹 Updated to store only ONE boosted question ID per match
  const [boostedQuestionId, setBoostedQuestionId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!matchId) {
      navigate("/dashboard");
    }
  }, [matchId, navigate]);

  useEffect(() => {
    if (!matchId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Use user-facing endpoint instead of admin if possible
        const { data } = await api.get<Question[]>(`/api/questions/${matchId}`);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          setQuestions([]);
          setLoading(false);
          return;
        }

        const sorted = [...data].sort((a, b) => a.questionNo - b.questionNo);
        setQuestions(sorted);

        if (isEdit) {
          const userId = localStorage.getItem("userId");
          if (!userId) return;

          const { data: predData } = await api.get(`/api/predictions/get/${userId}/${matchId}`);
          
          if (predData && predData.predictions) {
            const formattedAnswers: Record<number, number[]> = {};
            let activeBoosterId: number | null = null;

            predData.predictions.forEach((p: any) => {
              formattedAnswers[p.questionId] = p.answers.map((a: any) => a.optionId);
              if (p.hasBooster) {
                activeBoosterId = p.questionId;
              }
            });

            setAnswers(formattedAnswers);
            setBoostedQuestionId(activeBoosterId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch prediction data:", err);
        // Fallback to admin endpoint if user one fails (some environments use admin for both)
        try {
           const { data: adminData } = await api.get<Question[]>(`/admin/api/questions/${matchId}`);
           if (adminData && Array.isArray(adminData)) {
              setQuestions(adminData.sort((a, b) => a.questionNo - b.questionNo));
           }
        } catch (adminErr) {
           console.error("Admin fallback also failed:", adminErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchId, isEdit]);

  const handleSelect = (questionId: number, optionId: number) => {
    const q = questions.find(q => q.id === questionId);
    if (!q) return;

    setAnswers((prev) => {
      const selected = prev[questionId] || [];
      if (q.choiceLimit === 1) {
        return { ...prev, [questionId]: [optionId] };
      }
      if (selected.includes(optionId)) {
        return { ...prev, [questionId]: selected.filter(id => id !== optionId) };
      }
      if (selected.length < q.choiceLimit) {
        return { ...prev, [questionId]: [...selected, optionId] };
      }
      return prev;
    });
  };

  const handleSave = async () => {
    const q = questions[currentIndex];
    const picked = answers[q.id] || [];
    
    // 🔹 Only true if THIS question is the one currently boosted
    const hasBooster = boostedQuestionId === q.id;

    if (picked.length === 0) return;

    try {
      setSubmitting(true);
      const userId = localStorage.getItem("userId");
      await api.post("/api/predictions/create", {
        userId,
        matchId,
        questionId: q.id,
        hasBooster,
        answers: picked.map((id, index) => ({ optionId: id, position: index }))
      });

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      alert("Failed to save answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion && !loading) return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-6">
      <div className="bg-red-600/10 p-4 rounded-full">
         <ZapOff className="w-8 h-8 text-red-600" />
      </div>
      <div className="text-center space-y-2">
         <p className="text-white font-black uppercase italic tracking-widest text-lg">No Questions Found</p>
         <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px] italic">Telemetry data is unavailable for this race.</p>
      </div>
      <Button 
        variant="outline" 
        className="border-white/10 text-neutral-400 hover:text-white"
        onClick={() => navigate("/dashboard")}
      >
        Return to Paddock
      </Button>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-6">
      <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px] italic">Telemetry Sync...</p>
    </div>
  );

  const selected = answers[currentQuestion.id] || [];
  const progressValue = ((currentIndex + 1) / questions.length) * 100;
  
  // 🔹 Booster active ONLY for this question
  const isBoosted = boostedQuestionId === currentQuestion.id;

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-12 relative overflow-hidden font-outfit">
      <img 
        src="/track_bg.png" 
        alt="Circuit" 
        className="fixed inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
      />
      <div className="fixed inset-0 bg-neutral-950/80 pointer-events-none" />

      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-neutral-950/90 backdrop-blur-xl h-12 relative">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="bg-red-600 p-1 rounded-sm">
               <Trophy className="w-3 h-3 text-white" />
            </div>
            <span className="font-black tracking-tighter uppercase italic text-lg">F1 <span className="text-red-600">Predictor</span></span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-bold uppercase text-neutral-500 italic tracking-widest">{match?.circuitLocation}</span>
            <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-white font-bold h-7 text-[10px]" onClick={() => navigate("/dashboard")}>
              Exit
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 pt-8 relative z-10">
        
        {/* 🔹 PROGRESS */}
        <div className="flex justify-between items-end mb-6 px-1">
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Session Data</span>
              <div className="flex items-center gap-2">
                 <span className="font-mono text-2xl font-black text-white italic">0{currentIndex + 1}</span>
                 <div className="h-1 w-20 bg-neutral-950 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 transition-all duration-700 shadow-[0_0_10px_rgba(225,6,0,0.5)]" style={{ width: `${progressValue}%` }} />
                 </div>
              </div>
           </div>
           <Badge variant="outline" className="bg-neutral-950 border-white/5 text-neutral-500 text-[8px] font-black uppercase italic tracking-widest px-3 py-0.5">
              {Math.round(progressValue)}% SYNCED
           </Badge>
        </div>

        <Card className="bg-neutral-900/40 border border-white/5 backdrop-blur-3xl overflow-hidden shadow-2xl rounded-2xl">
          <div className="h-1 w-full bg-red-600" />
          
          <CardHeader className="pb-2 p-8">
            <div className="flex items-center gap-2 mb-2">
               <Activity className="w-3.5 h-3.5 text-red-600" />
               <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.4em] italic">Current session task</span>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white leading-tight mb-2">
              {currentQuestion.questionDescription}
            </CardTitle>
            <p className="text-neutral-500 font-bold italic uppercase tracking-widest text-[9px] flex items-center gap-2">
               <Search className="w-3 h-3 text-red-600" />
               Pick {currentQuestion.choiceLimit} {currentQuestion.choiceLimit === 1 ? "Best Answer" : "Answers"}
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-4 pt-2">
            <div className="grid grid-cols-1 gap-2.5">
              {currentQuestion.options.map((opt: any) => {
                const isActive = selected.includes(opt.optionId);
                return (
                  <div 
                    key={opt.optionId} 
                    onClick={() => handleSelect(currentQuestion.id, opt.optionId)}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                      isActive 
                        ? "bg-red-600/5 border-red-600" 
                        : "bg-neutral-950/40 border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                         isActive ? "border-red-600 bg-red-600" : "border-neutral-800"
                       )}>
                          {isActive && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                       </div>
                       <span className={cn("font-bold text-base transition-all italic uppercase tracking-tight", isActive ? "text-white" : "text-neutral-400 group-hover:text-white")}>
                         {opt.optionDesc}
                       </span>
                    </div>
                    <div className={cn(
                      "font-mono text-[9px] font-black italic uppercase tracking-widest px-2 py-0.5 rounded-sm",
                      isActive ? "bg-red-600 text-white" : "bg-neutral-900 text-neutral-600"
                    )}>
                      +{opt.points || 10}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 🔹 EXCLUSIVE NEON BOOSTER PILL */}
            <div className="mt-8 pt-4 border-t border-white/5">
               <button 
                 onClick={() => setBoostedQuestionId(isBoosted ? null : currentQuestion.id)}
                 className={cn(
                   "w-full flex items-center justify-between px-6 py-4 rounded-full border-2 transition-all relative group overflow-hidden",
                   isBoosted 
                     ? "bg-orange-600/10 border-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.3)]" 
                     : "bg-neutral-950 border-white/5 text-neutral-600 hover:border-white/10"
                 )}
               >
                 {isBoosted && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />}
                 <div className="flex items-center gap-4 z-10">
                    <Rocket className={cn("w-5 h-5 transition-transform duration-500", isBoosted ? "text-orange-500 scale-125 rotate-12" : "text-neutral-800")} />
                    <div className="flex flex-col items-start">
                       <span className="text-[10px] font-black uppercase italic tracking-[0.2em] leading-none mb-1">Booster Status</span>
                       <span className={cn("text-xs font-black uppercase italic", isBoosted ? "text-orange-500" : "text-neutral-500")}>
                          {isBoosted ? "Nitro Active • 2x Points" : "Prime 2x Multiplier"}
                       </span>
                    </div>
                 </div>
                 <div className={cn(
                    "w-8 h-8 rounded-full border flex items-center justify-center transition-all z-10",
                    isBoosted ? "bg-orange-500 border-orange-400 text-white shadow-lg" : "bg-neutral-900 border-white/5"
                 )}>
                    <Zap className={cn("w-4 h-4", isBoosted ? "fill-current" : "text-neutral-700")} />
                 </div>
               </button>
            </div>
          </CardContent>

          <CardFooter className="px-8 pb-8 pt-2 flex justify-between gap-4">
            <Button 
              variant="outline" 
              className="flex-1 border-white/5 bg-transparent hover:bg-neutral-900 text-neutral-600 hover:text-white h-12 rounded-xl font-black uppercase italic tracking-widest text-[10px]"
              disabled={currentIndex === 0 || submitting} 
              onClick={() => setCurrentIndex(prev => prev - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button 
              className={cn(
                "flex-[1.8] h-12 rounded-xl font-black uppercase italic tracking-widest transition-all text-xs",
                selected.length > 0 ? "bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/20" : "bg-neutral-800 text-neutral-600"
              )}
              disabled={submitting || selected.length === 0} 
              onClick={handleSave}
            >
              {submitting ? "Saving..." : (currentIndex === questions.length - 1 ? "Finish GP" : "Next Session")}
              {currentIndex < questions.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}