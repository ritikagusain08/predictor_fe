import { useState } from "react";
import { api } from "../api/api";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth/register", { email, username, password });
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mb-4 border border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <Trophy className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">F1 <span className="text-red-600">Predictor</span></h1>
        </div>

        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">Create Account</CardTitle>
            <CardDescription className="text-neutral-400 text-center">
              Sign up to start playing and winning points!
            </CardDescription>
          </CardHeader>
          
          {success ? (
            <CardContent className="py-10 flex flex-col items-center justify-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
              <p className="text-xl font-bold text-center">All done!</p>
              <p className="text-neutral-400 text-center text-sm font-medium">Sending you to the login page now...</p>
            </CardContent>
          ) : (
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                
                {/* USERNAME */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-neutral-300">Username (Pick a game name)</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 w-4 h-4 text-neutral-500 group-focus-within:text-red-500 transition-colors" />
                    <Input 
                      id="username"
                      type="text" 
                      autoComplete="username"
                      placeholder="e.g. SpeedRacer99" 
                      className="bg-neutral-950 border-neutral-800 pl-10 focus-visible:ring-red-500 focus-visible:border-red-500 text-white h-11"
                      required 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-300">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-500 group-focus-within:text-red-500 transition-colors" />
                    <Input 
                      id="email"
                      type="email" 
                      autoComplete="email"
                      placeholder="example@gmail.com" 
                      className="bg-neutral-950 border-neutral-800 pl-10 focus-visible:ring-red-500 focus-visible:border-red-500 text-white h-11"
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-neutral-300">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-500 group-focus-within:text-red-500 transition-colors" />
                    <Input 
                      id="password"
                      type="password" 
                      placeholder="Choose a strong password" 
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
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
                <div className="text-sm text-neutral-500 text-center font-bold">
                  Already have an account?{" "}
                  <Link to="/" className="text-red-500 hover:text-red-400 underline transition-colors">Login here</Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
