import type { Metadata } from "next";
import { APP_CONFIG } from "@/lib/app-config";

export const metadata: Metadata = {
  title: `Privacy Policy - ${APP_CONFIG.platformName}`,
  description: `Privacy Policy for the ${APP_CONFIG.platformName} app and admin platform.`,
};

const LAST_UPDATED = "18 August 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 text-sm leading-7 text-foreground/90">
          <section>
            <p>
              This Privacy Policy describes how {APP_CONFIG.platformName} (&ldquo;we&rdquo;,
              &ldquo;our&rdquo;, &ldquo;us&rdquo;) collects, uses, and protects information
              through the {APP_CONFIG.platformName} mobile app (visitor and exhibitor editions)
              and this administration platform, together the &ldquo;Service&rdquo;, operated in
              connection with the {APP_CONFIG.eventFullName}.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Information We Collect</h2>

            <h3 className="mt-4 font-medium text-foreground">Account &amp; Profile Information</h3>
            <p className="mt-1">
              When you create an account, we collect your name, email address, and phone number.
              Exhibitor accounts additionally collect company name, contact person, industry/category,
              website, and a company description. We also store any logo or banner images you choose
              to upload for your exhibitor profile.
            </p>

            <h3 className="mt-4 font-medium text-foreground">Location Information</h3>
            <p className="mt-1">
              With your explicit consent, the app can collect your device&rsquo;s location while you
              are at the event venue to power on-site features such as the venue map and attendance
              heatmap. You can decline or withdraw this consent at any time in the app; declining does
              not affect your ability to use ticketing, exhibitor, or other core features.
            </p>

            <h3 className="mt-4 font-medium text-foreground">Payment Information</h3>
            <p className="mt-1">
              Ticket and stand-booking payments are processed by Paynow, a licensed third-party
              payment provider. We do not receive or store your full card or mobile money credentials
              &mdash; we retain only the transaction reference, amount, and status needed to confirm
              your order.
            </p>

            <h3 className="mt-4 font-medium text-foreground">Device &amp; Usage Information</h3>
            <p className="mt-1">
              We collect standard technical information (such as a push-notification device token)
              so we can deliver event updates and ticket/order notifications to your device.
            </p>

            <h3 className="mt-4 font-medium text-foreground">Camera</h3>
            <p className="mt-1">
              The app requests camera access solely to scan QR codes for ticket check-in and
              exhibitor lead capture. Camera images are not stored or transmitted &mdash; only the
              decoded QR code data is used.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">How We Use Information</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>To create and manage your account, and process exhibitor applications</li>
              <li>To process ticket purchases and stand bookings, and issue tickets/receipts</li>
              <li>To operate the venue map, attendance heatmap, and related on-site features</li>
              <li>To send order confirmations, event updates, and service notifications</li>
              <li>To capture and manage exhibitor leads collected via QR scanning</li>
              <li>To maintain the security and integrity of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Third-Party Services</h2>
            <p className="mt-1">
              We rely on the following third-party providers to operate the Service. Each processes
              a subset of the information above solely on our behalf:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Supabase</strong> &mdash; database, authentication, and file storage</li>
              <li><strong>Paynow</strong> &mdash; payment processing for tickets and stand bookings</li>
              <li><strong>Google Firebase</strong> &mdash; push notifications and, optionally, Google Sign-In</li>
              <li><strong>Apple</strong> &mdash; Sign in with Apple, where used</li>
            </ul>
            <p className="mt-2">
              We do not sell personal information to third parties, and we do not share it for
              third-party advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Data Retention</h2>
            <p className="mt-1">
              We retain account and transaction information for as long as your account is active
              and as needed to comply with our legal and financial record-keeping obligations.
              Location data collected on-site is retained only as long as needed for the heatmap
              feature and is not linked to your identity in aggregate reporting.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Your Rights</h2>
            <p className="mt-1">
              You may request access to, correction of, or deletion of your personal information,
              and you may withdraw location-tracking consent at any time, by contacting us using the
              details below. We will respond to verified requests within a reasonable time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Children&rsquo;s Privacy</h2>
            <p className="mt-1">
              The Service is intended for general audiences attending or exhibiting at the{" "}
              {APP_CONFIG.eventFullName} and is not directed at children under 13. We do not
              knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Security</h2>
            <p className="mt-1">
              We use industry-standard technical and organisational measures, including encrypted
              transport (HTTPS/TLS) and access-controlled data storage, to protect the information
              you provide. No method of transmission or storage is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Changes to This Policy</h2>
            <p className="mt-1">
              We may update this Privacy Policy from time to time. Material changes will be reflected
              by updating the &ldquo;Last updated&rdquo; date above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
            <p className="mt-1">
              If you have questions about this Privacy Policy or wish to exercise your data rights,
              contact us at{" "}
              <a href="mailto:privacy@arcus.co.zw" className="underline underline-offset-2">
                privacy@arcus.co.zw
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
