import { useState } from 'react';

export function SyntaxHelp() {
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedExample(id);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Syntax Reference</h3>
        <p className="text-sm text-gray-400">
          contextdb supports two query syntaxes: Pipe (functional) and CQL (SQL-like).
        </p>
      </div>

      {/* Pipe Syntax Section */}
      <section>
        <h4 className="text-base font-semibold mb-3 text-purple-400">Pipe Syntax</h4>
        <p className="text-sm text-gray-400 mb-4">
          Unix-style pipeline operators for composing queries functionally.
        </p>

        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Keywords</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">search</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">where</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">score</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">limit</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">graph</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">rerank</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">return</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">as_of</code>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Operators</h5>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">&gt;</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">&lt;</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">&gt;=</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">&lt;=</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">=</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">!=</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">between</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">and</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">in</code>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Field Names</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <code className="px-2 py-1 bg-gray-800 rounded text-blue-400">confidence</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-blue-400">recency</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-blue-400">labels</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-blue-400">source</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-blue-400">similarity</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-blue-400">utility</code>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Score Presets</h5>
            <div className="space-y-2 text-xs">
              <div className="px-3 py-2 bg-gray-800 rounded">
                <code className="text-yellow-400 italic">belief</code>
                <span className="text-gray-400 ml-2">
                  - High confidence weighting for belief systems
                </span>
              </div>
              <div className="px-3 py-2 bg-gray-800 rounded">
                <code className="text-yellow-400 italic">agent</code>
                <span className="text-gray-400 ml-2">
                  - Balanced for agent memory retrieval
                </span>
              </div>
              <div className="px-3 py-2 bg-gray-800 rounded">
                <code className="text-yellow-400 italic">balanced</code>
                <span className="text-gray-400 ml-2">
                  - Equal weighting across all components
                </span>
              </div>
              <div className="px-3 py-2 bg-gray-800 rounded">
                <code className="text-yellow-400 italic">procedural</code>
                <span className="text-gray-400 ml-2">
                  - Recency-focused for procedural knowledge
                </span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Examples</h5>
            <div className="space-y-3">
              <ExampleQuery
                id="pipe-1"
                query='search "quantum computing" | where confidence > 0.7 | score belief | limit 10'
                description="Search with confidence filtering and belief scoring"
                copied={copiedExample === 'pipe-1'}
                onCopy={() =>
                  copyToClipboard(
                    'search "quantum computing" | where confidence > 0.7 | score belief | limit 10',
                    'pipe-1'
                  )
                }
              />
              <ExampleQuery
                id="pipe-2"
                query='search "machine learning" | where labels in ["science","tech"] | score balanced | graph edges supports,contradicts depth 2'
                description="Search with label filtering, balanced scoring, and graph expansion"
                copied={copiedExample === 'pipe-2'}
                onCopy={() =>
                  copyToClipboard(
                    'search "machine learning" | where labels in ["science","tech"] | score balanced | graph edges supports,contradicts depth 2',
                    'pipe-2'
                  )
                }
              />
              <ExampleQuery
                id="pipe-3"
                query='search "drug efficacy" | where recency < 7d and confidence > 0.5 | score agent | rerank "most relevant to clinical trials" | limit 5'
                description="Recent results with LLM reranking"
                copied={copiedExample === 'pipe-3'}
                onCopy={() =>
                  copyToClipboard(
                    'search "drug efficacy" | where recency < 7d and confidence > 0.5 | score agent | rerank "most relevant to clinical trials" | limit 5',
                    'pipe-3'
                  )
                }
              />
              <ExampleQuery
                id="pipe-4"
                query='search "climate data" | where source = "ipcc:ar6" | as_of 2023-01-01 | score procedural | limit 20'
                description="Time-travel query with source filtering"
                copied={copiedExample === 'pipe-4'}
                onCopy={() =>
                  copyToClipboard(
                    'search "climate data" | where source = "ipcc:ar6" | as_of 2023-01-01 | score procedural | limit 20',
                    'pipe-4'
                  )
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* CQL Section */}
      <section>
        <h4 className="text-base font-semibold mb-3 text-purple-400">CQL (Contextdb Query Language)</h4>
        <p className="text-sm text-gray-400 mb-4">
          SQL-like declarative syntax for familiar query patterns.
        </p>

        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Keywords</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">SELECT</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">FROM</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">WHERE</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">ORDER BY</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">LIMIT</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">GRAPH</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">SCORE</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">RERANK</code>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Functions</h5>
            <div className="space-y-2 text-xs">
              <div className="px-3 py-2 bg-gray-800 rounded">
                <code className="text-yellow-400">similarity(query)</code>
                <span className="text-gray-400 ml-2">- Vector similarity search</span>
              </div>
              <div className="px-3 py-2 bg-gray-800 rounded">
                <code className="text-yellow-400">confidence()</code>
                <span className="text-gray-400 ml-2">- Get node confidence score</span>
              </div>
              <div className="px-3 py-2 bg-gray-800 rounded">
                <code className="text-yellow-400">recency()</code>
                <span className="text-gray-400 ml-2">- Get temporal recency score</span>
              </div>
              <div className="px-3 py-2 bg-gray-800 rounded">
                <code className="text-yellow-400">utility()</code>
                <span className="text-gray-400 ml-2">- Get task utility score</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Operators</h5>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">AND</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">OR</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">NOT</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">LIKE</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">BETWEEN</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">IN</code>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Examples</h5>
            <div className="space-y-3">
              <ExampleQuery
                id="cql-1"
                query='SELECT * FROM repl WHERE similarity("quantum computing") > 0.3 ORDER BY confidence DESC LIMIT 10'
                description="Basic similarity search ordered by confidence"
                copied={copiedExample === 'cql-1'}
                onCopy={() =>
                  copyToClipboard(
                    'SELECT * FROM repl WHERE similarity("quantum computing") > 0.3 ORDER BY confidence DESC LIMIT 10',
                    'cql-1'
                  )
                }
              />
              <ExampleQuery
                id="cql-2"
                query="SELECT * FROM repl WHERE labels IN ('science', 'tech') AND confidence() > 0.7 SCORE USING belief"
                description="Label filtering with custom scoring"
                copied={copiedExample === 'cql-2'}
                onCopy={() =>
                  copyToClipboard(
                    "SELECT * FROM repl WHERE labels IN ('science', 'tech') AND confidence() > 0.7 SCORE USING belief",
                    'cql-2'
                  )
                }
              />
              <ExampleQuery
                id="cql-3"
                query="SELECT * FROM auditor WHERE source IN ('trial:NCT-2024-001') GRAPH EDGES supports DEPTH 3 LIMIT 20"
                description="Source-specific graph traversal"
                copied={copiedExample === 'cql-3'}
                onCopy={() =>
                  copyToClipboard(
                    "SELECT * FROM auditor WHERE source IN ('trial:NCT-2024-001') GRAPH EDGES supports DEPTH 3 LIMIT 20",
                    'cql-3'
                  )
                }
              />
              <ExampleQuery
                id="cql-4"
                query='SELECT * FROM newsroom WHERE recency() < 7 AND similarity("election results") > 0.5 RERANK "most newsworthy" LIMIT 15'
                description="Recent news with LLM reranking"
                copied={copiedExample === 'cql-4'}
                onCopy={() =>
                  copyToClipboard(
                    'SELECT * FROM newsroom WHERE recency() < 7 AND similarity("election results") > 0.5 RERANK "most newsworthy" LIMIT 15',
                    'cql-4'
                  )
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grammar overview */}
      <section className="pt-6 border-t border-gray-800">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Query Structure</h4>
        <div className="space-y-3 text-xs">
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400 mb-1">Pipe:</div>
            <code className="text-gray-300">
              search &quot;text&quot; | [where filters] | [score preset] | [graph expansion] |
              [rerank &quot;prompt&quot;] | [limit n]
            </code>
          </div>
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400 mb-1">CQL:</div>
            <code className="text-gray-300">
              SELECT * FROM namespace WHERE conditions [GRAPH ...] [SCORE ...] [RERANK ...]
              [ORDER BY ...] [LIMIT n]
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}

interface ExampleQueryProps {
  id: string;
  query: string;
  description: string;
  copied: boolean;
  onCopy: () => void;
}

function ExampleQuery({ query, description, copied, onCopy }: ExampleQueryProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 group hover:bg-gray-750 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <code className="flex-1 text-xs text-gray-300 font-mono break-words">{query}</code>
        <button
          onClick={onCopy}
          className="flex-shrink-0 p-1.5 hover:bg-gray-700 rounded transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <svg
              className="w-4 h-4 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}
