import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  CheckCircle,
  Clock,
  Globe,
  Key,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
  XCircle,
  Zap,
  Users,
  Filter,
  FileText,
  Plus,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

// ─────────────── Types ───────────────
interface RequestLog {
  id: number;
  client_id: string;
  client_name?: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  client_ip: string;
  error_details?: string;
  created_at: string;
}

interface MonitorMetrics {
  total_requests_today: number;
  total_requests_week: number;
  success_rate: number;
  error_rate: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  rpm_current: number;
  rpm_peak: number;
  rate_limit_hits: number;
  top_endpoints: { endpoint: string; count: number }[];
  top_clients: { client_id: string; client_name: string; count: number }[];
  status_distribution: { status: string; count: number; pct: number }[];
  hourly_trend: { hour: string; requests: number; errors: number }[];
}

interface ApiClient {
  id: string;
  name: string;
  api_key?: string;
  rate_limit_per_min: number;
  daily_quota: number;
  status: 'ACTIVE' | 'SUSPENDED';
  requests_today?: number;
  created_at: string;
}

// ─────────────── Helpers ───────────────
const ADMIN_KEY = 'vbk_admin_2026';

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { 'X-Admin-Key': ADMIN_KEY, 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const statusColor = (code: number) => {
  if (code >= 500) return 'bg-rose-100 text-rose-700 border-rose-200';
  if (code >= 400) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
};

const methodColor = (method: string) => {
  if (method === 'POST') return 'bg-blue-100 text-blue-700';
  if (method === 'DELETE') return 'bg-rose-100 text-rose-700';
  if (method === 'PUT' || method === 'PATCH') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
};

const fmtTime = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`);
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' });
};

// ─────────────── Sub-Components ───────────────
function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl border p-5 flex items-start gap-4 bg-white shadow-sm`}>
      <div className={`rounded-lg p-2.5 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs text-slate-600 w-40 truncate">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%`, transition: 'width 0.5s' }} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-10 text-right">{value.toLocaleString()}</span>
    </div>
  );
}

