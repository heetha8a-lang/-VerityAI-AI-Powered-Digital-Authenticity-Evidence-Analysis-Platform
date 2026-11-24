"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SegmentedTabs } from "@/components/ui/tabs";
import { ActivityPoint } from "@/types/investigation";

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const [chartView, setChartView] = React.useState<"stacked" | "total">("stacked");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-indigo-600" />
            Images
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-sky-500" />
            News &amp; URLs
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-violet-500" />
            Documents
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-slate-400" />
            Text Claims
          </span>
        </div>

        <SegmentedTabs
          value={chartView}
          onChange={setChartView}
          options={[
            { value: "stacked", label: "By Modality" },
            { value: "total", label: "Total Volume" },
          ]}
        />
      </div>

      <div className="h-64 w-full min-w-0">
        {!mounted ? (
          <div className="h-full w-full rounded-lg bg-slate-100/70 dark:bg-slate-800/40 animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartView === "stacked" ? (
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(148, 163, 184, 0.2)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    border: "1px solid #1E293B",
                    borderRadius: "8px",
                    color: "#F8FAFC",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="images" name="Images" stackId="a" fill="#4F46E5" radius={[0, 0, 0, 0]} />
                <Bar dataKey="news" name="News & URLs" stackId="a" fill="#0EA5E9" />
                <Bar dataKey="documents" name="Documents" stackId="a" fill="#8B5CF6" />
                <Bar dataKey="text" name="Text Claims" stackId="a" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart
                data={data}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="verityVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(148, 163, 184, 0.2)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    border: "1px solid #1E293B",
                    borderRadius: "8px",
                    color: "#F8FAFC",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Investigations"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  fill="url(#verityVolumeGrad)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
