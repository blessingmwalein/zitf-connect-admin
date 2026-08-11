import { APP_CONFIG } from "@/lib/app-config";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-title-1 text-foreground">{APP_CONFIG.platformName}</h1>
          <p className="mt-1 text-subheadline text-muted-foreground">
            Administration Portal
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
