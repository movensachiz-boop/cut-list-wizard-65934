import { Link } from "react-router-dom";
import { ArrowLeft, Server, Shield, Zap, Globe, Lock, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to App
          </Button>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">About Our Platform</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Professional cutting list management and optimization software built for modern workshops.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <Server className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Cloud Infrastructure</h3>
              <p className="text-muted-foreground">
                Our platform runs on enterprise-grade cloud servers with automatic scaling to handle any workload. Your data is processed quickly and reliably.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <Shield className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure by Design</h3>
              <p className="text-muted-foreground">
                All data is encrypted in transit and at rest. We use industry-standard security protocols to protect your information.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <Zap className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">High Performance</h3>
              <p className="text-muted-foreground">
                Optimized algorithms ensure fast processing times. Our optimization engine delivers results in seconds, not minutes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <Globe className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Global Availability</h3>
              <p className="text-muted-foreground">
                Access your cutting lists from anywhere in the world. Our distributed infrastructure ensures low latency globally.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <Lock className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">License Protected</h3>
              <p className="text-muted-foreground">
                Enterprise-grade licensing system ensures only authorized users can access the platform. Each license is uniquely tied to your organization.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <Database className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Backend</h3>
              <p className="text-muted-foreground">
                We use a secure cloud-based backend infrastructure with automatic backups and disaster recovery capabilities.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-semibold mb-4">Technical Specifications</h3>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <p className="font-medium text-foreground">API</p>
                <p className="text-muted-foreground">RESTful architecture with secure endpoints</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Encryption</p>
                <p className="text-muted-foreground">TLS 1.3 / AES-256</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Uptime</p>
                <p className="text-muted-foreground">99.9% SLA guaranteed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground/70 mt-12 text-sm">
          © DATAPLEX PROPERTIES
        </p>
      </div>
    </div>
  );
};

export default About;
