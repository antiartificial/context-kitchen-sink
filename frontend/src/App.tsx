import { useState } from "react";
import AuthGate from "./components/AuthGate";
import Layout from "./components/Layout";
import TabBar from "./components/TabBar";
import NewsroomTab from "./tabs/newsroom/NewsroomTab";
import AgentTab from "./tabs/agent/AgentTab";
import AuditorTab from "./tabs/auditor/AuditorTab";
import ReplTab from "./tabs/repl/ReplTab";

const tabs = ["Newsroom", "Agent Memory", "Auditor", "DSL REPL"] as const;
type Tab = (typeof tabs)[number];

const TAB_ICONS: Record<string, string> = {
  Newsroom: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
  "Agent Memory": "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  Auditor: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  "DSL REPL": "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
};

const CAPABILITIES: { title: string; subtitle: string; icon: string }[] = [
  { title: "Know what, when",       subtitle: "Temporal awareness with time-travel queries",   icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { title: "Who said it",           subtitle: "Source tracking and credibility scoring",       icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { title: "What conflicts",        subtitle: "Automatic contradiction detection",             icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  { title: "How we got here",       subtitle: "Full provenance and evidence chains",           icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { title: "How reliable",          subtitle: "Calibrated confidence you can audit",           icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { title: "What's missing",        subtitle: "Knowledge gap and blind spot detection",        icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { title: "Right to forget",       subtitle: "GDPR-compliant erasure built in",               icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" },
  { title: "What to learn next",    subtitle: "Prioritized investigation suggestions",         icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("Newsroom");
  const [showCaps, setShowCaps] = useState(true);

  return (
    <AuthGate>
      <Layout showCapabilities={showCaps} onToggleCapabilities={() => setShowCaps((s) => !s)}>
        {/* Hero capabilities */}
        {showCaps && (
          <div className="mb-6 bg-gray-900 border border-gray-800 rounded-lg px-4 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CAPABILITIES.map((cap) => (
                <div key={cap.title} className="text-center flex flex-col items-center">
                  <svg className="w-5 h-5 text-indigo-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={cap.icon} />
                  </svg>
                  <div className="text-sm font-semibold text-gray-100">{cap.title}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{cap.subtitle}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <TabBar tabs={tabs} active={tab} onChange={setTab} icons={TAB_ICONS} />
        <div className="mt-6">
          {tab === "Newsroom" && <NewsroomTab />}
          {tab === "Agent Memory" && <AgentTab />}
          {tab === "Auditor" && <AuditorTab />}
          {tab === "DSL REPL" && <ReplTab />}
        </div>
      </Layout>
    </AuthGate>
  );
}
