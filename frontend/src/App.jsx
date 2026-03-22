import { useState } from "react";
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
  Cpu
} from "lucide-react";

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [liveResults, setLiveResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeManual = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await axios.post(`${API_URL}/analyze`, { text });
      setResult(data);
    } catch (err) {
      setError("Backend engine offline.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeLive = async () => {
    setLiveLoading(true);
    setLiveResults([]);
    try {
      const { data } = await axios.get(`${API_URL}/analyze-live`);
      setLiveResults(data);
    } catch (err) {
      setError("Twitter fetch failed.");
    } finally {
      setLiveLoading(false);
    }
  };

  const getSentimentConfig = (sentiment) => {
    switch (sentiment) {
      case "positive": return { emoji: "🔥", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
      case "negative": return { emoji: "😡", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
      case "toxic": return { emoji: "🚫", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
      default: return { emoji: "😐", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-slate-200/60 h-20 px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-xl text-slate-900 uppercase tracking-tighter">Brand<span className="text-blue-700">Guard</span></span>
          </div>
          <button className="hidden md:block text-[11px] font-black uppercase tracking-widest text-blue-600 px-4 py-2 border border-blue-100 rounded-lg">System Live v2.4</button>
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
        <div className="floating-element bg-white p-1 md:p-12 rounded-[48px] shadow-2xl border border-slate-100 relative">
          <div className="flex flex-col gap-10">
            
            {/* Input area */}
            <div className="relative">
              <textarea
                className="w-full h-64 bg-slate-50 border-2 border-slate-100 rounded-[32px] p-10 text-2xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-500/30 focus:bg-white transition-all resize-none shadow-inner"
                placeholder="Analyze manual feedback..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="absolute bottom-8 right-10 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {text.length} Characters
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={analyzeManual}
                disabled={loading || !text.trim()}
                className="flex-1 py-6 bg-gradient-to-r from-blue-700 to-cyan-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-4 shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={24} /> Run Analysis</>}
              </button>
              <button 
                onClick={analyzeLive}
                disabled={liveLoading}
                className="px-10 py-6 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-700 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
              >
                {liveLoading ? <Loader2 className="animate-spin" /> : <><Globe size={24} /> Live Twitter Scan</>}
              </button>
            </div>

            {/* Manual Result */}
            {result && (
              <div className={`mt-6 p-10 rounded-[40px] border-4 animate-in zoom-in-95 ${getSentimentConfig(result.sentiment).border} ${getSentimentConfig(result.sentiment).bg}`}>
                <div className="flex items-center gap-8">
                  <span className="text-8xl">{getSentimentConfig(result.sentiment).emoji}</span>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Analysis Result</span>
                    <h3 className={`text-6xl font-black uppercase tracking-tighter ${getSentimentConfig(result.sentiment).color}`}>{result.sentiment}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Live Results List */}
            {liveResults.length > 0 && (
              <div className="mt-10 space-y-4">
                <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900 border-b pb-4 mb-8">Live Feed Scan Results</h4>
                {liveResults.map((item, i) => (
                  <div key={i} className={`p-6 rounded-3xl border-2 flex items-center justify-between ${getSentimentConfig(item.sentiment).bg} ${getSentimentConfig(item.sentiment).border}`}>
                    <p className="text-lg font-bold text-slate-800 pr-10">"{item.text}"</p>
                    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase ${getSentimentConfig(item.sentiment).color} bg-white shadow-sm`}>
                      {item.sentiment}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {error && <div className="p-6 bg-rose-50 text-rose-600 rounded-3xl font-bold border border-rose-100">{error}</div>}
          </div>
        </div>
      </main>

      {/* System Pipeline */}
      <section className="py-32 px-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-[12px] font-black text-blue-600 uppercase tracking-[0.5em] mb-6">System Pipeline</h2>
          <div className="grid md:grid-cols-3 gap-12 mt-20">
            {[
              { icon: <Layers />, title: "Data Input", desc: "User enters text manually or fetches brand content via Twitter API." },
              { icon: <Cpu />, title: "Sentiment Processing", desc: "Express calls Python logic where the TF-IDF model processes the text vectors." },
              { icon: <CheckCircle2 />, title: "Result Output", desc: "Real-time classification returned as Pos, Neg, Neutral, or Toxic." },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center group">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 border border-slate-100 group-hover:border-blue-500 group-hover:shadow-xl transition-all">
                  <div className="text-blue-600">{step.icon}</div>
                </div>
                <h4 className="font-black text-xl mb-4 tracking-tighter uppercase">{step.title}</h4>
                <p className="text-slate-500 font-medium text-sm italic">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
