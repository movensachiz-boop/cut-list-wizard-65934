import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

const QUESTION_1_ANSWER = "Y";
const QUESTION_2_ANSWER = "W";

const AdminLogin = () => {
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (answer1.toUpperCase().trim() === QUESTION_1_ANSWER && answer2.toUpperCase().trim() === QUESTION_2_ANSWER) {
      sessionStorage.setItem("admin_authenticated", "true");
      toast.success("Welcome, Admin!");
      navigate('/admin');
    } else {
      toast.error("Incorrect answers");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>Answer the security questions to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="answer1">What is X?</Label>
              <Input
                id="answer1"
                type="text"
                value={answer1}
                onChange={(e) => setAnswer1(e.target.value)}
                placeholder="Enter answer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer2">What is DOG?</Label>
              <Input
                id="answer2"
                type="text"
                value={answer2}
                onChange={(e) => setAnswer2(e.target.value)}
                placeholder="Enter answer"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
