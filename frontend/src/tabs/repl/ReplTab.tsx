import { useState } from 'react';
import { QueryEditor } from './QueryEditor';
import { ResultsPanel } from './ResultsPanel';
import { ScoringFunnel } from './ScoringFunnel';
import { SyntaxHelp } from './SyntaxHelp';
import { NamespaceToggle } from './NamespaceToggle';
import { api } from '../../api';
import { ReplResult } from '../../types';

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
      const response = await api.post<ReplResult>('/api/repl/execute', {
        query,
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
      await api.post('/api/repl/reset', {});
      setQuery('');
      setResult(null);
      setParseError(null);
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Header with controls */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">REPL</h2>
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
            className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
          >
            {showHelp ? 'Hide' : 'Show'} Syntax Reference
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting || !query.trim()}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? 'Executing...' : 'Execute (Ctrl+Enter)'}
          </button>
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
              <div className="space-y-6 p-6">
                {/* Scoring Dashboard */}
                <div className="bg-gray-900/50 rounded-lg border border-gray-800">
                  <ScoringFunnel result={result} />
                </div>

                {/* Results Panel */}
                <div className="bg-gray-900/50 rounded-lg border border-gray-800">
                  <ResultsPanel result={result} />
                </div>
              </div>
            )}

            {!result && (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">Write a query and press Execute</p>
                  <p className="text-sm">
                    Use Ctrl+Enter to execute from the editor
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Syntax Help Sidebar */}
        {showHelp && (
          <div className="w-96 border-l border-gray-800 overflow-auto">
            <SyntaxHelp />
          </div>
        )}
      </div>
    </div>
  );
}
