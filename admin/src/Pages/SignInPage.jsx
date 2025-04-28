import { useEffect, useState } from "react";
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
import { MessageSquare, ArrowLeft } from "lucide-react";
import { toast } from "sonner";


import axios from "axios";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();




  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
       

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <div className="bg-blue-600 p-2 rounded-full">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Sign in to Clinic Dashboard</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form >
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
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="#" className="text-sm text-blue-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>

            <div className="mt-4 text-center text-sm">
              <span>Don't have an account? </span>
              <Link to="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>

         
        </Card>
      </div>
    </div>
  );
};

export default SignInPage;
