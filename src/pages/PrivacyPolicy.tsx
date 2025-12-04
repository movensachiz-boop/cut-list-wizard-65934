import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: December 2024
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground">
              DATAPLEX PROPERTIES ("we", "our", or "us") respects your privacy and is committed to 
              protecting your personal data. This Privacy Policy explains how we collect, use, and 
              safeguard your information when you use our cutting list management software.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <h3 className="text-lg font-medium mt-4">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Company name and contact information</li>
              <li>License key information</li>
              <li>Cutting list data and project information</li>
              <li>Hardware selections and optimization preferences</li>
            </ul>

            <h3 className="text-lg font-medium mt-4">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>IP address and approximate location</li>
              <li>Browser type and device information</li>
              <li>Usage data and access timestamps</li>
              <li>Error logs and performance data</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <p className="text-muted-foreground">We use collected information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and maintain the Service</li>
              <li>Verify license validity and prevent unauthorized access</li>
              <li>Improve and optimize the Service</li>
              <li>Communicate with you about updates or issues</li>
              <li>Detect and prevent fraudulent or unauthorized use</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Data Storage and Security</h2>
            <p className="text-muted-foreground">
              Your data is stored securely on cloud servers with industry-standard encryption. 
              We implement appropriate technical and organizational measures to protect your 
              personal data against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Data is encrypted in transit and at rest</li>
              <li>Access to data is restricted to authorized personnel only</li>
              <li>Regular security audits and updates are performed</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. IP Address Logging</h2>
            <p className="text-muted-foreground">
              We log IP addresses for security purposes, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Preventing unauthorized access and license abuse</li>
              <li>Identifying suspicious activity patterns</li>
              <li>Protecting against security threats</li>
              <li>Complying with legal requirements</li>
            </ul>
            <p className="text-muted-foreground">
              IP addresses may be used to block access if suspicious or malicious activity is detected.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal data. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist in operating the Service (under strict confidentiality agreements)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your personal data for as long as your license is active and for a reasonable 
              period thereafter for legitimate business purposes. IP logs and access records are retained 
              for security analysis and may be kept for up to 12 months.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (subject to legal requirements)</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
            </ul>
            <p className="text-muted-foreground">
              To exercise these rights, please contact us using the information below.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Cookies and Local Storage</h2>
            <p className="text-muted-foreground">
              We use local storage to save your license key and preferences for convenience. 
              This data remains on your device and is used solely to maintain your session 
              and remember your settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">10. Children's Privacy</h2>
            <p className="text-muted-foreground">
              The Service is not intended for users under the age of 18. We do not knowingly 
              collect personal data from children.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">11. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any 
              significant changes by posting the new policy on this page with an updated revision date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">12. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
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

export default PrivacyPolicy;
