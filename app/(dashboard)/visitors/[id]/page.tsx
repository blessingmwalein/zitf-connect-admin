import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  getVisitorById,
  getVisitorLeads,
  getVisitorEventAttendance,
} from "@/services/visitor.service";
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  Briefcase,
  CreditCard,
  Pencil,
  Calendar,
} from "lucide-react";
import { VisitorDeleteButton } from "./visitor-delete-button";

interface VisitorViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function VisitorViewPage({
  params,
}: VisitorViewPageProps) {
  const { id } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let visitor: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let leads: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let attendance: any[] = [];

  try {
    const result = await getVisitorById(id);
    if (result?.data) visitor = result.data;
  } catch {
    // query failed
  }

  if (!visitor) notFound();

  try {
    const [leadsResult, attendanceResult] = await Promise.all([
      getVisitorLeads(id),
      getVisitorEventAttendance(id),
    ]);
    if (leadsResult?.data) leads = leadsResult.data;
    if (attendanceResult?.data) attendance = attendanceResult.data;
  } catch {
    // queries failed
  }

  const initials = visitor.full_name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title={visitor.full_name}
        description="Visitor details"
      >
        <div className="flex items-center gap-2">
          <Link href={`/visitors/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="size-4" />
              Edit
            </Button>
          </Link>
          <VisitorDeleteButton visitorId={id} />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Visitor Header Card */}
          <Card className="rounded-2xl border bg-card shadow-ios">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 rounded-2xl">
                  <AvatarFallback className="rounded-2xl text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <h2 className="text-title-2">{visitor.full_name}</h2>
                  {visitor.job_title && (
                    <div className="flex items-center gap-1.5 text-footnote text-muted-foreground">
                      <Briefcase className="size-3.5" />
                      {visitor.job_title}
                    </div>
                  )}
                  {visitor.company && (
                    <div className="flex items-center gap-1.5 text-footnote text-muted-foreground">
                      <Building2 className="size-3.5" />
                      {visitor.company}
                    </div>
                  )}
                  {visitor.country && (
                    <div className="flex items-center gap-1.5 text-footnote text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {visitor.country}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="rounded-2xl border bg-card shadow-ios">
            <CardHeader>
              <CardTitle className="text-headline">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {visitor.email && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="size-4 text-primary" />
                  </div>
                  <div>
                    <a
                      href={`mailto:${visitor.email}`}
                      className="text-subheadline font-medium text-primary hover:underline"
                    >
                      {visitor.email}
                    </a>
                    <p className="text-caption-1 text-muted-foreground">Email</p>
                  </div>
                </div>
              )}

              {visitor.phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="size-4 text-primary" />
                  </div>
                  <div>
                    <a
                      href={`tel:${visitor.phone}`}
                      className="text-subheadline font-medium"
                    >
                      {visitor.phone}
                    </a>
                    <p className="text-caption-1 text-muted-foreground">Phone</p>
                  </div>
                </div>
              )}

              {visitor.badge_id && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-blue/10">
                    <CreditCard className="size-4 text-ios-blue" />
                  </div>
                  <div>
                    <p className="text-subheadline font-medium">
                      {visitor.badge_id}
                    </p>
                    <p className="text-caption-1 text-muted-foreground">
                      Badge ID
                    </p>
                  </div>
                </div>
              )}

              {!visitor.email && !visitor.phone && !visitor.badge_id && (
                <p className="text-footnote text-muted-foreground">
                  No contact information available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Leads */}
          <Card className="rounded-2xl border bg-card shadow-ios">
            <CardHeader>
              <CardTitle className="text-headline">
                Exhibitor Leads ({leads.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leads.length > 0 ? (
                <div className="space-y-3">
                  {leads.map(
                    (
                      lead: {
                        captured_at: string;
                        source: string;
                        is_qualified: boolean;
                        exhibitors?: {
                          id: string;
                          company_name: string;
                        };
                      },
                      i: number,
                    ) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl p-2 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="size-4 text-muted-foreground" />
                          <div>
                            <p className="text-subheadline font-medium">
                              {lead.exhibitors?.company_name ?? "Unknown"}
                            </p>
                            <p className="text-caption-1 text-muted-foreground">
                              {new Date(lead.captured_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lead.is_qualified && (
                            <Badge className="bg-ios-green/15 text-ios-green text-caption-2">
                              Qualified
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-caption-2">
                            {lead.source}
                          </Badge>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-footnote text-muted-foreground">
                  No leads captured yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Info */}
          <Card className="rounded-2xl border bg-card shadow-ios">
            <CardHeader>
              <CardTitle className="text-headline">Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-green/10">
                  <Calendar className="size-4 text-ios-green" />
                </div>
                <div>
                  <p className="text-subheadline font-medium">
                    {new Date(visitor.registered_at).toLocaleDateString(
                      "en-ZW",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                  <p className="text-caption-1 text-muted-foreground">
                    Registered
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events Attended */}
          <Card className="rounded-2xl border bg-card shadow-ios">
            <CardHeader>
              <CardTitle className="text-headline">
                Events Attended ({attendance.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length > 0 ? (
                <div className="space-y-2">
                  {attendance.map(
                    (
                      att: {
                        checked_in_at: string;
                        events?: {
                          id: string;
                          name: string;
                          start_time: string;
                          halls?: { name: string };
                        };
                      },
                      i: number,
                    ) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-xl p-2 hover:bg-accent transition-colors"
                      >
                        <Calendar className="mt-0.5 size-3.5 text-ios-blue" />
                        <div>
                          <p className="text-footnote font-medium">
                            {att.events?.name ?? "Unknown Event"}
                          </p>
                          {att.events?.halls && (
                            <p className="text-caption-2 text-muted-foreground">
                              {att.events.halls.name}
                            </p>
                          )}
                          <p className="text-caption-2 text-muted-foreground">
                            Checked in{" "}
                            {new Date(att.checked_in_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-footnote text-muted-foreground">
                  No events attended yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
