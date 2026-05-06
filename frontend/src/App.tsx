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

const CAPABILITIES: { title: string; subtitle: string }[] = [
  { title: "Know what, when",       subtitle: "Temporal awareness with time-travel queries" },
  { title: "Who said it",           subtitle: "Source tracking and credibility scoring" },
  { title: "What conflicts",        subtitle: "Automatic contradiction detection" },
  { title: "How we got here",       subtitle: "Full provenance and evidence chains" },
  { title: "How reliable",          subtitle: "Calibrated confidence you can audit" },
  { title: "What's missing",        subtitle: "Knowledge gap and blind spot detection" },
  { title: "Right to forget",       subtitle: "GDPR-compliant erasure built in" },
  { title: "What to learn next",    subtitle: "Prioritized investigation suggestions" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("Newsroom");

  return (
    <AuthGate>
      <Layout>
        {/* Hero capabilities */}
        <div className="mb-6 bg-gray-900 border border-gray-800 rounded-lg px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CAPABILITIES.map((cap) => (
              <div key={cap.title} className="text-center">
                <div className="text-sm font-semibold text-gray-100">{cap.title}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{cap.subtitle}</div>
              </div>
            ))}
          </div>
        </div>

        <TabBar tabs={tabs} active={tab} onChange={setTab} />
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
