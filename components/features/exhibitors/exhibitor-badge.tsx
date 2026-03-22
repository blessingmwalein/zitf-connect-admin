"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Printer, Download } from "lucide-react";
import { getCategoryName } from "@/lib/constants/categories";

interface ExhibitorBadgeProps {
  exhibitor: {
    id: string;
    company_name: string;
    contact_person: string;
    contact_email: string;
    logo_url: string | null;
    category_id: number | null;
    industry: string | null;
    country: string | null;
    booth_size: string | null;
    status: string;
  };
  stands?: { stand_number: string; halls?: { name: string } | null }[];
}

export function ExhibitorBadge({ exhibitor, stands = [] }: ExhibitorBadgeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const badgeRef = useRef<HTMLDivElement>(null);

  const initials = exhibitor.company_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const categoryName = exhibitor.category_id
    ? getCategoryName(exhibitor.category_id)
    : exhibitor.industry ?? null;

  useEffect(() => {
    const qrContent = JSON.stringify({
      type: "exhibitor",
      id: exhibitor.id,
      company: exhibitor.company_name,
      contact: exhibitor.contact_person,
      email: exhibitor.contact_email,
    });

    QRCode.toDataURL(qrContent, {
      width: 200,
      margin: 1,
      color: { dark: "#1A1A1A", light: "#FFFFFF" },
    }).then(setQrDataUrl);
  }, [exhibitor]);

  function handlePrint() {
    window.print();
  }

  async function handleDownload() {
    if (!badgeRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(badgeRef.current, {
        scale: 2,
        backgroundColor: "#FFFFFF",
      });
      const link = document.createElement("a");
      link.download = `badge-${exhibitor.company_name.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // html2canvas not available, fall back to print
      handlePrint();
    }
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center gap-3 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="gap-1.5">
          <Printer className="size-4" />
          Print Badge
        </Button>
        <Button onClick={handleDownload} variant="outline" className="gap-1.5">
          <Download className="size-4" />
          Download PNG
        </Button>
      </div>

      {/* Badge Card */}
      <div className="flex justify-center">
        <div ref={badgeRef}>
          <Card className="w-[400px] rounded-2xl border-2 bg-white shadow-lg print:shadow-none">
            <CardContent className="p-6 space-y-4">
              {/* Header with ZITF branding */}
              <div className="text-center space-y-1">
                <h1 className="text-lg font-bold text-[#F69825] tracking-tight">
                  ZIMBABWE INTERNATIONAL TRADE FAIR
                </h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest">
                  Exhibitor Badge
                </p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-[#F69825] to-transparent" />

              {/* Company Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-xl border">
                  {exhibitor.logo_url && (
                    <AvatarImage src={exhibitor.logo_url} alt={exhibitor.company_name} />
                  )}
                  <AvatarFallback className="rounded-xl text-lg bg-[#F69825]/10 text-[#F69825]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">
                    {exhibitor.company_name}
                  </h2>
                  <p className="text-sm text-gray-600">{exhibitor.contact_person}</p>
                  {categoryName && (
                    <Badge className="mt-1 bg-[#F69825]/10 text-[#F69825] text-xs hover:bg-[#F69825]/20">
                      {categoryName}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {exhibitor.country && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Country</p>
                    <p className="font-medium text-gray-700">{exhibitor.country}</p>
                  </div>
                )}
                {exhibitor.booth_size && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Booth Size</p>
                    <p className="font-medium text-gray-700">{exhibitor.booth_size}</p>
                  </div>
                )}
                {stands.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 uppercase">Stand(s)</p>
                    <p className="font-medium text-gray-700">
                      {stands.map((s) => `${s.stand_number}${s.halls ? ` (${s.halls.name})` : ""}`).join(", ")}
                    </p>
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-200" />

              {/* QR Code */}
              <div className="flex flex-col items-center gap-2">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="h-32 w-32"
                  />
                )}
                <p className="text-xs text-gray-400">Scan for exhibitor details</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
