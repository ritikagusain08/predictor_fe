import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShieldCheck, Trophy, ArrowRight } from "lucide-react";

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-red-600/20 rounded-3xl flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
            <Trophy className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-center">
            F1 <span className="text-red-600">Predictor</span>
          </h1>
          <p className="text-neutral-400 mt-2 font-medium">Welcome! Please choose how you want to continue.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PLAYER OPTION */}
          <Card 
            className="bg-neutral-900/50 border-neutral-800 hover:border-red-500/50 transition-all cursor-pointer group hover:bg-neutral-900"
            onClick={() => navigate("/login")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center mb-2 group-hover:bg-red-600/20 transition-colors">
                <User className="w-6 h-6 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold group-hover:text-red-400 transition-colors text-white">Player</CardTitle>
              <CardDescription className="text-neutral-400">
                Join matches, make predictions, and win points!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11">
                Start Playing <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* ADMIN OPTION */}
          <Card 
            className="bg-neutral-900/50 border-neutral-800 hover:border-red-500/50 transition-all cursor-pointer group hover:bg-neutral-900"
            onClick={() => navigate("/admin")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center mb-2 group-hover:bg-red-600/20 transition-colors">
                <ShieldCheck className="w-6 h-6 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold group-hover:text-red-400 transition-colors text-white">Admin</CardTitle>
              <CardDescription className="text-neutral-400">
                Manage matches, questions, and see player scores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-neutral-700 hover:bg-neutral-800 text-white h-11">
                Go to Admin Panel
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-neutral-600 text-xs mt-12 font-medium tracking-widest uppercase">
          Predictor Game v2.0 • 2026 Season
        </p>
      </div>
    </div>
  );
}
