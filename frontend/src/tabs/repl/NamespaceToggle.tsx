interface NamespaceToggleProps {
  namespace: string;
  mode: string;
  onNamespaceChange: (namespace: string) => void;
  onModeChange: (mode: string) => void;
}

const namespaces = [
  { value: 'repl', label: 'REPL', hint: 'Wikipedia corpus:science, history, tech, culture' },
  { value: 'newsroom', label: 'Newsroom', hint: 'Acme Cloud evaluation:5 competing sources' },
  { value: 'agent', label: 'Agent', hint: 'Coder agent:auth refactor episodic memories' },
  { value: 'auditor', label: 'Auditor', hint: 'Pharma trial:25 claims, 5 sources' },
];

const modes = [
  { value: 'general', label: 'General', hint: 'Standard retrieval with scoring' },
  { value: 'belief_system', label: 'Belief System', hint: 'Source credibility + conflict detection' },
  { value: 'agent_memory', label: 'Agent Memory', hint: 'Episodic, semantic, procedural memory types' },
  { value: 'procedural', label: 'Procedural', hint: 'Step-by-step workflow knowledge' },
];

export function NamespaceToggle({
  namespace,
  mode,
  onNamespaceChange,
  onModeChange,
}: NamespaceToggleProps) {
  const nsHint = namespaces.find(n => n.value === namespace)?.hint;
  const modeHint = modes.find(m => m.value === mode)?.hint;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Namespace:</label>
        <select
          value={namespace}
          onChange={(e) => onNamespaceChange(e.target.value)}
          title={nsHint}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {namespaces.map((ns) => (
            <option key={ns.value} value={ns.value}>
              {ns.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Mode:</label>
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value)}
          title={modeHint}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {modes.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <span className="text-[10px] text-gray-600 hidden lg:inline max-w-[250px] truncate" title={nsHint}>
        {nsHint}
      </span>
    </div>
  );
}
