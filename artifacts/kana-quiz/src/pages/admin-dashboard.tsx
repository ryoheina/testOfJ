import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Download, Search, Trash2, LogOut } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { getAuthToken, clearAuthToken } from "@/lib/auth";
import { useGetResults, useGetAdminStats, useDeleteResult, useExportResultsCsv } from "@workspace/api-client-react";
import { getGetResultsQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");
  
  // Guard
  useEffect(() => {
    if (!getAuthToken()) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const { data: stats, isLoading: statsLoading } = useGetAdminStats({
    query: {
      enabled: !!getAuthToken(),
      queryKey: getGetAdminStatsQueryKey()
    }
  });

  const { data: results, isLoading: resultsLoading } = useGetResults(
    { 
      search: search || undefined, 
      mode: modeFilter !== "all" ? modeFilter : undefined 
    },
    {
      query: {
        enabled: !!getAuthToken(),
        queryKey: getGetResultsQueryKey({ search: search || undefined, mode: modeFilter !== "all" ? modeFilter : undefined })
      }
    }
  );

  const deleteMutation = useDeleteResult();
  
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this result?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetResultsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      toast.success("Result deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  const { refetch: exportCsv } = useExportResultsCsv({
    query: {
      enabled: false,
    }
  });

  const handleExport = async () => {
    try {
      const { data } = await exportCsv();
      if (data) {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kana-results-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
      }
    } catch (e) {
      toast.error("Failed to export CSV");
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setLocation("/admin");
  };

  if (!getAuthToken()) return null;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Overview of student performance.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalQuizzes || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Avg Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{statsLoading ? <Skeleton className="h-8 w-16" /> : `${Math.round(stats?.averageScore || 0)}%`}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Highest Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{statsLoading ? <Skeleton className="h-8 w-16" /> : `${stats?.highestScore || 0}%`}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Missed Kana */}
        {!statsLoading && stats && stats.mostMissedKana.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Most Missed Kana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {stats.mostMissedKana.map((item, i) => (
                  <div key={i} className="flex flex-col items-center bg-muted/50 rounded-lg p-3 min-w-[80px]">
                    <span className="text-2xl font-serif">{item.kana}</span>
                    <span className="text-xs text-muted-foreground mt-1">{item.count} misses</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="hiragana">Hiragana</SelectItem>
                  <SelectItem value="katakana">Katakana</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead className="text-right">Accuracy</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : results?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No submissions found.</TableCell>
                    </TableRow>
                  ) : (
                    results?.map((res) => (
                      <TableRow key={res.id}>
                        <TableCell className="whitespace-nowrap">{format(new Date(res.submittedAt), 'MMM d, h:mm a')}</TableCell>
                        <TableCell className="font-medium">{res.name}</TableCell>
                        <TableCell className="capitalize">{res.mode}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {res.quizMode?.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${res.accuracy >= 90 ? 'text-green-500' : res.accuracy < 60 ? 'text-destructive' : ''}`}>
                            {res.accuracy}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{res.timeTaken}s</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(res.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
