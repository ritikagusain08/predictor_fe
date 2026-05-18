import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronLeft, ChevronRight, CheckCircle2, FileText, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionData {
  id: number;
  questionNo: number;
  questionDescription: string;
  questionType: string;
  choiceLimit: number;
  questionStatus: number;
  options: OptionData[];
}

interface OptionData {
  id: number;
  optionId: number;
  optionDesc: string;
  points: number;
  position: number;
  isCorrect: boolean;
}

interface PredictionData {
  id: number;
  questionId: number;
  points: number;
  hasBooster: boolean;
  answers: {
    optionId: number;
    position: number;
  }[];
}

export default function MatchResultDetails() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (matchId) {
      fetchMatchDetails(Number(matchId));
    }
  }, [matchId]);

  const fetchMatchDetails = async (id: number) => {
    try {
      setLoading(true);
      const { data: qData } = await api.get<QuestionData[]>(`/admin/api/questions/${id}`);
      const sortedQuestions = (qData || []).sort((a, b) => a.questionNo - b.questionNo);
      setQuestions(sortedQuestions);

      const { data: pData } = await api.get<{ is_predicted: number, predictions: PredictionData[] }>(`/api/predictions/get/${id}`);
      setPredictions(pData.predictions || []);
    } catch (err) {
      console.error("Error fetching match details", err);
      setQuestions([]);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return "NOT STARTED";
      case 1: return "OPEN";
      case 2: return "LOCKED";
      case 3: return "PC STARTED";
      case 4: return "COMPLETED";
      default: return "UNKNOWN";
    }
  };

  const calculateTotalPoints = () => {
    return predictions.reduce((sum, p) => sum + (p.points || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-6">
        <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px] italic">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-12 relative overflow-x-hidden font-outfit">
      <img 
        src="/track_bg.png" 
        alt="Circuit" 
        className="fixed inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
      />
      <div className="fixed inset-0 bg-neutral-950/80 pointer-events-none" />

      {/* 🔹 NAVIGATION */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-neutral-950/90 backdrop-blur-xl h-16 mb-8 relative">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/dashboard")}>
            <div className="bg-red-600 p-1 rounded-sm group-hover:rotate-12 transition-transform">
               <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-black tracking-tighter uppercase italic text-2xl">F1 <span className="text-red-600">Predictor</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-white hover:text-white hover:text-white font-bold h-7 text-[10px]" onClick={() => navigate("/my-results")}>
              <ChevronLeft className="w-3 h-3 mr-1" /> Back to Results
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <Activity className="w-4 h-4 text-red-600" />
               <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] italic">Match Results</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
              Round <span className="text-red-600">{matchId}</span> <span className="text-white/50 text-3xl">Results</span>
            </h1>
          </div>
          
          <div className="bg-neutral-900/60 border border-red-500/20 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-xl shadow-red-600/10">
            <div className="bg-red-600 p-3 rounded-xl">
               <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Total Match Points</p>
              <p className="text-4xl font-black italic text-white tracking-tighter leading-none">{calculateTotalPoints()}</p>
            </div>
          </div>
        </div>

        {questions.length === 0 ? (
           <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-neutral-900/20">
              <FileText className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <p className="font-black uppercase italic text-neutral-400 text-sm tracking-widest">No questions available for this match.</p>
           </div>
         ) : (
           <div className="space-y-6">
             {(() => {
               const q = questions[currentIndex];
               const pred = predictions.find(p => p.questionId === q.id);
               const isPodium = q.questionType.toUpperCase().includes("PODIUM");
               const progressValue = ((currentIndex + 1) / questions.length) * 100;
               
               return (
                 <div className="space-y-6">
                   {/* 🔹 PROGRESS */}
                   <div className="flex justify-between items-end px-1">
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-white hover:text-white uppercase tracking-widest mb-1">Progress</span>
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

                   <Card className="bg-neutral-900/60 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                     <div className="h-1 w-full bg-red-600" />
                     <CardHeader className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between gap-6">
                       <div className="flex-1">
                         <div className="flex flex-wrap items-center gap-3 mb-3">
                           <Badge className="bg-red-600 text-white font-black italic uppercase tracking-widest text-[10px] border-none shadow-md shadow-red-600/20">
                             Q{q.questionNo}
                           </Badge>
                           <Badge variant="outline" className="border-neutral-800 text-neutral-400 text-[9px] font-black uppercase tracking-widest">
                             {q.questionType}
                           </Badge>
                           <Badge variant="outline" className={cn(
                             "text-[9px] font-black uppercase tracking-widest border-none px-2",
                             q.questionStatus >= 3 ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                           )}>
                             {getStatusLabel(q.questionStatus)}
                           </Badge>
                         </div>
                         <CardTitle className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight leading-tight">
                           {q.questionDescription}
                         </CardTitle>
                       </div>
                       
                       <div className="shrink-0 text-left md:text-right bg-neutral-950/50 p-4 rounded-xl border border-white/5 min-w-[120px]">
                         <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-1">Points Earned</p>
                         <p className={cn(
                           "text-4xl font-black italic tracking-tighter leading-none",
                           pred && pred.points > 0 ? "text-green-500" : "text-neutral-500"
                         )}>
                           {pred ? pred.points : 0}
                         </p>
                         {pred?.hasBooster && (
                           <Badge className="mt-2 bg-yellow-500/10 text-yellow-500 border-none text-[8px] font-black uppercase tracking-widest block w-fit md:ml-auto">
                             Booster (x2)
                           </Badge>
                         )}
                       </div>
                     </CardHeader>
                     <CardContent className="px-8 pb-4 pt-2">
                       <div className="grid grid-cols-1 gap-2.5">
                         {q.options.map((opt) => {
                           const predictedAns = pred?.answers.find(a => a.optionId === opt.optionId);
                           const isPredicted = !!predictedAns;
                           const isCorrect = opt.isCorrect;
                           
                           // Determine styling based on correctness and prediction
                           let containerStyle = "bg-neutral-950/40 border-white/5 opacity-50";
                           let iconStyle = "border-neutral-800";
                           let textStyle = "text-neutral-500";
                           let badgeStyle = "bg-neutral-900 text-neutral-600";
                           
                           let pointsText = "";
                           
                           if (isPredicted && isCorrect) {
                             containerStyle = "bg-green-600/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                             iconStyle = "border-green-500 bg-green-500";
                             textStyle = "text-green-400 font-black";
                             badgeStyle = "bg-green-600 text-white";
                             pointsText = `+${opt.points || 10} pts`;
                           } else if (isPredicted && !isCorrect) {
                             containerStyle = "bg-red-600/10 border-red-500/50";
                             iconStyle = "border-red-500/50 bg-red-500/50";
                             textStyle = "text-red-400 font-bold opacity-80";
                             badgeStyle = "bg-red-500/50 text-white/80";
                             pointsText = "0 pts";
                           } else if (!isPredicted && isCorrect) {
                             containerStyle = "bg-neutral-900 border-green-500/50 border-dashed";
                             iconStyle = "border-green-500/50";
                             textStyle = "text-green-500/70 font-bold";
                             badgeStyle = "bg-neutral-800 text-green-500/70";
                             pointsText = `Worth ${opt.points || 10} pts`;
                           } else {
                             pointsText = "-";
                           }

                           return (
                             <div 
                               key={opt.optionId} 
                               className={cn(
                                 "p-3.5 rounded-xl border flex items-center justify-between",
                                 containerStyle
                               )}
                             >
                               <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                    iconStyle
                                  )}>
                                     {isPredicted && isCorrect && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                                     {isPredicted && !isCorrect && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  
                                  {isPodium && (isPredicted || isCorrect) && (
                                    <div className={cn(
                                      "w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px]",
                                      (predictedAns?.position || opt.position) === 1 ? "bg-yellow-500/20 text-yellow-500" :
                                      (predictedAns?.position || opt.position) === 2 ? "bg-slate-300/20 text-slate-300" :
                                      (predictedAns?.position || opt.position) === 3 ? "bg-orange-400/20 text-orange-400" : "bg-neutral-800 text-neutral-500"
                                    )}>
                                      P{predictedAns?.position || opt.position}
                                    </div>
                                  )}
                                  
                                  <span className={cn("text-base transition-all italic uppercase tracking-tight", textStyle)}>
                                    {opt.optionDesc}
                                  </span>
                               </div>
                               <div className={cn(
                                 "font-mono text-[9px] font-black italic uppercase tracking-widest px-2 py-0.5 rounded-sm",
                                 badgeStyle
                               )}>
                                 {pointsText}
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </CardContent>
                     <div className="p-6 md:p-8 border-t border-white/5 flex justify-between gap-4">
                       <Button 
                         variant="outline" 
                         className="border-neutral-800 hover:bg-neutral-800 font-bold uppercase italic tracking-widest text-[10px] px-6 h-12"
                         disabled={currentIndex === 0}
                         onClick={() => setCurrentIndex(prev => prev - 1)}
                       >
                         <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                       </Button>

                       {currentIndex < questions.length - 1 ? (
                         <Button 
                           className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase italic tracking-widest text-[10px] px-8 h-12 shadow-lg shadow-red-600/20"
                           onClick={() => setCurrentIndex(prev => prev + 1)}
                         >
                           Next <ChevronRight className="w-4 h-4 ml-2" />
                         </Button>
                       ) : (
                         <Button 
                           className="bg-green-600 hover:bg-green-700 text-white font-bold uppercase italic tracking-widest text-[10px] px-8 h-12 shadow-lg shadow-green-600/20"
                           onClick={() => navigate("/my-results")}
                         >
                           Finish Review <CheckCircle2 className="w-4 h-4 ml-2" />
                         </Button>
                       )}
                     </div>
                   </Card>
                 </div>
               );
             })()}
           </div>
         )}
      </div>
    </div>
  );
}
