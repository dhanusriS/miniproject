import { useState, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import { 
  Send, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Zap, 
  ShieldCheck, 
  MousePointer2,
  Sparkles,
  ArrowRight,
  Trash2,
  Layers,
  Globe,
  Loader2,
  Cpu,
  History,
  BarChart3,
  Twitter,
  MessageCircle,
  Repeat2,
  Heart,
  Share,
  MoreHorizontal
} from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_URL = '/api';

// Sub-component for individual results with toxic hide logic
const SentimentItem = ({ item, getSentimentConfig }) => {
  const [showToxic, setShowToxic] = useState(false);
  const isHidden = item.hidden; // Use the hidden flag from backend

  if (isHidden && !showToxic) {
    return (
      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between group shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3 text-slate-500 italic text-sm font-medium">
          <ShieldCheck size={18} className="text-rose-500" />
          <span>{item.message || "This tweet was hidden for toxicity."}</span>
        </div>
        <button 
          onClick={() => setShowToxic(true)}
          className="text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 px-4 py-2 rounded-full hover:bg-slate-300 transition-colors"
        >
          View Anyway
        </button>
      </div>
    );
  }

  // Generate random stats for realism
  const [stats] = useState({
    replies: Math.floor(Math.random() * 50) + 1,
    reposts: Math.floor(Math.random() * 20),
    likes: Math.floor(Math.random() * 500) + 5,
    views: Math.floor(Math.random() * 5000) + 100,
    time: Math.floor(Math.random() * 23) + 1
  });

  return (
    <div className="relative p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors animate-in slide-in-from-bottom-2">
      {/* Sentiment Badge */}
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase text-white shadow-sm ${getSentimentConfig(item.sentiment).badge}`}>
          {item.sentiment}
        </span>
        <button className="text-slate-400 hover:text-[#1DA1F2] transition-colors"><MoreHorizontal size={18} /></button>
      </div>

      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center">
            <Twitter className="w-6 h-6 text-[#1DA1F2]" fill="currentColor" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-16">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
            <span className="font-bold text-slate-900 truncate hover:underline cursor-pointer">
              {item.username.replace('@', '')}
            </span>
            <div className="flex items-center gap-1 text-slate-500 text-sm">
              <span className="truncate">@{item.username.replace('@', '')}</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">{stats.time}h</span>
            </div>
          </div>
          
          <p className="text-[15px] text-slate-900 leading-snug mb-3">
            {item.text}
          </p>

          {/* Interaction Bar */}
          <div className="flex items-center justify-between text-slate-500 max-w-md pr-2">
            <button className="flex items-center gap-2 hover:text-[#1DA1F2] group transition-colors">
              <div className="p-2 -ml-2 rounded-full group-hover:bg-[#1DA1F2]/10">
                <MessageCircle size={18} />
              </div>
              <span className="text-xs font-medium">{stats.replies}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-emerald-500 group transition-colors">
              <div className="p-2 -ml-2 rounded-full group-hover:bg-emerald-500/10">
                <Repeat2 size={18} />
              </div>
              <span className="text-xs font-medium">{stats.reposts > 0 ? stats.reposts : ''}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-rose-500 group transition-colors">
              <div className="p-2 -ml-2 rounded-full group-hover:bg-rose-500/10">
                <Heart size={18} />
              </div>
              <span className="text-xs font-medium">{stats.likes}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-[#1DA1F2] group transition-colors hidden sm:flex">
              <div className="p-2 -ml-2 rounded-full group-hover:bg-[#1DA1F2]/10">
                <BarChart3 size={18} />
              </div>
              <span className="text-xs font-medium">{stats.views}</span>
            </button>
            <button className="flex items-center hover:text-[#1DA1F2] group transition-colors hidden sm:flex">
              <div className="p-2 -ml-2 rounded-full group-hover:bg-[#1DA1F2]/10">
                <Share size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function AppContent() {
  const location = useLocation();
  const [text, setText] = useState("");
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState(null);
  const [liveResults, setLiveResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [toxicAnalytics, setToxicAnalytics] = useState(null);
  const [toxicLoading, setToxicLoading] = useState(false);

  // Memoize active tab to prevent re-renders
  const activeTab = useMemo(() => {
    if (location.pathname === '/manual') return 'manual';
    if (location.pathname === '/live') return 'live';
    if (location.pathname === '/analytics') return 'analytics';
    return 'manual';
  }, [location.pathname]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("sentimentHistory");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const addToHistory = (item) => {
    const newHistory = [item, ...history].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("sentimentHistory", JSON.stringify(newHistory));
  };

  const analyzeManual = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await axios.post(`${API_URL}/analyze`, { text });
      setResult(data);
      addToHistory({ text: text.substring(0, 50), sentiment: data.sentiment, date: new Date().toLocaleTimeString() });
    } catch (err) {
      setError("Backend engine offline.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeLive = async () => {
    setLiveLoading(true);
    setLiveResults([]);
    setStats(null);
    try {
      const { data } = await axios.get(`${API_URL}/analyze-live`, {
        params: { keyword: keyword || 'Brand' }
      });
      setLiveResults(data.results);
      setStats(data.stats);
    } catch (err) {
      setError("Twitter fetch failed.");
    } finally {
      setLiveLoading(false);
    }
  };

  const analyzeToxicContent = async () => {
    setToxicLoading(true);
    setToxicAnalytics(null);
    try {
      const { data } = await axios.get(`${API_URL}/toxic-analytics`, {
        params: { keyword: keyword || 'Brand' }
      });
      setToxicAnalytics(data);
    } catch (err) {
      setError("Toxic analytics fetch failed.");
    } finally {
      setToxicLoading(false);
    }
  };

  const getSentimentConfig = (sentiment) => {
    switch (sentiment) {
      case "positive": return { emoji: "🔥", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-500" };
      case "negative": return { emoji: "😡", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-500" };
      case "neutral": return { emoji: "😐", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-400" };
      default: return { emoji: "❓", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-300" };
    }
  };

  // Memoize Toxic Analytics data to prevent re-renders
  const toxicAnalyticsData = useMemo(() => {
    if (!toxicAnalytics || !toxicAnalytics.insights) return null;
    
    const categories = toxicAnalytics.insights.top_toxicity_categories || {};
    const categoryEntries = Object.entries(categories);
    const categoryKeys = Object.keys(categories);
    const categoryValues = Object.values(categories);
    
    return {
      categories,
      categoryEntries,
      categoryKeys,
      categoryValues,
      severityBreakdown: toxicAnalytics.insights.severity_breakdown || {},
      recommendations: toxicAnalytics.insights.recommendations || [],
      toxicContent: toxicAnalytics.toxic_content || []
    };
  }, [toxicAnalytics]);

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-slate-200/60 h-20 px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <Link to="/" className="font-black text-xl text-slate-900 uppercase tracking-tighter">Brand<span className="text-blue-700">Guard</span></Link>
          </div>
          <button className="hidden md:block text-[11px] font-black uppercase tracking-widest text-blue-600 px-4 py-2 border border-blue-100 rounded-lg">System Live v2.5</button>
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-48 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-[11px] font-black uppercase mb-10">
          <Sparkles className="w-4 h-4 fill-blue-600" />
          Elite Brand Sentiment Protection
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.95] mb-10">
          Protect Your <br /> <span className="bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent italic">Brand Integrity</span>.
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium mb-16 opacity-90">
          Real-time sentiment monitoring and toxicity filtering for Twitter and direct customer feedback.
        </p>
      </header>

      {/* Analyzer centerpiece */}
      <main className="max-w-5xl mx-auto px-6 pb-40">
        <div className="bg-white p-6 md:p-12 rounded-[48px] shadow-2xl border border-slate-100 relative">
          <div className="flex flex-col gap-10">
            
            {/* Tab Navigation */}
            <div className="flex gap-2 p-2 bg-slate-100 rounded-2xl">
              <Link
                to="/manual"
                className={`flex-1 py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all text-center ${activeTab === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Manual Analysis
              </Link>
              <Link
                to="/live"
                className={`flex-1 py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all text-center ${activeTab === 'live' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Live Twitter Scan
              </Link>
              <Link
                to="/analytics"
                className={`flex-1 py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all text-center ${activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Toxic Analytics
              </Link>
            </div>

            {/* Routes for different pages */}
            <Routes>
              <Route path="/manual" element={
                <>
                  <div className="relative">
                    <textarea
                      className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-[32px] p-8 text-xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-500/30 focus:bg-white transition-all resize-none shadow-inner"
                      placeholder="Analyze manual feedback..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={analyzeManual}
                    disabled={loading || !text.trim()}
                    className="w-full py-6 bg-gradient-to-r from-blue-700 to-cyan-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-4 shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <><Send size={24} /> Run Analysis</>}
                  </button>

                  {result && (
                    <div className={`mt-6 p-10 rounded-[40px] border-4 animate-in zoom-in-95 ${getSentimentConfig(result.sentiment).border} ${getSentimentConfig(result.sentiment).bg}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                          <span className="text-8xl">{getSentimentConfig(result.sentiment).emoji}</span>
                          <div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Analysis Result</span>
                            <h3 className={`text-6xl font-black uppercase tracking-tighter ${getSentimentConfig(result.sentiment).color}`}>{result.sentiment}</h3>
                            {result.toxicity_level && (
                              <div className="mt-2 text-sm font-bold text-slate-500">
                                Toxicity Level: {result.toxicity_level} ({(result.toxicity * 100).toFixed(0)}%)
                              </div>
                            )}
                            {result.toxicity_categories && result.toxicity_categories.length > 0 && (
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                {result.toxicity_categories.map((cat, i) => (
                                  <span key={i} className="px-2 py-1 bg-white/50 rounded text-[10px] font-bold uppercase text-slate-700">
                                    {cat.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Confidence</span>
                          <p className="text-3xl font-black text-slate-900">{(result.confidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              } />

              <Route path="/live" element={
                <>
                  <div className="flex flex-col gap-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Twitter Brand Keyword</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Apple, Nike, Tesla..." 
                      className="w-full px-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-bold focus:outline-none focus:border-blue-500/30"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={analyzeLive}
                    disabled={liveLoading}
                    className="w-full py-6 bg-gradient-to-r from-blue-700 to-cyan-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-4 shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {liveLoading ? <Loader2 className="animate-spin" size={24} /> : <><Globe size={24} /> Live Twitter Scan</>}
                  </button>

                {/* Stats Breakdown with Charts Dashboard */}
                {stats && (
                  <div className="mt-6 p-8 bg-slate-900 rounded-[32px] text-white animate-in zoom-in-95">
                    <div className="flex items-center gap-3 mb-6">
                      <BarChart3 className="text-blue-400" />
                      <h4 className="text-lg font-black uppercase tracking-tighter">Sentiment Dashboard</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      {/* Pie Chart */}
                      <div className="h-64 flex justify-center">
                        <Pie 
                          data={{
                            labels: ['Positive', 'Negative', 'Neutral'],
                            datasets: [{
                              data: [stats.positive, stats.negative, stats.neutral],
                              backgroundColor: ['#10b981', '#ef4444', '#64748b'],
                              borderWidth: 0,
                            }]
                          }}
                          options={{
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false }
                            }
                          }}
                        />
                      </div>

                      {/* Legend/List */}
                      <div className="space-y-4">
                        {[
                          { label: 'Positive', count: stats.positive, color: 'bg-emerald-500', text: 'text-emerald-400' },
                          { label: 'Negative', count: stats.negative, color: 'bg-rose-500', text: 'text-rose-400' },
                          { label: 'Neutral', count: stats.neutral, color: 'bg-slate-500', text: 'text-slate-400' }
                        ].map((item) => {
                          const total = stats.positive + stats.negative + stats.neutral || 1;
                          const percentage = ((item.count / total) * 100).toFixed(0);
                          
                          return (
                            <div key={item.label} className="space-y-1">
                              <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                <span className={item.text}>{item.label}</span>
                                <span className="opacity-60">{item.count} ({percentage}%)</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color}`} style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Toxicity Stats */}
                    {stats.toxicity_stats && (
                      <div className="mt-8 pt-8 border-t border-white/10">
                        <h5 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-4">Toxicity Levels</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(stats.toxicity_stats).map(([level, count]) => (
                            <div key={level} className="text-center">
                              <div className="text-2xl font-black text-white">{count}</div>
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{level}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Results List with Toxic Filter */}
                {liveResults.length > 0 && (
                  <div className="mt-10 space-y-4">
                    <div className="flex items-center justify-between border-b pb-4 mb-8">
                      <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900">Live Feed Scan Results</h4>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <ShieldCheck size={14} className="text-emerald-500" /> Toxicity Filter Active
                      </div>
                    </div>
                    {liveResults.slice(0, 20).map((item, i) => (
                      <SentimentItem key={i} item={item} getSentimentConfig={getSentimentConfig} />
                    ))}
                  </div>
                )}
                </>
              } />

              <Route path="/analytics" element={
                <>
                  <div className="flex flex-col gap-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Company/Brand Keyword</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Apple, Nike, Tesla..." 
                      className="w-full px-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-bold focus:outline-none focus:border-blue-500/30"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={analyzeToxicContent}
                    disabled={toxicLoading}
                    className="w-full py-6 bg-gradient-to-r from-rose-600 to-orange-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-4 shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {toxicLoading ? <Loader2 className="animate-spin" size={24} /> : <><ShieldCheck size={24} /> Generate Toxic Analytics</>}
                  </button>

                  {/* Toxic Analytics Dashboard - Following Live Twitter Scan Architecture */}
                  {toxicAnalyticsData && (
                    <div className="mt-6 space-y-6 animate-in zoom-in-95">
                      {/* Stats Breakdown with Charts Dashboard */}
                      <div className="p-8 bg-slate-900 rounded-[32px] text-white animate-in zoom-in-95">
                        <div className="flex items-center gap-3 mb-6">
                          <ShieldCheck className="text-rose-400" />
                          <h4 className="text-lg font-black uppercase tracking-tighter">Toxic Analytics Dashboard</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                          {/* Pie Chart */}
                          <div className="h-64 flex justify-center">
                            <Pie 
                              data={{
                                labels: toxicAnalyticsData.categoryKeys.map(k => k.replace(/_/g, ' ')),
                                datasets: [{
                                  data: toxicAnalyticsData.categoryValues,
                                  backgroundColor: ['#ef4444', '#f97316', '#eab308', '#10b981', '#6366f1'],
                                  borderWidth: 0,
                                }]
                              }}
                              options={{
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { display: false }
                                }
                              }}
                            />
                          </div>

                          {/* Legend/List */}
                          <div className="space-y-4">
                            {toxicAnalyticsData.categoryEntries.map(([category, count]) => {
                              const total = toxicAnalyticsData.categoryValues.reduce((a, b) => a + b, 0) || 1;
                              const percentage = ((count / total) * 100).toFixed(0);
                              const categoryIndex = toxicAnalyticsData.categoryKeys.indexOf(category);
                              const colors = [
                                { bg: 'bg-rose-500', text: 'text-rose-400' },
                                { bg: 'bg-orange-500', text: 'text-orange-400' },
                                { bg: 'bg-yellow-500', text: 'text-yellow-400' },
                                { bg: 'bg-emerald-500', text: 'text-emerald-400' },
                                { bg: 'bg-indigo-500', text: 'text-indigo-400' }
                              ];
                              const color = colors[categoryIndex % colors.length];
                              
                              return (
                                <div key={category} className="space-y-1">
                                  <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                    <span className={color.text}>{category.replace(/_/g, ' ')}</span>
                                    <span className="opacity-60">{count} ({percentage}%)</span>
                                  </div>
                                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full ${color.bg}`} style={{ width: `${percentage}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Severity Stats */}
                        {Object.keys(toxicAnalyticsData.severityBreakdown).length > 0 && (
                        <div className="mt-8 pt-8 border-t border-white/10">
                          <h5 className="text-sm font-black uppercase tracking-widest text-rose-400 mb-4">Severity Levels</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(toxicAnalyticsData.severityBreakdown).map(([level, count]) => (
                              <div key={level} className="text-center">
                                <div className="text-2xl font-black text-white">{count}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{level}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Toxic Content Results List */}
                    {toxicAnalyticsData.toxicContent.length > 0 && (
                      <div className="mt-10 space-y-4">
                        <div className="flex items-center justify-between border-b pb-4 mb-8">
                          <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900">Toxic Content Results</h4>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <ShieldCheck size={14} className="text-rose-500" /> {toxicAnalyticsData.toxicContent.length} Toxic Comments Found
                          </div>
                        </div>
                        {toxicAnalyticsData.toxicContent.slice(0, 20).map((item, i) => (
                          <SentimentItem key={`${item.text}-${i}`} item={item} getSentimentConfig={getSentimentConfig} />
                        ))}
                      </div>
                    )}

                    {/* Actionable Recommendations */}
                    {toxicAnalyticsData.recommendations.length > 0 && (
                      <div className="p-8 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="flex items-center gap-3 mb-6">
                          <Zap className="text-blue-600" />
                          <h4 className="text-lg font-black uppercase tracking-tighter text-blue-900">Actionable Recommendations</h4>
                        </div>
                        <div className="space-y-4">
                          {toxicAnalyticsData.recommendations.map((rec, i) => {
                            const priorityColors = {
                              CRITICAL: 'bg-rose-500',
                              HIGH: 'bg-orange-500',
                              MEDIUM: 'bg-yellow-500',
                              LOW: 'bg-emerald-500'
                            };
                            
                            return (
                              <div key={`${rec.category}-${i}`} className="p-4 bg-white rounded-xl border border-blue-100">
                                <div className="flex items-start gap-4">
                                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white ${priorityColors[rec.priority]}`}>
                                    {rec.priority}
                                  </span>
                                  <div className="flex-1">
                                    <div className="font-bold text-slate-900 mb-1">{rec.category} ({rec.count} cases)</div>
                                    <div className="text-sm text-slate-600">{rec.action}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </>
              } />
              
              <Route path="/" element={<Navigate to="/manual" replace />} />
            </Routes>

            {error && <div className="p-6 bg-rose-50 text-rose-600 rounded-3xl font-bold border border-rose-100">{error}</div>}

            {/* History Section */}
            {history.length > 0 && (
              <div className="mt-10 pt-10 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <History className="text-slate-400" />
                  <h4 className="text-lg font-black uppercase tracking-tighter text-slate-400">Analysis History</h4>
                </div>
                <div className="space-y-3">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-sm font-bold text-slate-600 truncate max-w-[60%]">"{h.text}..."</p>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white ${getSentimentConfig(h.sentiment).badge}`}>
                          {h.sentiment}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{h.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-24 px-6 text-center border-t border-slate-200">
        <div className="flex justify-center items-center gap-2 mb-8 opacity-30 grayscale">
          <Activity />
          <span className="font-black tracking-[0.4em] uppercase">Brand Sentiment Guard</span>
        </div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">© 2026 Brand Protection Systems Ltd.</p>
      </footer>

    </div>
  );
}

// Default export wrapping AppContent in BrowserRouter
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
