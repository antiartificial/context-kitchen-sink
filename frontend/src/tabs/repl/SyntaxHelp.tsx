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
          contextdb supports two query syntaxes: Pipe (functional) and CQL (keyword-oriented).
        </p>
      </div>

      {/* Pipe Syntax Section */}
      <section>
        <h4 className="text-base font-semibold mb-3 text-purple-400">Pipe Syntax</h4>
        <p className="text-sm text-gray-400 mb-4">
          Unix-style pipeline of stages separated by <code className="text-white">|</code>.
        </p>

        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Stages</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">search</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">where</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">weight</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">top</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">expand</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">rerank</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">in</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">return</code>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Weight Syntax</h5>
            <p className="text-xs text-gray-400 mb-2">
              <code className="text-white">weight dim:value</code> where dim is{' '}
              <code className="text-blue-400">similarity</code>,{' '}
              <code className="text-blue-400">confidence</code>,{' '}
              <code className="text-blue-400">recency</code>, or{' '}
              <code className="text-blue-400">utility</code>.
            </p>
            <div className="space-y-1 text-xs">
              <div className="px-3 py-1.5 bg-gray-800 rounded">
                <code className="text-yellow-400 italic">high</code>
                <span className="text-gray-500 ml-2">= 0.8</span>
              </div>
              <div className="px-3 py-1.5 bg-gray-800 rounded">
                <code className="text-yellow-400 italic">medium</code>
                <span className="text-gray-500 ml-2">= 0.5</span>
              </div>
              <div className="px-3 py-1.5 bg-gray-800 rounded">
                <code className="text-yellow-400 italic">low</code>
                <span className="text-gray-500 ml-2">= 0.2</span>
              </div>
              <div className="px-3 py-1.5 bg-gray-800 rounded">
                <code className="text-yellow-400 italic">off</code>
                <span className="text-gray-500 ml-2">= 0.0</span>
              </div>
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
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Examples</h5>
            <div className="space-y-3">
              <ExampleQuery
                id="pipe-1"
                query='search "project deadlines" | where confidence > 0.7 | weight recency:high | top 10'
                description="Semantic search with confidence filter and recency boost"
                copied={copiedExample === 'pipe-1'}
                onCopy={() =>
                  copyToClipboard(
                    'search "project deadlines" | where confidence > 0.7 | weight recency:high | top 10',
                    'pipe-1'
                  )
                }
              />
              <ExampleQuery
                id="pipe-2"
                query='search "Go routing" | where confidence > 0.7 | expand contradicts depth 2 | top 5 | rerank'
                description="Graph traversal with reranking"
                copied={copiedExample === 'pipe-2'}
                onCopy={() =>
                  copyToClipboard(
                    'search "Go routing" | where confidence > 0.7 | expand contradicts depth 2 | top 5 | rerank',
                    'pipe-2'
                  )
                }
              />
              <ExampleQuery
                id="pipe-3"
                query='search "team headcount" | in agent_memory | weight utility:high | top 5'
                description="Namespace-scoped query with utility weighting"
                copied={copiedExample === 'pipe-3'}
                onCopy={() =>
                  copyToClipboard(
                    'search "team headcount" | in agent_memory | weight utility:high | top 5',
                    'pipe-3'
                  )
                }
              />
              <ExampleQuery
                id="pipe-4"
                query='search "climate data" | where valid_time > 30d ago | weight similarity:0.4, recency:0.4, confidence:0.2 | top 20'
                description="Time-filtered with custom weight values"
                copied={copiedExample === 'pipe-4'}
                onCopy={() =>
                  copyToClipboard(
                    'search "climate data" | where valid_time > 30d ago | weight similarity:0.4, recency:0.4, confidence:0.2 | top 20',
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
        <h4 className="text-base font-semibold mb-3 text-purple-400">CQL (Contextual Query Language)</h4>
        <p className="text-sm text-gray-400 mb-4">
          Keyword-oriented, SQL-adjacent syntax. Starts with <code className="text-white">FIND</code>.
        </p>

        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Clauses</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">FIND</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">WHERE</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">FOLLOW</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">WEIGHT</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">LIMIT</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">RERANK</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">IN NAMESPACE</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">RETURN</code>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">WHERE Operators</h5>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">AND</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">OR</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">NOT</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">LIKE</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">BETWEEN</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">IN</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">IS NULL</code>
              <code className="px-2 py-1 bg-gray-800 rounded text-cyan-400">IS NOT NULL</code>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2">Examples</h5>
            <div className="space-y-3">
              <ExampleQuery
                id="cql-1"
                query='FIND "project status" WHERE confidence >= 0.7 WEIGHT similarity=0.4, recency=0.4 LIMIT 10'
                description="Basic search with weight tuning"
                copied={copiedExample === 'cql-1'}
                onCopy={() =>
                  copyToClipboard(
                    'FIND "project status" WHERE confidence >= 0.7 WEIGHT similarity=0.4, recency=0.4 LIMIT 10',
                    'cql-1'
                  )
                }
              />
              <ExampleQuery
                id="cql-2"
                query='FIND "team headcount" WHERE label IN ("hr", "org") AND confidence BETWEEN 0.5 AND 1.0 WEIGHT utility=high LIMIT 5'
                description="Label filtering with weight presets"
                copied={copiedExample === 'cql-2'}
                onCopy={() =>
                  copyToClipboard(
                    'FIND "team headcount" WHERE label IN ("hr", "org") AND confidence BETWEEN 0.5 AND 1.0 WEIGHT utility=high LIMIT 5',
                    'cql-2'
                  )
                }
              />
              <ExampleQuery
                id="cql-3"
                query='FIND "Go routing patterns" FOLLOW contradicts DEPTH 2 RETURN content, score'
                description="Graph traversal with projection"
                copied={copiedExample === 'cql-3'}
                onCopy={() =>
                  copyToClipboard(
                    'FIND "Go routing patterns" FOLLOW contradicts DEPTH 2 RETURN content, score',
                    'cql-3'
                  )
                }
              />
              <ExampleQuery
                id="cql-4"
                query='FIND "project status" IN NAMESPACE agent_memory WHERE valid_time > 7d ago LIMIT 10 RERANK'
                description="Namespace-scoped with temporal filter and reranking"
                copied={copiedExample === 'cql-4'}
                onCopy={() =>
                  copyToClipboard(
                    'FIND "project status" IN NAMESPACE agent_memory WHERE valid_time > 7d ago LIMIT 10 RERANK',
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
              search &quot;text&quot; | [where filters] | [weight dim:val] | [expand edge] | [top N] | [rerank]
            </code>
          </div>
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400 mb-1">CQL:</div>
            <code className="text-gray-300">
              FIND &quot;text&quot; [IN NAMESPACE ns] [WHERE ...] [FOLLOW edge] [WEIGHT dim=val] [LIMIT N] [RERANK]
            </code>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-gray-300 mt-4 mb-2">Datetime Values</h4>
        <div className="space-y-1 text-xs">
          <div className="px-3 py-1.5 bg-gray-800 rounded text-gray-400">
            ISO: <code className="text-green-400">"2024-06-01"</code>
          </div>
          <div className="px-3 py-1.5 bg-gray-800 rounded text-gray-400">
            Relative: <code className="text-orange-400">7d ago</code>, <code className="text-orange-400">2h ago</code>
          </div>
          <div className="px-3 py-1.5 bg-gray-800 rounded text-gray-400">
            Named: <code className="text-purple-400">now</code>, <code className="text-purple-400">yesterday</code>, <code className="text-purple-400">today</code>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-gray-300 mt-4 mb-2">Edge Types</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <code className="px-2 py-1 bg-gray-800 rounded text-gray-300">contradicts</code>
          <code className="px-2 py-1 bg-gray-800 rounded text-gray-300">supports</code>
          <code className="px-2 py-1 bg-gray-800 rounded text-gray-300">derives_from</code>
          <code className="px-2 py-1 bg-gray-800 rounded text-gray-300">cites</code>
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
