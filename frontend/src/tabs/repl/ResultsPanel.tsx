import { useState } from 'react';
import { ReplResult, ReplResultNode } from '../../types';

interface ResultsPanelProps {
  result: ReplResult | null;
}

type SortField =
  | 'score'
  | 'similarity_score'
  | 'confidence_score'
  | 'recency_score'
  | 'utility_score';
type SortDirection = 'asc' | 'desc';

export function ResultsPanel({ result }: ResultsPanelProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  if (!result) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Run a query to see results</p>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          <div className="font-semibold mb-1">Query Error</div>
          <div className="text-sm">{result.error}</div>
        </div>
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedResults = [...(result.results || [])].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (aVal - bVal) * multiplier;
  });

  const formatTime = (us: number) => {
    if (us < 1000) return `${us}μs`;
    if (us < 1000000) return `${(us / 1000).toFixed(2)}ms`;
    return `${(us / 1000000).toFixed(2)}s`;
  };

  const totalTime = result.parse_time_us + result.execute_time_us;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Results</h3>
          <div className="text-sm text-gray-400">
            {result.total_results} result{result.total_results !== 1 ? 's' : ''} in{' '}
            {formatTime(totalTime)}
            <span className="text-gray-600 ml-2">
              (parse: {formatTime(result.parse_time_us)}, execute:{' '}
              {formatTime(result.execute_time_us)})
            </span>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'table'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'cards'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Cards
          </button>
        </div>
      </div>

      {sortedResults.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No results found</p>
        </div>
      ) : viewMode === 'table' ? (
        <TableView
          results={sortedResults}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      ) : (
        <CardView results={sortedResults} />
      )}
    </div>
  );
}

interface TableViewProps {
  results: ReplResultNode[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

function TableView({ results, sortField, sortDirection, onSort }: TableViewProps) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) {
      return (
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'desc' ? (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
      </svg>
    );
  };

  const ScoreCell = ({ value }: { value: number }) => {
    const getColor = (v: number) => {
      if (v >= 0.8) return 'text-green-400';
      if (v >= 0.6) return 'text-yellow-400';
      if (v >= 0.4) return 'text-orange-400';
      return 'text-red-400';
    };

    return <span className={getColor(value)}>{value.toFixed(3)}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4 font-medium text-gray-400">Content</th>
            <th
              className="text-right py-3 px-4 font-medium text-gray-400 cursor-pointer hover:text-white"
              onClick={() => onSort('score')}
            >
              <div className="flex items-center justify-end gap-1">
                Score <SortIcon field="score" />
              </div>
            </th>
            <th
              className="text-right py-3 px-4 font-medium text-gray-400 cursor-pointer hover:text-white"
              onClick={() => onSort('similarity_score')}
            >
              <div className="flex items-center justify-end gap-1">
                Similarity <SortIcon field="similarity_score" />
              </div>
            </th>
            <th
              className="text-right py-3 px-4 font-medium text-gray-400 cursor-pointer hover:text-white"
              onClick={() => onSort('confidence_score')}
            >
              <div className="flex items-center justify-end gap-1">
                Confidence <SortIcon field="confidence_score" />
              </div>
            </th>
            <th
              className="text-right py-3 px-4 font-medium text-gray-400 cursor-pointer hover:text-white"
              onClick={() => onSort('recency_score')}
            >
              <div className="flex items-center justify-end gap-1">
                Recency <SortIcon field="recency_score" />
              </div>
            </th>
            <th
              className="text-right py-3 px-4 font-medium text-gray-400 cursor-pointer hover:text-white"
              onClick={() => onSort('utility_score')}
            >
              <div className="flex items-center justify-end gap-1">
                Utility <SortIcon field="utility_score" />
              </div>
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-400">Source</th>
            <th className="text-left py-3 px-4 font-medium text-gray-400">Labels</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr key={row.id} className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-3 px-4 max-w-md">
                <div className="truncate">{row.content}</div>
              </td>
              <td className="text-right py-3 px-4 font-mono">
                <ScoreCell value={row.score} />
              </td>
              <td className="text-right py-3 px-4 font-mono">
                <ScoreCell value={row.similarity_score} />
              </td>
              <td className="text-right py-3 px-4 font-mono">
                <ScoreCell value={row.confidence_score} />
              </td>
              <td className="text-right py-3 px-4 font-mono">
                <ScoreCell value={row.recency_score} />
              </td>
              <td className="text-right py-3 px-4 font-mono">
                <ScoreCell value={row.utility_score} />
              </td>
              <td className="py-3 px-4 text-gray-400 font-mono text-xs">{row.source_id}</td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1">
                  {row.labels.slice(0, 3).map((label: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-blue-900/30 border border-blue-700 text-blue-300 rounded text-xs"
                    >
                      {label}
                    </span>
                  ))}
                  {row.labels.length > 3 && (
                    <span className="text-gray-500 text-xs">+{row.labels.length - 3}</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface CardViewProps {
  results: ReplResultNode[];
}

function CardView({ results }: CardViewProps) {
  return (
    <div className="space-y-4">
      {results.map((result) => (
        <div key={result.id} className="border border-gray-800 rounded-lg p-4 hover:border-gray-700">
          <div className="mb-3">
            <p className="text-gray-200">{result.content}</p>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-3">
            <ScoreBar label="Score" value={result.score} />
            <ScoreBar label="Similarity" value={result.similarity_score} color="blue" />
            <ScoreBar label="Confidence" value={result.confidence_score} color="green" />
            <ScoreBar label="Recency" value={result.recency_score} color="yellow" />
            <ScoreBar label="Utility" value={result.utility_score} color="purple" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-500">Source:</span>
              <span className="text-gray-400 font-mono text-xs">{result.source_id}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {result.labels.map((label: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-blue-900/30 border border-blue-700 text-blue-300 rounded text-xs"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  value: number;
  color?: 'blue' | 'green' | 'yellow' | 'purple';
}

function ScoreBar({ label, value, color }: ScoreBarProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  const bgColor = color ? colorClasses[color] : 'bg-gray-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-mono text-gray-300">{value.toFixed(3)}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${bgColor}`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}
