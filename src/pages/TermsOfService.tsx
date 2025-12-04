import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: December 2024
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using the DATAPLEX PROPERTIES cutting list management software ("Service"), 
              you agree to be bound by these Terms of Service. If you disagree with any part of these terms, 
              you do not have permission to access the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. License Grant</h2>
            <p className="text-muted-foreground">
              Subject to your compliance with these Terms, DATAPLEX PROPERTIES grants you a limited, 
              non-exclusive, non-transferable, revocable license to use the Service for your internal 
              business purposes. This license is contingent upon maintaining a valid license key.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. License Key Terms</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Each license key is issued for use by a single business entity</li>
              <li>License keys may not be shared, transferred, or resold</li>
              <li>Expired or suspended licenses will result in immediate loss of access</li>
              <li>DATAPLEX PROPERTIES reserves the right to revoke licenses for violations of these terms</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Acceptable Use</h2>
            <p className="text-muted-foreground">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Reverse engineer, decompile, or disassemble the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Share your license key with unauthorized parties</li>
              <li>Circumvent any security measures or access controls</li>
              <li>Use automated systems to access the Service without permission</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The Service and its original content, features, and functionality are owned by 
              DATAPLEX PROPERTIES and are protected by international copyright, trademark, patent, 
              trade secret, and other intellectual property laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Data Ownership</h2>
            <p className="text-muted-foreground">
              You retain all rights to the cutting lists, project data, and other content you create 
              using the Service. DATAPLEX PROPERTIES does not claim ownership of your data. However, 
              you grant us permission to store and process your data as necessary to provide the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Service Availability</h2>
            <p className="text-muted-foreground">
              We strive to maintain Service availability but do not guarantee uninterrupted access. 
              The Service may be temporarily unavailable due to maintenance, updates, or circumstances 
              beyond our control.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, DATAPLEX PROPERTIES shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages, including loss of 
              profits, data, or business opportunities arising from your use of the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Warranty Disclaimer</h2>
            <p className="text-muted-foreground">
              The Service is provided "as is" without warranties of any kind, either express or implied, 
              including but not limited to implied warranties of merchantability, fitness for a particular 
              purpose, and non-infringement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">10. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your access immediately, without prior notice or liability, 
              for any reason, including breach of these Terms. Upon termination, your right to use the 
              Service will cease immediately.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">11. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We will notify users of significant 
              changes. Your continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">12. Contact Information</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-muted-foreground">
              DATAPLEX PROPERTIES<br />
              Phone: +263 786133259
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            DATAPLEX PROPERTIES
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
