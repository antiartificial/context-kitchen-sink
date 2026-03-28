interface NamespaceToggleProps {
  namespace: string;
  mode: string;
  onNamespaceChange: (namespace: string) => void;
  onModeChange: (mode: string) => void;
}

export function NamespaceToggle({
  namespace,
  mode,
  onNamespaceChange,
  onModeChange,
}: NamespaceToggleProps) {
  const namespaces = [
    { value: 'repl', label: 'REPL' },
    { value: 'newsroom', label: 'Newsroom' },
    { value: 'agent', label: 'Agent' },
    { value: 'auditor', label: 'Auditor' },
  ];

  const modes = [
    { value: 'general', label: 'General' },
    { value: 'belief_system', label: 'Belief System' },
    { value: 'agent_memory', label: 'Agent Memory' },
    { value: 'procedural', label: 'Procedural' },
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Namespace:</label>
        <select
          value={namespace}
          onChange={(e) => onNamespaceChange(e.target.value)}
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
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {modes.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
