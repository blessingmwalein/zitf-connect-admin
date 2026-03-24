import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getExhibitorById, getExhibitorLeads } from "@/services/exhibitor.service";
import { EXHIBITOR_STATUS_CONFIG, type ExhibitorStatus } from "@/lib/constants";
import { getCategoryName } from "@/lib/constants/categories";
import {
  Mail,
  Phone,
  Globe,
  Building2,
  MapPin,
  Tag,
  FileText,
  Pencil,
  CreditCard,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExhibitorDeleteButton } from "./exhibitor-delete-button";
import { ExhibitorActions } from "@/components/features/exhibitors/exhibitor-actions";

interface ExhibitorViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExhibitorViewPage({
  params,
}: ExhibitorViewPageProps) {
  const { id } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let exhibitor: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let leads: any[] = [];

  try {
    const result = await getExhibitorById(id);
    if (result?.data) exhibitor = result.data;
  } catch {
    // query failed
  }

  if (!exhibitor) notFound();

  try {
    const leadsResult = await getExhibitorLeads(id);
    if (leadsResult?.data) leads = leadsResult.data;
  } catch {
    // leads query failed
  }

  const statusConfig = EXHIBITOR_STATUS_CONFIG[exhibitor.status as ExhibitorStatus];
  const initials = exhibitor.company_name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const categoryName = exhibitor.category_id
    ? getCategoryName(exhibitor.category_id)
    : exhibitor.industry ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stands = (exhibitor.stands as any[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={exhibitor.company_name}
        description="Exhibitor details"
      >
        <div className="flex items-center gap-2">
          <ExhibitorActions
            exhibitorId={id}
            currentStatus={exhibitor.status}
            contactEmail={exhibitor.contact_email}
            hasAuthAccount={!!exhibitor.auth_user_id}
          />
          <Link href={`/exhibitors/${id}/badge`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <CreditCard className="size-4" />
              Badge & QR
            </Button>
          </Link>
          <Link href={`/exhibitors/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="size-4" />
              Edit
            </Button>
          </Link>
          <ExhibitorDeleteButton exhibitorId={id} />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Company Header Card */}
          <Card className="rounded-2xl border bg-card shadow-ios">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 rounded-2xl">
                  {exhibitor.logo_url && (
                    <AvatarImage src={exhibitor.logo_url} alt={exhibitor.company_name} />
                  )}
                  <AvatarFallback className="rounded-2xl text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-title-2">{exhibitor.company_name}</h2>
                    <Badge className={cn("text-caption-2", statusConfig.color)}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  {categoryName && (
                    <div className="flex items-center gap-1.5 text-footnote text-muted-foreground">
                      <Tag className="size-3.5" />
                      {categoryName}
                    </div>
                  )}
                  {exhibitor.country && (
                    <div className="flex items-center gap-1.5 text-footnote text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {exhibitor.country}
                    </div>
                  )}
                </div>
              </div>

              {exhibitor.description && (
                <>
                  <Separator className="my-4" />
                  <p className="text-subheadline text-muted-foreground whitespace-pre-wrap">
                    {exhibitor.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="rounded-2xl border bg-card shadow-ios">
            <CardHeader>
              <CardTitle className="text-headline">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Users className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-subheadline font-medium">{exhibitor.contact_person}</p>
                  <p className="text-caption-1 text-muted-foreground">Contact Person</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="size-4 text-primary" />
                </div>
                <div>
                  <a href={`mailto:${exhibitor.contact_email}`} className="text-subheadline font-medium text-primary hover:underline">
                    {exhibitor.contact_email}
                  </a>
                  <p className="text-caption-1 text-muted-foreground">Email</p>
                </div>
              </div>

              {exhibitor.contact_phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="size-4 text-primary" />
                  </div>
                  <div>
                    <a href={`tel:${exhibitor.contact_phone}`} className="text-subheadline font-medium">
                      {exhibitor.contact_phone}
                    </a>
                    <p className="text-caption-1 text-muted-foreground">Phone</p>
                  </div>
                </div>
              )}

              {exhibitor.website && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Globe className="size-4 text-primary" />
                  </div>
                  <div>
                    <a href={exhibitor.website} target="_blank" rel="noopener noreferrer" className="text-subheadline font-medium text-primary hover:underline">
                      {exhibitor.website}
                    </a>
                    <p className="text-caption-1 text-muted-foreground">Website</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {exhibitor.notes && (
            <Card className="rounded-2xl border bg-card shadow-ios">
              <CardHeader>
                <CardTitle className="text-headline">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <FileText className="size-4 mt-0.5 text-muted-foreground" />
                  <p className="text-subheadline text-muted-foreground whitespace-pre-wrap">
                    {exhibitor.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stands & Hall Assignment */}
          <Card className="rounded-2xl border bg-card shadow-ios">
            <CardHeader>
              <CardTitle className="text-headline">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {exhibitor.halls && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-blue/10">
                    <Building2 className="size-4 text-ios-blue" />
                  </div>
                  <div>
                    <p className="text-subheadline font-medium">{exhibitor.halls.name}</p>
                    <p className="text-caption-1 text-muted-foreground">Assigned Hall</p>
                  </div>
                </div>
              )}

              {stands.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-caption-1 font-medium text-muted-foreground">Stands ({stands.length})</p>
                  {stands.map((stand: { id: string; stand_number: string; halls?: { name: string } }) => (
                    <Link
                      key={stand.id}
                      href={`/stands/${stand.id}`}
                      className="flex items-center gap-2 rounded-xl p-2 hover:bg-accent transition-colors"
                    >
                      <MapPin className="size-3.5 text-ios-green" />
                      <span className="text-footnote font-medium">
                        {stand.stand_number}
                      </span>
                      {stand.halls && (
                        <span className="text-caption-2 text-muted-foreground">
                          ({stand.halls.name})
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-footnote text-muted-foreground">No stands assigned</p>
              )}

              {exhibitor.booth_size && (
                <div className="pt-2">
                  <p className="text-caption-1 text-muted-foreground">Booth Size: {exhibitor.booth_size}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leads Summary */}
          <Card className="rounded-2xl border bg-card shadow-ios">
            <CardHeader>
              <CardTitle className="text-headline">Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {leads.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-title-3 font-bold">{leads.length}</p>
                  <p className="text-caption-1 text-muted-foreground">
                    Total leads captured
                  </p>
                  <div className="mt-3 space-y-1">
                    {leads.slice(0, 5).map((lead: { captured_at: string; source: string; visitors?: { full_name: string } }, i: number) => (
                      <div key={i} className="flex items-center justify-between text-footnote">
                        <span className="text-muted-foreground">
                          {lead.visitors?.full_name ?? "Unknown"}
                        </span>
                        <Badge variant="secondary" className="text-caption-2">
                          {lead.source}
                        </Badge>
                      </div>
                    ))}
                    {leads.length > 5 && (
                      <p className="text-caption-1 text-muted-foreground pt-1">
                        +{leads.length - 5} more leads
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-footnote text-muted-foreground">
                  No leads captured yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
