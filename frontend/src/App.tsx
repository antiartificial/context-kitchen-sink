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

export default function App() {
  const [tab, setTab] = useState<Tab>("Newsroom");

  return (
    <AuthGate>
      <Layout>
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
