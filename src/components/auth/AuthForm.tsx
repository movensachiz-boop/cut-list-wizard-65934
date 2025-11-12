import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const { toast } = useToast();

  // Check user count when switching to signup mode
  useEffect(() => {
    if (!isLogin) {
      checkUserLimit();
    }
  }, [isLogin]);

  const checkUserLimit = async () => {
    setCheckingLimit(true);
    try {
      const { data, error } = await supabase.rpc('get_user_count');
      if (error) throw error;
      setUserCount(data);
    } catch (error) {
      console.error('Error checking user limit:', error);
    } finally {
      setCheckingLimit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Welcome back!" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        toast({ title: "Account created! Please check your email." });
      }
    } catch (error: any) {
      const errorMessage = error.message.includes('User registration limit reached')
        ? 'Registration is currently full. Maximum 10 users allowed.'
        : error.message;
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isRegistrationFull = userCount !== null && userCount >= 10;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isLogin ? "Sign In" : "Sign Up"}</CardTitle>
        <CardDescription>
          {isLogin ? "Welcome back!" : isRegistrationFull ? "Registration Full" : "Create your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isLogin && isRegistrationFull && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Registration Limit Reached</AlertTitle>
            <AlertDescription>
              We've reached our maximum capacity of 10 users. Please contact the administrator for access.
            </AlertDescription>
          </Alert>
        )}
        
        {checkingLimit && !isLogin && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {(!checkingLimit || isLogin) && (
          <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || (!isLogin && isRegistrationFull)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? "Sign In" : "Sign Up"}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Need an account? Sign up" : "Have an account? Sign in"}
          </Button>
        </form>
        )}
      </CardContent>
    </Card>
  );
};