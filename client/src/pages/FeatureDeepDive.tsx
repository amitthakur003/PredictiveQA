import { useEffect, useState } from "react";
import { FileSearch, CheckCircle, XCircle, Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Use localhost:4000 directly to avoid env issues during dev
const SERVER = 'http://localhost:4000';

export default function FeatureDeepDive() {
  const [selectedFeature, setSelectedFeature] = useState("All Features");
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [allTestCases, setAllTestCases] = useState<any[]>([]);
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuilds = async () => {
      try {
        const res = await fetch(`${SERVER}/api/builds/recent?limit=1`);
        const builds = await res.json();

        if (!builds || builds.length === 0) {
          setLoading(false);
          return;
        }

        const latestBuild = builds[0];
        const tests: any[] = [];
        const feats: Set<string> = new Set();

        // --- CRITICAL FIX: Mapping the exact JSON structure ---
        // structure: build -> modules -> features -> test_cases
        if (latestBuild.modules) {
          latestBuild.modules.forEach((mod: any) => {
            if (mod.features) {
              mod.features.forEach((feat: any) => {
                const featName = feat.feature_name || "Unknown Feature";
                feats.add(featName);

                if (feat.test_cases) {
                  feat.test_cases.forEach((tc: any) => {
                    tests.push({
                      id: tc.tc_id,
                      name: tc.title,
                      feature: featName,
                      module: mod.module_name,
                      status: tc.status, // "Passed" or "Failed"
                      priority: tc.bug_info?.severity || 'P3',
                      script: tc.script_content,
                      errorMessage: tc.bug_info?.error_log,
                      aiExplanation: tc.ai_suggestion // The AI field from DB
                    });
                  });
                }
              });
            }
          });
        }

        setAllTestCases(tests);
        setFeaturesList(Array.from(feats));
      } catch (error) {
        console.error("Failed to load builds:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBuilds();
  }, []);

  const filteredTests = selectedFeature === "All Features"
    ? allTestCases
    : allTestCases.filter(tc => tc.feature === selectedFeature);

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
            <h2 className="text-2xl font-bold tracking-tight">Feature Deep Dive</h2>
            <p className="text-muted-foreground">Detailed test case analysis</p>
          </div>
          <Select value={selectedFeature} onValueChange={setSelectedFeature}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select Feature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Features">All Features</SelectItem>
              {featuresList.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800">
            <CardContent className="p-4 flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {filteredTests.filter(t => t.status === "Passed").length}
                </p>
                <p className="text-sm text-green-600/80 dark:text-green-400/80">Passed Tests</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800">
            <CardContent className="p-4 flex items-center gap-4">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-3xl font-bold text-red-700 dark:text-red-400">
                  {filteredTests.filter(t => t.status === "Failed").length}
                </p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">Failed Tests (AI Analyzed)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tests List */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-blue-500" />
              Test Cases ({filteredTests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTests.map((test) => {
                const isFailed = test.status === 'Failed';
                const isExpanded = expandedTest === test.id;

                return (
                  <div key={test.id} className={cn("transition-colors hover:bg-muted/50", isExpanded && "bg-muted/30")}>
                    {/* Row Header */}
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer"
                      onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                    >
                      {isFailed ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{test.id}</span>
                          {isFailed && <Badge variant="destructive" className="h-5 text-[10px] px-1.5">Failed</Badge>}
                        </div>
                        <p className="text-sm font-medium truncate">{test.name}</p>
                        <p className="text-xs text-muted-foreground">{test.feature} • {test.module}</p>
                      </div>

                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-6 pl-14 space-y-4 animate-in slide-in-from-top-2 duration-200">

                        {/* Script Box */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Test Script</p>
                          <div className="bg-slate-950 text-slate-50 rounded-md p-3 font-mono text-xs overflow-x-auto shadow-sm">
                            <pre>{test.script}</pre>
                          </div>
                        </div>

                        {/* Error Box (Only if failed) */}
                        {test.errorMessage && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-red-600/80 uppercase tracking-wider">Error Log</p>
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 font-mono text-xs text-red-700 dark:text-red-400">
                              {test.errorMessage}
                            </div>
                          </div>
                        )}

                        {/* AI Box (Only if failed & analyzed) */}
                        {test.aiExplanation ? (
                          <div className="relative overflow-hidden rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/10">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400">
                              <Sparkles className="h-4 w-4" />
                              <h4 className="text-sm font-bold">AI Root Cause Analysis</h4>
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {test.aiExplanation}
                            </div>
                          </div>
                        ) : !isFailed && (
                          <div className="flex items-center gap-2 text-xs text-green-600/80 italic">
                            <CheckCircle className="h-3 w-3" />
                            Execution successful. No AI diagnostics needed.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}