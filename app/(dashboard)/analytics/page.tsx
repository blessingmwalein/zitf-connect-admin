"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { Button } from "@/components/ui/button";
import { downloadCSV } from "@/lib/exports/csv";
import {
  getLeadsPerExhibitor,
  getEventParticipation,
  getDailyEngagement,
} from "@/services/analytics.service";

export default function AnalyticsPage() {
  const [leadsData, setLeadsData] = useState<{ name: string; leads: number }[]>([]);
  const [visitorData, setVisitorData] = useState<{ day: string; visitors: number }[]>([]);
  const [eventsData, setEventsData] = useState<{ name: string; fill: number }[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [leadsRes, eventsRes, engagementRes] = await Promise.all([
          getLeadsPerExhibitor(),
          getEventParticipation(),
          getDailyEngagement(),
        ]) as [any, any, any];

        if (leadsRes.data) {
          setLeadsData(
            leadsRes.data.map((d: any) => ({
              name: d.company_name,
              leads: d.total_leads,
            }))
          );
        }
        if (eventsRes.data) {
          setEventsData(
            eventsRes.data.map((d: any) => ({
              name: d.event_name,
              fill: d.fill_rate_pct ?? 0,
            }))
          );
        }
        if (engagementRes.data) {
          setVisitorData(
            engagementRes.data.map((d: any) => ({
              day: d.day,
              visitors: d.unique_visitors,
            }))
          );
        }
      } catch {
        // Failed to load analytics
      }
    }
    loadData();
  }, []);

  function handleExport() {
    const combined = leadsData.map((item) => ({
      exhibitor: item.name,
      leads: item.leads,
    }));
    downloadCSV(combined, "zitf-analytics-export");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reporting"
        description="Insights and performance metrics for the current edition"
      >
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Leads per Exhibitor — vertical bar chart */}
        <ChartCard
          title="Leads per Exhibitor"
          description="Top exhibitors by lead count"
        >
          <div className="h-[280px] w-full">
            {leadsData.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-footnote text-muted-foreground">No lead data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={leadsData}
                  margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                      fontSize: 13,
                    }}
                  />
                  <Bar
                    dataKey="leads"
                    fill="hsl(var(--primary))"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        {/* Visitor Engagement — line chart */}
        <ChartCard
          title="Visitor Engagement"
          description="Daily unique visitors"
        >
          <div className="h-[280px] w-full">
            {visitorData.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-footnote text-muted-foreground">No engagement data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={visitorData}
                  margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                      fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        {/* Event Participation — horizontal bar chart */}
        <ChartCard
          title="Event Participation"
          description="Seat fill rate per event (%)"
        >
          <div className="h-[280px] w-full">
            {eventsData.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-footnote text-muted-foreground">No event data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={eventsData}
                  layout="vertical"
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                      fontSize: 13,
                    }}
                    formatter={(value) => [`${value}%`, "Fill rate"]}
                  />
                  <Bar
                    dataKey="fill"
                    fill="hsl(var(--primary))"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
