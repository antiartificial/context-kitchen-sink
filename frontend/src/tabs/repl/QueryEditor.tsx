import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { api } from '../../api';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  syntax: 'pipe' | 'cql';
  onSyntaxChange: (syntax: 'pipe' | 'cql') => void;
  onExecute: () => void;
  parseError: string | null;
}

export function QueryEditor({
  value,
  onChange,
  syntax,
  onSyntaxChange,
  onExecute,
  parseError: externalParseError,
}: QueryEditorProps) {
  const [parseError, setParseError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const parseTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Validate query with debouncing
  useEffect(() => {
    if (!value.trim()) {
      setParseError(null);
      setIsValid(null);
      return;
    }

    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current);
    }

    parseTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.post<{ valid: boolean; ast: object; error?: string }>(
          '/api/repl/parse',
          { query: value, syntax }
        );
        setIsValid(response.valid);
        setParseError(response.error || null);
      } catch (error: any) {
        setIsValid(false);
        setParseError(error.message || 'Parse failed');
      }
    }, 500);

    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
    };
  }, [value, syntax]);

  // Sync scroll between textarea and pre
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      onExecute();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const highlightedCode = syntax === 'pipe' ? highlightPipe(value) : highlightCQL(value);
  const lineCount = value.split('\n').length;
  const lines = Array.from({ length: Math.max(lineCount, 5) }, (_, i) => i + 1);

  const borderClass =
    isValid === true
      ? 'border-green-500/50'
      : isValid === false
      ? 'border-red-500/50'
      : 'border-gray-700';

  const displayError = externalParseError || parseError;

  const placeholder =
    syntax === 'pipe'
      ? 'search "quantum computing" | where confidence > 0.7 | score belief | limit 10'
      : 'SELECT * FROM repl WHERE similarity("quantum computing") > 0.3 ORDER BY confidence DESC LIMIT 10';

  return (
    <div className="p-4">
      {/* Syntax toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => onSyntaxChange('pipe')}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
              syntax === 'pipe'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Pipe Syntax
          </button>
          <button
            onClick={() => onSyntaxChange('cql')}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
              syntax === 'cql'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            CQL
          </button>
        </div>

        {isValid !== null && (
          <div className="flex items-center gap-2 text-sm">
            {isValid ? (
              <span className="text-green-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Valid
              </span>
            ) : (
              <span className="text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                Invalid
              </span>
            )}
          </div>
        )}
      </div>

      {/* Editor container */}
      <div className={`relative rounded-lg border-2 ${borderClass} bg-gray-900 transition-colors`}>
        <div className="flex">
          {/* Line numbers */}
          <div className="flex-shrink-0 py-4 px-2 text-right text-gray-600 select-none bg-gray-950 border-r border-gray-800 font-mono text-sm">
            {lines.map((line) => (
              <div key={line} className="leading-6">
                {line}
              </div>
            ))}
          </div>

          {/* Editor area */}
          <div className="flex-1 relative min-h-[120px] max-h-[300px]">
            {/* Highlighted code (background) */}
            <pre
              ref={preRef}
              className="absolute inset-0 py-4 px-4 font-mono text-sm leading-6 overflow-auto whitespace-pre-wrap break-words pointer-events-none"
              style={{ color: 'transparent' }}
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />

            {/* Textarea (foreground, transparent text) */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              placeholder={placeholder}
              className="absolute inset-0 py-4 px-4 font-mono text-sm leading-6 bg-transparent resize-none outline-none caret-white overflow-auto whitespace-pre-wrap break-words"
              style={{
                color: 'transparent',
                caretColor: 'white',
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Parse error */}
        {displayError && (
          <div className="px-4 py-2 bg-red-900/20 border-t border-red-800 text-red-400 text-sm">
            <span className="font-semibold">Parse error:</span> {displayError}
          </div>
        )}
      </div>
    </div>
  );
}

// Pipe syntax highlighter
function highlightPipe(code: string): string {
  if (!code) return '';

  const keywords = [
    'search',
    'where',
    'score',
    'limit',
    'graph',
    'rerank',
    'return',
    'as_of',
    'known_at',
    'exclude_sources',
  ];
  const operators = ['>=', '<=', '!=', '>', '<', '=', 'between', 'and', 'in'];
  const fields = [
    'confidence',
    'recency',
    'labels',
    'source',
    'similarity',
    'utility',
    'type',
  ];
  const scorePresets = ['belief', 'agent', 'balanced', 'procedural'];

  let highlighted = code;

  // Comments (// or #)
  highlighted = highlighted.replace(/(\/\/.*|#.*)/g, '<span class="text-gray-500">$1</span>');

  // String literals
  highlighted = highlighted.replace(
    /"([^"]*)"/g,
    '<span class="text-green-400">"$1"</span>'
  );

  // Numbers
  highlighted = highlighted.replace(/\b(\d+\.?\d*[a-z]*)\b/gi, (match) => {
    if (keywords.includes(match.toLowerCase()) || fields.includes(match.toLowerCase())) {
      return match;
    }
    return `<span class="text-orange-400">${match}</span>`;
  });

  // Pipe separator
  highlighted = highlighted.replace(/\|/g, '<span class="text-white font-bold">|</span>');

  // Keywords
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
    highlighted = highlighted.replace(
      regex,
      '<span class="text-purple-400 font-bold">$1</span>'
    );
  });

  // Operators
  operators.forEach((op) => {
    const escaped = op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
    highlighted = highlighted.replace(regex, '<span class="text-cyan-400">$1</span>');
  });

  // Fields
  fields.forEach((field) => {
    const regex = new RegExp(`\\b(${field})\\b`, 'gi');
    highlighted = highlighted.replace(regex, '<span class="text-blue-400">$1</span>');
  });

  // Score presets
  scorePresets.forEach((preset) => {
    const regex = new RegExp(`\\b(${preset})\\b`, 'gi');
    highlighted = highlighted.replace(
      regex,
      '<span class="text-yellow-400 italic">$1</span>'
    );
  });

  return highlighted;
}