// ─────────────── Main Component ───────────────
export function VBookingMonitorView() {
  const [metrics, setMetrics] = useState<MonitorMetrics | null>(null);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'clients'>('overview');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterEndpoint, setFilterEndpoint] = useState('');
  const [logPage, setLogPage] = useState(1);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', rate_limit_per_min: 60, daily_quota: 10000 });
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const PAGE_SIZE = 20;

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await apiFetch('/api/vbooking/admin/monitoring/metrics');
      setMetrics(data.metrics);
    } catch {
      // Use mock data if API not yet connected
      setMetrics({
        total_requests_today: 0, total_requests_week: 0,
        success_rate: 0, error_rate: 0,
        avg_latency_ms: 0, p95_latency_ms: 0,
        rpm_current: 0, rpm_peak: 0,
        rate_limit_hits: 0,
        top_endpoints: [], top_clients: [],
        status_distribution: [],
        hourly_trend: []
      });
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(logPage),
        limit: String(PAGE_SIZE),
        ...(filterStatus && { status_code: filterStatus }),
        ...(filterClient && { client_id: filterClient }),
        ...(filterEndpoint && { endpoint: filterEndpoint }),
      });
      const data = await apiFetch(`/api/vbooking/admin/monitoring/logs?${params}`);
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [logPage, filterStatus, filterClient, filterEndpoint]);

  const fetchClients = useCallback(async () => {
    try {
      const data = await apiFetch('/api/vbooking/admin/clients');
      setClients(data.clients || []);
    } catch {
      setClients([]);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchLogs();
    fetchClients();
  }, [fetchMetrics, fetchLogs, fetchClients]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchMetrics();
      if (activeTab === 'logs') fetchLogs();
    }, 15000);
    return () => clearInterval(timer);
  }, [autoRefresh, activeTab, fetchMetrics, fetchLogs]);

  const handleCreateClient = async () => {
    try {
      const data = await apiFetch('/api/vbooking/admin/clients', {
        method: 'POST',
        body: JSON.stringify(newClient),
      });
      setCreatedKey(data.client?.api_key || null);
      setShowKey(true);
      fetchClients();
      setNewClient({ name: '', rate_limit_per_min: 60, daily_quota: 10000 });
    } catch {
      alert('เกิดข้อผิดพลาดในการสร้าง Client');
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const maxEndpoint = Math.max(...(metrics?.top_endpoints.map(e => e.count) || [1]), 1);
  const maxClient = Math.max(...(metrics?.top_clients.map(c => c.count) || [1]), 1);

  return (
    <div className="min-h-screen bg-slate-50 p-1">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-black text-slate-900">vBooking Monitor</h1>
              <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">API v1</span>
            </div>
            <p className="text-xs text-slate-500">ติดตามและตรวจสอบ API Request ของระบบ vBooking ทั้งหมด</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${autoRefresh ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              <div className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {autoRefresh ? 'Live' : 'Paused'}
            </div>
            <button onClick={() => setAutoRefresh(v => !v)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 text-xs transition">
              {autoRefresh ? <Activity className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => { fetchMetrics(); if (activeTab === 'logs') fetchLogs(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Last updated: {lastRefreshed.toLocaleTimeString('th-TH')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
        {(['overview', 'logs', 'clients'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); if (tab === 'logs') fetchLogs(); if (tab === 'clients') fetchClients(); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-violet-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            {tab === 'overview' && <><TrendingUp className="h-3.5 w-3.5 inline mr-1.5" />Overview</>}
            {tab === 'logs' && <><FileText className="h-3.5 w-3.5 inline mr-1.5" />Request Logs</>}
            {tab === 'clients' && <><Key className="h-3.5 w-3.5 inline mr-1.5" />API Clients</>}
          </button>
        ))}
      </div>

      {/* ─────── TAB: Overview ─────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> กำลังโหลดข้อมูล...
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Globe} label="Total Requests Today" value={(metrics?.total_requests_today || 0).toLocaleString()} sub={`${(metrics?.total_requests_week || 0).toLocaleString()} this week`} color="bg-violet-100 text-violet-600" />
                <StatCard icon={Activity} label="Requests / Min (RPM)" value={metrics?.rpm_current || 0} sub={`Peak: ${metrics?.rpm_peak || 0} RPM`} color="bg-blue-100 text-blue-600" />
                <StatCard icon={CheckCircle} label="Success Rate" value={`${(metrics?.success_rate || 0).toFixed(1)}%`} sub={`Error: ${(metrics?.error_rate || 0).toFixed(1)}%`} color="bg-emerald-100 text-emerald-600" />
                <StatCard icon={Clock} label="Avg Response Time" value={fmtTime(metrics?.avg_latency_ms || 0)} sub={`P95: ${fmtTime(metrics?.p95_latency_ms || 0)}`} color="bg-amber-100 text-amber-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Distribution */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-violet-500" /> HTTP Status Distribution
                  </h3>
                  {metrics?.status_distribution?.length ? (
                    <div className="space-y-3">
                      {metrics.status_distribution.map(s => (
                        <div key={s.status} className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            s.status === '2xx' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            s.status === '4xx' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            'bg-rose-100 text-rose-700 border-rose-200'
                          }`}>{s.status}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${s.status === '2xx' ? 'bg-emerald-500' : s.status === '4xx' ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${s.pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-12 text-right">{s.count.toLocaleString()}</span>
                          <span className="text-xs text-slate-400 w-10 text-right">{s.pct.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-28 text-slate-300 text-xs gap-2">
                      <BarChart2 className="h-8 w-8" />
                      ยังไม่มีข้อมูล Request
                    </div>
                  )}

                  {/* Rate Limit Alert */}
                  {(metrics?.rate_limit_hits || 0) > 0 && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-rose-700">Rate Limit Exceeded</p>
                        <p className="text-[11px] text-rose-500">{metrics?.rate_limit_hits} ครั้งวันนี้ (HTTP 429)</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Top Endpoints */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" /> Top Endpoints
                  </h3>
                  {metrics?.top_endpoints?.length ? (
                    <div className="space-y-1">
                      {metrics.top_endpoints.map(e => (
                        <MiniBar key={e.endpoint} label={e.endpoint.replace('/api/vbooking', '')} value={e.count} max={maxEndpoint} color="bg-blue-500" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-28 text-slate-300 text-xs gap-2">
                      <Globe className="h-8 w-8" /> ยังไม่มีข้อมูล
                    </div>
                  )}
                </div>

                {/* Top Clients */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-500" /> Top API Clients
                  </h3>
                  {metrics?.top_clients?.length ? (
                    <div className="space-y-1">
                      {metrics.top_clients.map(c => (
                        <MiniBar key={c.client_id} label={c.client_name || c.client_id} value={c.count} max={maxClient} color="bg-emerald-500" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-28 text-slate-300 text-xs gap-2">
                      <Users className="h-8 w-8" /> ยังไม่มี Client
                    </div>
                  )}
                </div>
              </div>

              {/* Hourly Trend */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-500" /> Request Trend (24h)
                </h3>
                {metrics?.hourly_trend?.length ? (
                  <div className="flex items-end gap-1 h-32">
                    {metrics.hourly_trend.map(h => {
                      const maxReq = Math.max(...metrics.hourly_trend.map(x => x.requests), 1);
                      const reqPct = (h.requests / maxReq) * 100;
                      const errPct = h.requests > 0 ? (h.errors / h.requests) * 100 : 0;
                      return (
                        <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                          <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                            <div className="w-full rounded-t-sm bg-rose-400 opacity-80" style={{ height: `${errPct}%`, minHeight: errPct > 0 ? '2px' : '0' }} />
                            <div className="w-full rounded-t-sm bg-violet-500" style={{ height: `${reqPct - errPct}%`, minHeight: reqPct > 0 ? '2px' : '0' }} />
                          </div>
                          <span className="text-[9px] text-slate-400">{h.hour}</span>
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                            {h.hour}:00 — {h.requests} reqs, {h.errors} err
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-300 text-xs gap-2">
                    <TrendingUp className="h-8 w-8" /> ยังไม่มีข้อมูล Trend
                  </div>
                )}
                <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm bg-violet-500" /> Success</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm bg-rose-400" /> Error</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─────── TAB: Logs ─────── */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-40">
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Endpoint Filter</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={filterEndpoint}
                    onChange={e => { setFilterEndpoint(e.target.value); setLogPage(1); }}
                    placeholder="/technicians/search..."
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Status Code</label>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setLogPage(1); }} className="border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white">
                  <option value="">All Status</option>
                  <option value="200">200</option>
                  <option value="400">400</option>
                  <option value="401">401</option>
                  <option value="429">429</option>
                  <option value="500">500</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Client ID</label>
                <div className="relative">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input value={filterClient} onChange={e => { setFilterClient(e.target.value); setLogPage(1); }} placeholder="CLIENT_..." className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs w-36 focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
              </div>
              <button onClick={fetchLogs} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition">
                <Search className="h-3.5 w-3.5" /> ค้นหา
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-500" /> Request Logs
              </h3>
              {logsLoading && <RefreshCw className="h-3.5 w-3.5 text-violet-400 animate-spin" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Method</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Endpoint</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Latency</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-slate-200" />
                          {logsLoading ? 'กำลังโหลด...' : 'ยังไม่มี Log — ลองยิง API แล้ว Refresh'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${methodColor(log.method)}`}>{log.method}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-700 max-w-xs truncate" title={log.endpoint}>{log.endpoint}</td>
                        <td className="px-4 py-2.5 text-slate-600">{log.client_name || log.client_id || <span className="text-slate-300 italic">anonymous</span>}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${statusColor(log.status_code)}`}>{log.status_code}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`font-bold ${log.response_time_ms > 1000 ? 'text-rose-600' : log.response_time_ms > 500 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {fmtTime(log.response_time_ms)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-400">{log.client_ip}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logs.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Page {logPage}</span>
                <div className="flex gap-2">
                  <button disabled={logPage === 1} onClick={() => setLogPage(v => v - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-40 hover:bg-slate-50 transition">← Previous</button>
                  <button disabled={logs.length < PAGE_SIZE} onClick={() => setLogPage(v => v + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-40 hover:bg-slate-50 transition">Next →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────── TAB: API Clients ─────── */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {/* Create Client Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700">API Clients ({clients.length})</h3>
            <button onClick={() => setShowCreateClient(v => !v)} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition shadow-sm">
              <Plus className="h-3.5 w-3.5" /> สร้าง API Client ใหม่
            </button>
          </div>

          {/* Create Client Form */}
          {showCreateClient && (
            <div className="bg-white border border-violet-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Key className="h-4 w-4 text-violet-500" /> สร้าง API Client ใหม่</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">ชื่อระบบ Partner *</label>
                  <input value={newClient.name} onChange={e => setNewClient(v => ({ ...v, name: e.target.value }))} placeholder="LINE OA Chatbot" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Rate Limit (req/min)</label>
                  <input type="number" value={newClient.rate_limit_per_min} onChange={e => setNewClient(v => ({ ...v, rate_limit_per_min: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Daily Quota (req/day)</label>
                  <input type="number" value={newClient.daily_quota} onChange={e => setNewClient(v => ({ ...v, daily_quota: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleCreateClient} disabled={!newClient.name} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg disabled:opacity-40 transition">สร้าง Client & Generate API Key</button>
                <button onClick={() => setShowCreateClient(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition">ยกเลิก</button>
              </div>

              {/* Show Generated Key */}
              {createdKey && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs font-bold text-emerald-700">สร้าง API Key สำเร็จ! กรุณาบันทึก Key นี้ไว้ (จะแสดงเพียงครั้งเดียว)</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-lg px-3 py-2">
                    <code className="flex-1 text-xs font-mono text-slate-800 break-all">{showKey ? createdKey : '•'.repeat(createdKey.length)}</code>
                    <button onClick={() => setShowKey(v => !v)} className="text-slate-400 hover:text-slate-600">{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    <button onClick={() => copyKey(createdKey)} className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded transition ${copiedKey ? 'text-emerald-600' : 'text-violet-600 hover:text-violet-800'}`}>
                      <Copy className="h-3.5 w-3.5" />{copiedKey ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clients Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Client ID</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Rate Limit</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Daily Quota</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Requests Today</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Key className="h-8 w-8 text-slate-200" />
                          ยังไม่มี API Client — กดสร้างด้านบน
                        </div>
                      </td>
                    </tr>
                  ) : (
                    clients.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-violet-700 font-bold">{c.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{c.name}</td>
                        <td className="px-4 py-3 text-slate-600">{c.rate_limit_per_min} req/min</td>
                        <td className="px-4 py-3 text-slate-600">{c.daily_quota.toLocaleString()} req/day</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-20">
                              <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${Math.min(100, ((c.requests_today || 0) / c.daily_quota) * 100)}%` }} />
                            </div>
                            <span className="text-slate-600 font-bold">{(c.requests_today || 0).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                            {c.status === 'ACTIVE' ? <><CheckCircle className="h-2.5 w-2.5 inline mr-0.5" />ACTIVE</> : <><XCircle className="h-2.5 w-2.5 inline mr-0.5" />SUSPENDED</>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono">{fmtDate(c.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl text-xs">
            <Shield className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-violet-700 mb-1">วิธีใช้ API Key</p>
              <p className="text-violet-600">ใส่ <code className="bg-violet-100 px-1 rounded font-mono">X-API-Key: {'<your_key>'}</code> ใน HTTP Header ทุก Request ที่ยิงมายัง <code className="bg-violet-100 px-1 rounded font-mono">/api/vbooking/*</code></p>
              <p className="text-violet-500 mt-1">ตัวอย่าง: <code className="bg-white border border-violet-200 px-1 rounded font-mono">curl -H "X-API-Key: vbk_xxx" https://your-domain.com/api/vbooking/technicians/search?...</code></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
