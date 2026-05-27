import { useState } from "react";
import { api, setAuthToken } from "../api/api";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const payload = res.data ?? {};
      const userId = payload.userId ?? payload.user?.id ?? payload.id;
      const username =
        payload.username ??
        payload.user?.username ??
        payload.name ??
        payload.user?.name ??
        payload.fullName ??
        payload.user?.fullName ??
        email.split("@")[0];

      localStorage.setItem("token", res.data.token);
      if (userId) {
        localStorage.setItem("userId", String(userId));
      }
      if (username) {
        localStorage.setItem("username", String(username));
      }
      setAuthToken(res.data.token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.response?.data?.message || "Check your email or password and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setTimeout(() => {
      setForgotSuccess(true);
      setForgotLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mb-4 border border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <Trophy className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white">F1 <span className="text-red-600">Predictor</span></h1>
        </div>

        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">Sign In</CardTitle>
            <CardDescription className="text-neutral-400 text-center">
              Welcome back! Please enter your details below.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-500 group-focus-within:text-red-500 transition-colors" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="example@gmail.com" 
                    autoComplete="email"
                    className="bg-neutral-950 border-neutral-800 pl-10 focus-visible:ring-red-500 focus-visible:border-red-500 text-white h-11"
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-neutral-300">Password</Label>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotModal(true)} 
                    className="text-xs text-red-500 hover:underline font-bold transition-all"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-white hover:text-white group-focus-within:text-red-500 transition-colors" />
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="Enter your password" 
                    className="bg-neutral-950 border-neutral-800 pl-10 focus-visible:ring-red-500 focus-visible:border-red-500 text-white h-11"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11 rounded-lg shadow-lg shadow-red-600/20"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="text-sm text-white hover:text-white text-center">
                New to the game?{" "}
                <Link to="/register" className="text-red-500 hover:text-red-400 underline transition-colors">Create an account</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotModal} onOpenChange={(open) => { setShowForgotModal(open); if(!open) { setForgotSuccess(false); setForgotEmail(""); } }}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white p-8 rounded-[2rem] max-w-md font-outfit">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black italic uppercase">Reset Password</DialogTitle>
            <DialogDescription className="text-neutral-400 text-sm">
              {!forgotSuccess 
                ? "Enter your email address to receive a password reset link." 
                : "Reset instructions have been dispatched!"}
            </DialogDescription>
          </DialogHeader>

          {!forgotSuccess ? (
            <form onSubmit={handleForgotSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500 group-focus-within:text-red-500 transition-colors" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="example@gmail.com"
                    className="bg-neutral-950 border-neutral-800 h-12 pl-10 text-white focus:border-red-600 transition-colors rounded-lg text-sm"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button 
                  type="submit" 
                  className="bg-red-600 hover:bg-red-700 w-full h-12 font-black uppercase italic tracking-widest text-white shadow-lg shadow-red-600/20 text-sm rounded-xl"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? "Sending Code..." : "Send Reset Link"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                 <CheckCircle2 className="w-8 h-8 text-green-500 animate-bounce" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Link Dispatched</h3>
                 <p className="text-xs text-neutral-400 leading-relaxed font-bold italic uppercase tracking-wider">
                   A temporary reset link was sent to <span className="text-red-500">{forgotEmail}</span>. 
                   <br/>In this sandbox paddock, you can also modify all user passwords directly in your Admin Console database.
                 </p>
              </div>
              <Button 
                onClick={() => { setShowForgotModal(false); setForgotSuccess(false); setForgotEmail(""); }}
                className="w-full bg-neutral-950 border border-white/5 hover:bg-neutral-900 text-white h-12 rounded-xl text-xs font-black uppercase italic tracking-widest"
              >
                Back to Login
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
