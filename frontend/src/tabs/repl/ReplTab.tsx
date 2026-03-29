import { useState } from 'react';
import { QueryEditor, normalizeSingleLine } from './QueryEditor';
import { ResultsPanel } from './ResultsPanel';
import { ScoringFunnel } from './ScoringFunnel';
import { SyntaxHelp } from './SyntaxHelp';
import { NamespaceToggle } from './NamespaceToggle';
import { api } from '../../api';
import { ReplResult } from '../../types';

interface ExampleQuery {
  label: string;
  query: string;
  syntax: 'pipe' | 'cql';
  namespace: string;
  mode: string;
  description: string;
}

const EXAMPLES: ExampleQuery[] = [
  {
    label: "Science claims",
    query: 'search "quantum" | where confidence > 0.7 | weight similarity:high | top 5',
    syntax: "pipe",
    namespace: "repl",
    mode: "general",
    description: "Search seeded science content for quantum-related claims",
  },
  {
    label: "High-confidence tech",
    query: 'search "machine learning" | where confidence > 0.8 | top 10',
    syntax: "pipe",
    namespace: "repl",
    mode: "general",
    description: "Find tech claims above 80% confidence",
  },
  {
    label: "History with recency",
    query: 'search "Roman Empire" | weight recency:high, similarity:0.4 | top 5',
    syntax: "pipe",
    namespace: "repl",
    mode: "general",
    description: "History search boosting recently-added content",
  },
  {
    label: "Newsroom conflicts",
    query: 'search "interest rates" | where confidence > 0.5 | top 10',
    syntax: "pipe",
    namespace: "newsroom",
    mode: "belief_system",
    description: "Search newsroom for economic claims (may surface conflicts)",
  },
  {
    label: "Agent auth memories",
    query: 'search "auth" | weight recency:high | top 10',
    syntax: "pipe",
    namespace: "agent",
    mode: "agent_memory",
    description: "Find agent's episodic memories about the auth refactor",
  },
  {
    label: "CQL: culture filter",
    query: 'FIND "Shakespeare" WHERE confidence > 0.5 WEIGHT similarity=high LIMIT 5',
    syntax: "cql",
    namespace: "repl",
    mode: "general",
    description: "CQL syntax — search culture claims",
  },
  {
    label: "Auditor pharma data",
    query: 'search "drug efficacy" | weight confidence:high | top 10',
    syntax: "pipe",
    namespace: "auditor",
    mode: "belief_system",
    description: "Query the auditor's pharma trial dataset",
  },
  {
    label: "CQL: graph traversal",
    query: 'FIND "vaccine" FOLLOW supports DEPTH 2 LIMIT 10',
    syntax: "cql",
    namespace: "newsroom",
    mode: "belief_system",
    description: "CQL with graph edges — find supporting evidence chains",
  },
];

export default function ReplTab() {
  const [query, setQuery] = useState('');
  const [syntax, setSyntax] = useState<'pipe' | 'cql'>('pipe');
  const [namespace, setNamespace] = useState('repl');
  const [mode, setMode] = useState('general');
  const [result, setResult] = useState<ReplResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleExecute = async () => {
    if (!query.trim()) return;

    setIsExecuting(true);
    setParseError(null);

    try {
      const response = await api.post<ReplResult>('/repl/execute', {
        query: normalizeSingleLine(query),
        syntax,
        namespace,
        mode,
      });
      setResult(response);
    } catch (error: any) {
      setResult({
        query,
        syntax,
        ast: null,
        results: [],
        error: error.message || 'Execution failed',
        parse_time_us: 0,
        execute_time_us: 0,
        total_results: 0,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.post('/repl/reset', {});
      setQuery('');
      setResult(null);
      setParseError(null);
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  const loadExample = (ex: ExampleQuery) => {
    setQuery(ex.query);
    setSyntax(ex.syntax);
    setNamespace(ex.namespace);
    setMode(ex.mode);
    setResult(null);
  };

  return (
    <div className="flex flex-col bg-black text-white" style={{ minHeight: 'calc(100vh - 180px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">REPL</h2>
          <NamespaceToggle
            namespace={namespace}
            mode={mode}
            onNamespaceChange={setNamespace}
            onModeChange={setMode}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              showHelp ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            Syntax
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting || !query.trim()}
            className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isExecuting ? 'Running...' : 'Execute'}
          </button>
        </div>
      </div>

      {/* Example queries */}
      <div className="px-4 py-2 border-b border-gray-800 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider flex-shrink-0">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => loadExample(ex)}
              title={ex.description}
              className="pill-interactive flex-shrink-0 px-2 py-1 rounded-full text-[11px] font-medium border border-gray-700 text-gray-400 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10 transition-all"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Query Editor */}
          <div className="border-b border-gray-800">
            <QueryEditor
              value={query}
              onChange={setQuery}
              syntax={syntax}
              onSyntaxChange={setSyntax}
              onExecute={handleExecute}
              parseError={parseError}
            />
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-auto">
            {result && (
              <div className="space-y-4 p-4">
                <div className="bg-gray-900/50 rounded-lg border border-gray-800">
                  <ScoringFunnel result={result} />
                </div>
                <div className="bg-gray-900/50 rounded-lg border border-gray-800">
                  <ResultsPanel result={result} />
                </div>
              </div>
            )}

            {!result && (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center max-w-md">
                  <p className="text-sm mb-1">Select an example above or write your own query</p>
                  <p className="text-xs text-gray-600">
                    Ctrl+Enter to execute &middot; Shift+Tab to format &middot; Tab to indent
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Syntax Help Sidebar — viewport height */}
        {showHelp && (
          <div className="w-80 border-l border-gray-800 overflow-y-auto flex-shrink-0"
               style={{ maxHeight: 'calc(100vh - 230px)' }}>
            <SyntaxHelp />
          </div>
        )}
      </div>
    </div>
  );
}
