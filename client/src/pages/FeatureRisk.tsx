import { useEffect, useState } from "react";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const SERVER = 'http://localhost:4000';

const riskColors: any = {
  high: "#ef4444",   // Red
  medium: "#f59e0b", // Amber
  low: "#22c55e",    // Green
};

export default function FeatureRisk() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/api/builds/risk-analysis`);
      if (!res.ok) throw new Error("Failed to fetch risk analysis");
      const result = await res.json();

      // Ensure we have an array
      setData(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  // Format data for Recharts
  const chartData = data.map(f => ({
    name: f.feature,
    score: f.riskScore,
    level: f.riskLevel,
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Feature Risk Dashboard</h2>
            <p className="text-muted-foreground">AI-Driven Risk Scoring & Retest Recommendations</p>
          </div>
          <Button onClick={fetchRiskData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Recalculate
          </Button>
        </div>

        {/* Risk Score Chart */}
        <Card className="animate-fade-in shadow-sm">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Risk Score Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={180}
                      tick={{ fontSize: 13, fill: '#374151' }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={riskColors[entry.level]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available. Please upload a build.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Data Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg">Detailed Risk Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Feature</th>
                    <th className="px-6 py-4 text-center">Risk Score</th>
                    <th className="px-6 py-4 text-center">Trend</th>
                    <th className="px-6 py-4 text-center">Open Bugs</th>
                    <th className="px-6 py-4 text-center">P1 / P2 / P3</th>
                    <th className="px-6 py-4 text-center">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((feature: any) => (
                    <tr key={feature.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{feature.feature}</td>

                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className={cn(
                          "font-bold",
                          feature.riskLevel === 'high' ? 'border-red-200 text-red-600 bg-red-50' :
                            feature.riskLevel === 'medium' ? 'border-amber-200 text-amber-600 bg-amber-50' :
                              'border-green-200 text-green-600 bg-green-50'
                        )}>
                          {feature.riskScore}%
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {feature.trend === 'up' ? <TrendingUp className="mx-auto text-red-500 h-4 w-4" /> :
                          feature.trend === 'down' ? <TrendingDown className="mx-auto text-green-500 h-4 w-4" /> :
                            <Minus className="mx-auto text-gray-400 h-4 w-4" />}
                      </td>

                      <td className="px-6 py-4 text-center font-mono">
                        {feature.openBugs}
                      </td>

                      <td className="px-6 py-4 text-center text-xs text-muted-foreground">
                        <span className="text-red-600 font-semibold">{feature.p1Bugs}</span> /
                        <span className="text-amber-600 font-semibold"> {feature.p2Bugs}</span> /
                        <span> {feature.p3Bugs}</span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <Badge className={cn(
                          feature.retestRecommendation === 'Full Retest' ? 'bg-red-600 hover:bg-red-700' :
                            feature.retestRecommendation === 'Partial Retest' ? 'bg-amber-500 hover:bg-amber-600' :
                              'bg-slate-500 hover:bg-slate-600'
                        )}>
                          {feature.retestRecommendation}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length === 0 && !loading && (
                <div className="p-8 text-center text-muted-foreground">
                  No risk data found. Ensure builds are uploaded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}