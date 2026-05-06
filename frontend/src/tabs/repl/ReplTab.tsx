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

type ExampleGroup = {
  group: string;
  description: string;
  items: ExampleQuery[];
};

const EXAMPLE_GROUPS: ExampleGroup[] = [
  {
    group: "Pipe Syntax",
    description: "Unix-style chaining: search | filter | weight | top",
    items: [
      {
        label: "REPL: DNA + CRISPR",
        query: 'search "DNA CRISPR gene" | where confidence > 0.7 | weight similarity:high | top 5',
        syntax: "pipe",
        namespace: "repl",
        mode: "general",
        description: "General namespace:search Wikipedia-sourced science claims",
      },
      {
        label: "REPL: history + recency",
        query: 'search "Roman Empire" | weight recency:high, similarity:0.4 | top 5',
        syntax: "pipe",
        namespace: "repl",
        mode: "general",
        description: "Boost recently-added content with custom weight tuning",
      },
      {
        label: "Newsroom: Acme latency",
        query: 'search "latency" | where confidence > 0.5 | weight confidence:high | top 10',
        syntax: "pipe",
        namespace: "newsroom",
        mode: "belief_system",
        description: "Belief system:competing vendor vs. engineer performance claims",
      },
      {
        label: "Newsroom: pricing",
        query: 'search "pricing cost egress" | top 10',
        syntax: "pipe",
        namespace: "newsroom",
        mode: "belief_system",
        description: "Find all pricing-related claims across sources",
      },
      {
        label: "Agent: auth refactor",
        query: 'search "auth" | weight recency:high | top 10',
        syntax: "pipe",
        namespace: "agent",
        mode: "agent_memory",
        description: "Agent memory:episodic memories from an auth module refactor",
      },
      {
        label: "Agent: deployment",
        query: 'search "deploy staging production" | top 5',
        syntax: "pipe",
        namespace: "agent",
        mode: "agent_memory",
        description: "Agent's procedural and episodic deployment memories",
      },
      {
        label: "Auditor: trial efficacy",
        query: 'search "efficacy" | weight confidence:high | top 10',
        syntax: "pipe",
        namespace: "auditor",
        mode: "belief_system",
        description: "Pharma trial claims about drug effectiveness from 5 sources",
      },
      {
        label: "Auditor: side effects",
        query: 'search "adverse reaction side effect" | top 10',
        syntax: "pipe",
        namespace: "auditor",
        mode: "belief_system",
        description: "Safety data including the retracted study's fabricated claims",
      },
    ],
  },
  {
    group: "CQL Syntax",
    description: "SQL-like queries: FIND ... WHERE ... WEIGHT ... LIMIT",
    items: [
      {
        label: "REPL: Renaissance art",
        query: 'FIND "Renaissance Leonardo Mona Lisa" WHERE confidence > 0.5 WEIGHT similarity=high LIMIT 5',
        syntax: "cql",
        namespace: "repl",
        mode: "general",
        description: "CQL search:culture claims about Renaissance art from Wikipedia data",
      },
      {
        label: "REPL: web + blockchain",
        query: 'FIND "web blockchain transistor" WHERE confidence > 0.7 LIMIT 10',
        syntax: "cql",
        namespace: "repl",
        mode: "general",
        description: "CQL with confidence filter on tech claims",
      },
      {
        label: "Newsroom: uptime SLA",
        query: 'FIND "uptime reliability SLA" WEIGHT confidence=high LIMIT 10',
        syntax: "cql",
        namespace: "newsroom",
        mode: "belief_system",
        description: "CQL on belief system:vendor says 99.99%, engineer measured 99.48%",
      },
      {
        label: "Auditor: graph traversal",
        query: 'FIND "clinical trial" FOLLOW supports DEPTH 2 LIMIT 10',
        syntax: "cql",
        namespace: "auditor",
        mode: "belief_system",
        description: "CQL with edge traversal:find supporting evidence chains",
      },
    ],
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
      </div>

      {/* Example queries:grouped by syntax */}
      <div className="px-4 py-2 border-b border-gray-800 overflow-x-auto">
        <div className="space-y-1.5">
          {EXAMPLE_GROUPS.map((group) => (
            <div key={group.group} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider flex-shrink-0 w-14" title={group.description}>
                {group.group === "Pipe Syntax" ? "Pipe" : "CQL"}:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {group.items.map((ex) => (
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
            {/* Action bar: tight to query box */}
            <div className="flex items-center justify-end gap-2 px-4 pb-3">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
                  showHelp ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                Syntax
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                Reset
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting || !query.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                {isExecuting ? 'Running...' : 'Execute'}
              </button>
            </div>
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
                <div className="text-center max-w-lg space-y-4 px-4">
                  <p className="text-sm">Select an example above or write your own query</p>
                  <p className="text-xs text-gray-600">
                    Ctrl+Enter to execute &middot; Shift+Tab to format &middot; Tab to indent
                  </p>
                  <div className="text-left grid grid-cols-2 gap-4 text-[11px] text-gray-500 pt-2">
                    <div>
                      <h4 className="text-gray-400 font-medium mb-1">Two query syntaxes</h4>
                      <p className="mb-1"><span className="text-blue-400">Pipe</span>:Unix-style chaining:
                        <code className="text-gray-400 ml-1">search &quot;term&quot; | where ... | top N</code></p>
                      <p><span className="text-blue-400">CQL</span>:SQL-like:
                        <code className="text-gray-400 ml-1">FIND &quot;term&quot; WHERE ... LIMIT N</code></p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 font-medium mb-1">Namespaces &amp; modes</h4>
                      <p><span className="text-green-400">REPL</span>:Wikipedia reference data (general mode)</p>
                      <p><span className="text-green-400">Newsroom</span>:Acme Cloud vendor eval (belief system)</p>
                      <p><span className="text-green-400">Agent</span>:Auth refactor memories (agent memory)</p>
                      <p><span className="text-green-400">Auditor</span>:Pharma trial data (belief system)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Syntax Help Sidebar:viewport height */}
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
