import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronLeft, Target, Star, History } from "lucide-react";

export default function MyResults() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <nav className="max-w-6xl mx-auto flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
           <Trophy className="w-8 h-8 text-blue-500" />
           <h1 className="text-3xl font-black italic uppercase tracking-tighter">My <span className="text-blue-500">Performance</span></h1>
        </div>
        <Button onClick={() => navigate("/dashboard")} variant="outline" className="border-neutral-800 rounded-xl">
           <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </nav>

      <div className="max-w-6xl mx-auto space-y-12">
         {/* DUMMY STATS */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-800 flex flex-col items-center text-center space-y-4">
               <Target className="w-12 h-12 text-blue-500" />
               <div className="text-5xl font-black italic">78.4%</div>
               <div className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Total Accuracy</div>
            </div>
            <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-800 flex flex-col items-center text-center space-y-4">
               <Star className="w-12 h-12 text-yellow-500" />
               <div className="text-5xl font-black italic">12,450</div>
               <div className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Total Points Earned</div>
            </div>
            <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-800 flex flex-col items-center text-center space-y-4">
               <History className="w-12 h-12 text-purple-500" />
               <div className="text-5xl font-black italic">14</div>
               <div className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Races Completed</div>
            </div>
         </div>

         <div className="bg-neutral-900 rounded-[2.5rem] border border-neutral-800 p-12 text-center">
            <div className="max-w-md mx-auto space-y-6">
               <div className="text-2xl font-bold italic uppercase tracking-tight">Full Result History</div>
               <p className="text-neutral-500">Detailed match-by-match breakdown is currently under development. Check back soon for your full racing history!</p>
               <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-blue-600 animate-[loading_2s_infinite]" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
