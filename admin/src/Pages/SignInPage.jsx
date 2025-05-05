import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import AuthContext from "@/context/authContext";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, clearError } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const cred = {email, password}
    await login(cred);

      toast.success("Signed in successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card className="border-red-100 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://doggyworld.in/assets/images/dogy-world-logo-b.webp" 
                alt="Doggy World Logo" 
                className="h-20 w-auto"
              />
            </div>
            <CardTitle className="text-2xl text-center text-red-600">Sign in to Doggy World</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access your pet's paradise
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-red-200 focus:border-red-400 focus:ring-red-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-red-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-red-200 focus:border-red-400 focus:ring-red-400"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>
            
            <div className="mt-6 text-center text-sm">
              <span>Don't have an account? </span>
              <Link to="/signup" className="text-red-600 hover:underline font-medium">
                Sign up
              </Link>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <Link to="/" className="flex items-center justify-center text-sm text-gray-500 hover:text-red-600 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Doggy World Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignInPage;