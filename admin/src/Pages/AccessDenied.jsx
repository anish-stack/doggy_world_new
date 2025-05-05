import React from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-2xl mx-auto mt-12">
      <CardHeader className="bg-red-50 border-b">
        <CardTitle className="flex items-center text-red-700 gap-2">
          <AlertCircle className="h-5 w-5" />
          Access Restricted
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 pb-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">You don't have access to this area</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Your current role doesn't have permission to view this section. Please contact an administrator if you believe you should have access.
            </p>
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessDenied;