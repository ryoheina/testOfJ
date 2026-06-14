import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  setAuthTokenGetter,
  useGetAdminStats,
  useGetMissedKana,
  useGetScoreTrend,
  useListResults,
  useGetResult,
  useGetUserStats,
  useDeleteResult,
  useDeleteAllResults,
  getGetAdminStatsQueryKey,
  getGetMissedKanaQueryKey,
  getGetScoreTrendQueryKey,
  getListResultsQueryKey,
  getGetResultQueryKey,
  getGetUserStatsQueryKey,
} from "@workspace/api-client-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const SESSION_KEY = "kana_admin_token";

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input }),
      });
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, input);
        onUnlock();
      } else {
        setError(true);
        setInput("");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-3xl border border-border/50 p-10 w-full max-w-sm text-center"
      >
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-2xl font-black text-white mb-2">Admin Access</h1>
        <p className="text-muted-foreground text-sm mb-8">Enter the admin password to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Password"
            autoFocus
            className={`w-full px-4 py-3 rounded-xl border bg-transparent text-white text-center text-lg tracking-widest focus:outline-none transition-colors ${
              error ? "border-red-400 focus:border-red-400" : "border-border/50 focus:border-cyan-400"
            }`}
          />
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400 text-sm">
                Incorrect password. Try again.
              </motion.p>
            )}
          </AnimatePresence>
          <button
            type="submit"
            disabled={!input || loading}
            className="w-full py-3 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-semibold hover:bg-cyan-500/30 hover:border-cyan-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Checking…" : "Enter Dashboard"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

type FilterType = "hiragana" | "katakana" | "mixed" | "";
type TabType = "overview" | "users" | "history";

function Dashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [quizTypeFilter, setQuizTypeFilter] = useState<FilterType>("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabType>("overview");
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: stats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: missedKana } = useGetMissedKana({ limit: 10 }, { query: { queryKey: getGetMissedKanaQueryKey({ limit: 10 }) } });
  const { data: trend } = useGetScoreTrend({ days: 14 }, { query: { queryKey: getGetScoreTrendQueryKey({ days: 14 }) } });
  const { data: userStats } = useGetUserStats({ query: { queryKey: getGetUserStatsQueryKey() } });
  const { data: resultsPage, refetch: refetchResults } = useListResults(
    { quizType: quizTypeFilter || undefined, limit: 100, offset: 0 },
    { query: { queryKey: getListResultsQueryKey({ quizType: quizTypeFilter || undefined, limit: 100, offset: 0 }) } }
  );
  const { data: expandedResult } = useGetResult(expandedId!, {
    query: { enabled: !!expandedId, queryKey: getGetResultQueryKey(expandedId!) },
  });

  const deleteResult = useDeleteResult();
  const deleteAll = useDeleteAllResults();

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: getListResultsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetUserStatsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetMissedKanaQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetScoreTrendQueryKey() });
  };

  const handleDeleteOne = (id: number) => {
    setDeletingId(id);
    deleteResult.mutate({ id }, {
      onSuccess: () => { setDeletingId(null); if (expandedId === id) setExpandedId(null); invalidateAll(); },
      onError: () => setDeletingId(null),
    });
  };

  const handleDeleteAll = () => {
    deleteAll.mutate(undefined, {
      onSuccess: () => { setConfirmDeleteAll(false); setExpandedId(null); invalidateAll(); },
    });
  };

  const results = resultsPage?.results ?? [];
  const filteredResults = results.filter(r => {
    if (!search) return true;
    const name = (r.playerName ?? "").toLowerCase();
    return name.includes(search.toLowerCase()) || r.quizType.includes(search.toLowerCase()) || String(r.score).includes(search);
  });

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60); const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };
  const gradeColor = (pct: number) =>
    pct >= 90 ? "text-cyan-400" : pct >= 70 ? "text-purple-400" : pct >= 50 ? "text-yellow-400" : "text-red-400";

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card border border-border/50 rounded-xl px-3 py-2 text-sm">
          <div className="text-muted-foreground">{label}</div>
          <div className="text-cyan-400 font-bold">{Math.round(payload[0].value)}%</div>
        </div>
      );
    }
    return null;
  };

  const handleLogout = () => { sessionStorage.removeItem(SESSION_KEY); setAuthTokenGetter(null); window.location.reload(); };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "users", label: "Users", icon: "👤" },
    { id: "history", label: "History", icon: "📋" },
  ];

  return (
    <div className="min-h-screen px-4 py-8 relative z-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Quiz analytics and results</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setLocation("/")} className="px-5 py-2 rounded-xl glass-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm font-medium transition-colors cursor-pointer">
              Back to Quiz
            </button>
            <button onClick={handleLogout} className="px-5 py-2 rounded-xl glass-card border border-red-400/30 text-red-400 hover:border-red-400/60 text-sm font-medium transition-colors cursor-pointer">
              Lock
            </button>
          </div>
        </div>

        {/* Stats tiles */}
        {stats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Sessions", value: stats.totalSessions, color: "text-cyan-400" },
              { label: "Avg Accuracy", value: `${Math.round(stats.averagePercentage)}%`, color: "text-purple-400" },
              { label: "Best Score", value: `${stats.bestScore} pts`, color: "text-yellow-400" },
              { label: "Kana Answered", value: stats.totalKanaAnswered, color: "text-pink-400" },
            ].map(s => (
              <div key={s.label} className="glass-card rounded-2xl border border-border/50 p-5">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border/30">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all cursor-pointer ${
                tab === t.id
                  ? "text-cyan-400 border-b-2 border-cyan-400 -mb-px bg-cyan-400/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl border border-border/50 p-6">
              <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Score Trend (14 days)</h2>
              {trend && trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="averagePercentage" stroke="#00d4ff" strokeWidth={2} fill="url(#trendGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">No data yet — take a quiz first</div>
              )}
            </div>

            <div className="glass-card rounded-2xl border border-border/50 p-6">
              <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Most Missed Kana</h2>
              {missedKana && missedKana.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={missedKana.slice(0, 8)} layout="vertical">
                    <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="kana" type="category" tick={{ fill: "#e2e8f0", fontSize: 14 }} tickLine={false} axisLine={false} width={30} />
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload?.length) {
                        const d = payload[0].payload as { kana: string; romaji: string; missCount: number };
                        return (
                          <div className="glass-card border border-border/50 rounded-xl px-3 py-2 text-sm">
                            <div className="text-lg font-bold text-white">{d.kana} = {d.romaji}</div>
                            <div className="text-red-400">{d.missCount} misses</div>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Bar dataKey="missCount" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">No missed kana data yet</div>
              )}
            </div>
          </motion.div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl border border-border/50 p-6">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-6">Per-User Statistics</h2>
            {!userStats || userStats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No results yet. Take a quiz to see user stats.</div>
            ) : (
              <>
                {/* Header row */}
                <div className="hidden sm:grid grid-cols-5 gap-2 px-4 pb-3 text-xs uppercase tracking-widest text-muted-foreground border-b border-border/30 mb-2">
                  <div>Name</div>
                  <div className="text-center">Tests Taken</div>
                  <div className="text-center">Avg Accuracy</div>
                  <div className="text-center">Best Score</div>
                  <div className="text-center">Total Kana</div>
                </div>
                <div className="space-y-2">
                  {userStats.map((u, idx) => (
                    <motion.div
                      key={u.playerName}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center px-4 py-4 rounded-xl border border-border/30 glass-card"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5">#{idx + 1}</span>
                        <div>
                          <div className="font-bold text-white text-sm">{u.playerName}</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-xl font-black text-cyan-400">{u.totalTests}</span>
                        <div className="text-xs text-muted-foreground">tests</div>
                      </div>
                      <div className="text-center hidden sm:block">
                        <span className={`text-lg font-bold ${gradeColor(u.averagePercentage)}`}>{Math.round(u.averagePercentage)}%</span>
                        <div className="text-xs text-muted-foreground">accuracy</div>
                      </div>
                      <div className="text-center hidden sm:block">
                        <span className="text-lg font-bold text-yellow-400">{u.bestScore}</span>
                        <div className="text-xs text-muted-foreground">pts best</div>
                      </div>
                      <div className="text-center hidden sm:block">
                        <span className="text-lg font-bold text-pink-400">{u.totalQuestions}</span>
                        <div className="text-xs text-muted-foreground">kana answered</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl border border-border/50 p-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
              <div>
                <h2 className="text-sm uppercase tracking-widest text-muted-foreground">Quiz History</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="search"
                  placeholder="Search name, mode..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-border/50 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400 transition-colors w-44"
                />
                <select
                  value={quizTypeFilter}
                  onChange={e => setQuizTypeFilter(e.target.value as FilterType)}
                  className="px-3 py-1.5 rounded-xl border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="hiragana">Hiragana</option>
                  <option value="katakana">Katakana</option>
                  <option value="mixed">Mixed</option>
                </select>
                {results.length > 0 && (
                  <button
                    onClick={() => setConfirmDeleteAll(true)}
                    className="px-3 py-1.5 rounded-xl border border-red-400/40 text-red-400 text-sm hover:border-red-400/70 hover:bg-red-400/5 transition-colors cursor-pointer"
                  >
                    🗑 Delete All
                  </button>
                )}
              </div>
            </div>

            {/* Confirm delete all dialog */}
            <AnimatePresence>
              {confirmDeleteAll && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-4 rounded-xl border border-red-400/40 bg-red-400/5 flex items-center justify-between gap-4"
                >
                  <p className="text-sm text-red-300">Delete ALL {results.length} results? This cannot be undone.</p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setConfirmDeleteAll(false)} className="px-3 py-1 rounded-lg border border-border/50 text-muted-foreground text-xs hover:text-foreground transition-colors cursor-pointer">
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAll}
                      disabled={deleteAll.isPending}
                      className="px-3 py-1 rounded-lg bg-red-500/20 border border-red-400/60 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deleteAll.isPending ? "Deleting…" : "Yes, Delete All"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {filteredResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No results yet. Take a quiz to see history.</div>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-7 gap-2 px-4 pb-3 text-xs uppercase tracking-widest text-muted-foreground border-b border-border/30 mb-2">
                  <div>#</div>
                  <div>Player</div>
                  <div>Mode</div>
                  <div className="text-center font-bold">Points</div>
                  <div className="text-center">Accuracy</div>
                  <div className="text-center">Time</div>
                  <div className="text-center">Actions</div>
                </div>
                <div className="space-y-2">
                  {filteredResults.map((r, idx) => (
                    <div key={r.id}>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 items-center px-4 py-3 rounded-xl border border-border/30 hover:border-border/50 glass-card transition-all duration-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                          <span className={`text-base font-black ${gradeColor(r.percentage)}`}>{r.grade}</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white truncate">{r.playerName ?? <span className="text-muted-foreground italic text-xs">Anon</span>}</div>
                          <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="capitalize text-sm text-muted-foreground hidden sm:block">{r.quizType}</div>
                        <div className="text-center">
                          <span className="text-lg font-black text-white">{r.score}</span>
                          <span className="text-muted-foreground text-xs">/{r.totalQuestions}</span>
                        </div>
                        <div className="text-center hidden sm:block">
                          <span className={`text-sm font-semibold ${gradeColor(r.percentage)}`}>{Math.round(r.percentage)}%</span>
                        </div>
                        <div className="text-center text-sm text-muted-foreground hidden sm:block">{formatTime(r.timeTakenSeconds)}</div>
                        <div className="text-center flex gap-1 justify-center">
                          <button
                            onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                            className="px-2 py-1 rounded-lg border border-border/40 text-muted-foreground text-xs hover:text-foreground hover:border-border/70 transition-colors cursor-pointer"
                          >
                            {expandedId === r.id ? "▲" : "▼"}
                          </button>
                          <button
                            onClick={() => handleDeleteOne(r.id)}
                            disabled={deletingId === r.id}
                            className="px-2 py-1 rounded-lg border border-red-400/30 text-red-400 text-xs hover:border-red-400/60 hover:bg-red-400/5 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            {deletingId === r.id ? "…" : "🗑"}
                          </button>
                        </div>
                      </div>

                      {expandedId === r.id && expandedResult && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-1 px-5 py-4 rounded-xl glass-card border border-border/30"
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                            <div className="text-center"><div className="text-2xl font-black text-cyan-400">{expandedResult.score}</div><div className="text-xs text-muted-foreground">Points</div></div>
                            <div className="text-center"><div className="text-2xl font-black text-red-400">{expandedResult.totalQuestions - expandedResult.score}</div><div className="text-xs text-muted-foreground">Wrong</div></div>
                            <div className="text-center"><div className="text-2xl font-black text-purple-400">{Math.round(expandedResult.percentage)}%</div><div className="text-xs text-muted-foreground">Accuracy</div></div>
                            <div className="text-center"><div className="text-2xl font-black text-yellow-400">{formatTime(expandedResult.timeTakenSeconds)}</div><div className="text-xs text-muted-foreground">Time</div></div>
                            <div className="text-center"><div className={`text-2xl font-black ${gradeColor(expandedResult.percentage)}`}>{expandedResult.grade}</div><div className="text-xs text-muted-foreground">Grade</div></div>
                          </div>
                          {Array.isArray(expandedResult.answers) && expandedResult.answers.length > 0 && (
                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                              {(expandedResult.answers as Array<{ kana: string; romaji: string; userAnswer: string; correct: boolean }>).map((a, i) => (
                                <div key={i} title={`${a.kana} = ${a.romaji} | Typed: ${a.userAnswer}`}
                                  className={`text-center p-2 rounded-lg ${a.correct ? "bg-cyan-400/10 border border-cyan-400/20" : "bg-red-500/10 border border-red-400/20"}`}
                                >
                                  <div className={`text-xl font-bold ${a.correct ? "text-cyan-300" : "text-red-400"}`}>{a.kana}</div>
                                  <div className="text-xs text-muted-foreground">{a.romaji}</div>
                                  {!a.correct && <div className="text-xs text-red-300">"{a.userAnswer}"</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) { setAuthTokenGetter(() => stored); setUnlocked(true); }
  }, []);

  const handleUnlock = () => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) setAuthTokenGetter(() => stored);
    setUnlocked(true);
  };

  if (!unlocked) return <PasswordGate onUnlock={handleUnlock} />;
  return <Dashboard />;
}