// CQL syntax highlighter
function highlightCQL(code: string): string {
  if (!code) return '';

  const keywords = [
    'SELECT',
    'FROM',
    'WHERE',
    'ORDER BY',
    'LIMIT',
    'GRAPH',
    'EDGES',
    'RERANK',
    'SCORE',
    'USING',
    'WITHIN',
    'NAMESPACE',
    'AS_OF',
    'KNOWN_AT',
    'DESC',
    'ASC',
    'DEPTH',
  ];
  const operators = ['AND', 'OR', 'NOT', 'LIKE', 'BETWEEN', 'IN', 'IS', 'NULL'];
  const functions = ['similarity', 'confidence', 'recency', 'utility'];

  let highlighted = code;

  // Comments (--)
  highlighted = highlighted.replace(/(--.*)/g, '<span class="text-gray-500">$1</span>');

  // String literals
  highlighted = highlighted.replace(
    /('([^']*)'|"([^"]*)")/g,
    '<span class="text-green-400">$1</span>'
  );

  // Numbers
  highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, (match) => {
    return `<span class="text-orange-400">${match}</span>`;
  });

  // Keywords
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
    highlighted = highlighted.replace(
      regex,
      '<span class="text-purple-400 font-bold">$1</span>'
    );
  });

  // Operators
  operators.forEach((op) => {
    const regex = new RegExp(`\\b(${op})\\b`, 'gi');
    highlighted = highlighted.replace(regex, '<span class="text-cyan-400">$1</span>');
  });

  // Functions
  functions.forEach((fn) => {
    const regex = new RegExp(`\\b(${fn})\\s*\\(`, 'gi');
    highlighted = highlighted.replace(
      regex,
      '<span class="text-yellow-400">$1</span>('
    );
  });

  return highlighted;
}
