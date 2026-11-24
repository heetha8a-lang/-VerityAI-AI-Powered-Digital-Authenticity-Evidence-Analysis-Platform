"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Newspaper,
  Plus,
} from "lucide-react";
import { ActivityChart } from "@/components/ActivityChart";
import { AppShell } from "@/components/AppShell";
import { VerdictDisplay } from "@/components/VerdictDisplay";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInvestigations } from "@/lib/store";
import { formatShortDate } from "@/lib/utils";

export default function DashboardPage() {
  const { investigations, counts, activitySeries } = useInvestigations();
  const recent = investigations.slice(0, 6);

  return (
    <AppShell
      breadcrumb="Dashboard"
      action={
        <Link href="/news-intelligence">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            <span>New Verification</span>
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Verification Overview
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Monitor completed media, claim, and document investigations or
              launch a new analysis workflow.
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Baseline records labelled Sample Baseline (Mock) · Live submissions
            execute server-side analysis
          </p>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5 space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Investigations
              </p>
              <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white">
                {counts.total}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All modalities combined
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Images Analyzed
              </p>
              <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white">
                {counts.images}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual &amp; metadata forensics
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                News &amp; Claims Checked
              </p>
              <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white">
                {counts.news}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                URL &amp; text corroboration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Documents Analyzed
              </p>
              <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white">
                {counts.documents}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PDF extraction &amp; claim audit
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart + Quick Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <Card className="lg:col-span-8">
            <CardHeader>
              <CardTitle>Investigation Activity</CardTitle>
              <CardDescription>
                Verification volume across image, news, document, and claim
                workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityChart data={activitySeries} />
            </CardContent>
          </Card>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <Card className="flex-1 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Start a live verification session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href="/image-intelligence"
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        Analyze Image
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Upload photo or inspect EXIF
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                </Link>

                <Link
                  href="/news-intelligence"
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <Newspaper className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        Verify News or Claim
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Article URL or statement check
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                </Link>

                <Link
                  href="/document-intelligence"
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        Inspect PDF Document
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Extract text &amp; audit claims
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Investigations & Analysis Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Recent Investigations</CardTitle>
              <CardDescription>
                Latest analysis outcomes across your workspace
              </CardDescription>
            </div>
            <Link
              href="/history"
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
            >
              View All History
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap text-slate-900 dark:text-slate-100">
                      {item.id}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.submittedSummary}
                      </p>
                    </TableCell>
                    <TableCell className="capitalize text-xs whitespace-nowrap">
                      {item.type}
                    </TableCell>
                    <TableCell>
                      <VerdictDisplay
                        label={item.assessmentLabel}
                        category={item.assessmentCategory}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {item.dataOrigin}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-xs whitespace-nowrap">
                      {formatShortDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Link href={`/reports/${item.id}`}>
                        <Button variant="outline" size="sm">
                          Open Report
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
