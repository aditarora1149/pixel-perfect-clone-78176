import { Link, useRouterState } from "@tanstack/react-router";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Filter, ListOrdered, Trophy, LineChart, Calculator, ShieldAlert,
  Newspaper, PieChart, IndianRupee, Wallet, Star, XCircle, Bell, Brain, GitBranch,
  Sparkles, Boxes, MessageSquare, Activity, BarChart3, TrendingUp, Layers,
} from "lucide-react";

const sections = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/analyst", icon: MessageSquare, label: "AI Analyst", badge: "AI" },
      { to: "/workflow", icon: Layers, label: "Workflow Map", badge: "★" },
      { to: "/scenario-lab", icon: Sparkles, label: "Scenario Lab", badge: "★" },
      { to: "/custom", icon: Filter, label: "Custom Analysis" },
      { to: "/compare", icon: BarChart3, label: "Compare" },
    ],
  },
  {
    label: "Funnel",
    items: [
      { to: "/screener", icon: Filter, label: "Screener · Top 100" },
      { to: "/top-50", icon: ListOrdered, label: "Top 50" },
      { to: "/top-20", icon: Trophy, label: "Top 20", badge: "★" },
    ],
  },
  {
    label: "Deep Analysis",
    items: [
      { to: "/fundamentals", icon: BarChart3, label: "Fundamentals" },
      { to: "/valuation", icon: Calculator, label: "Valuation" },
      { to: "/quant", icon: TrendingUp, label: "Quant Factors" },
      { to: "/technical", icon: LineChart, label: "Technical" },
      { to: "/qualitative", icon: Layers, label: "Qualitative" },
    ],
  },
  {
    label: "Machine Learning",
    items: [
      { to: "/ml/xgboost", icon: Brain, label: "XGBoost" },
      { to: "/ml/random-forest", icon: GitBranch, label: "Random Forest" },
      { to: "/ml/decision-tree", icon: GitBranch, label: "Decision Tree" },
    ],
  },
  {
    label: "Risk & Simulation",
    items: [
      { to: "/simulation/monte-carlo", icon: Sparkles, label: "Monte Carlo", badge: "★" },
      { to: "/risk-3d", icon: Boxes, label: "3D Risk Universe", badge: "3D" },
      { to: "/risk", icon: ShieldAlert, label: "Risk Dashboard" },
      { to: "/news", icon: Newspaper, label: "News & Sentiment" },
    ],
  },
  {
    label: "Portfolio",
    items: [
      { to: "/portfolio", icon: PieChart, label: "Allocation" },
      { to: "/strategy/10k", icon: IndianRupee, label: "₹10k / week" },
      { to: "/strategy/50k", icon: Wallet, label: "₹50k / week" },
      { to: "/sandbox", icon: Activity, label: "Weight Sandbox" },
    ],
  },
  {
    label: "Manage",
    items: [
      { to: "/watchlist", icon: Star, label: "Watchlist" },
      { to: "/rejected", icon: XCircle, label: "Rejected" },
      { to: "/alerts", icon: Bell, label: "Alerts" },
    ],
  },
];

export function SideNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar/60 backdrop-blur-md h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto py-4">
      {sections.map((sec) => (
        <div key={sec.label} className="px-3 mb-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-1.5 px-2">
            {sec.label}
          </div>
          {sec.items.map((it) => {
            const active = path === it.to;
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-foreground font-medium shadow-[inset_2px_0_0_var(--primary)]"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                <span className="flex-1 truncate">{it.label}</span>
                {"badge" in it && it.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                    {it.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}

export function TopBar() {
  const market = useAppStore((s) => s.market);
  const setMarket = useAppStore((s) => s.setMarket);
  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="h-full px-4 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-primary-foreground">
            Λ
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">ALPHADESK</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">Institutional Stock Engine</div>
          </div>
        </Link>

        <div className="ml-6 flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          {(["IN", "US"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMarket(m)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded transition-colors",
                market === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "IN" ? "🇮🇳 NSE/BSE" : "🇺🇸 NYSE/NASDAQ"}
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <div className="text-xs text-muted-foreground tabular ticker-live">
          Live data: Yahoo Finance · Free tier · {market === "IN" ? "INR" : "USD"}
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <div className="flex">
        <SideNav />
        <main className="flex-1 min-w-0 p-6">{children}</main>
      </div>
    </div>
  );
}
