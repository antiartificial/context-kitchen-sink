import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
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
          '/repl/parse',
          { query: normalizeSingleLine(value), syntax }
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
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      handleFormat();
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

  const handleFormat = useCallback(() => {
    if (!value.trim()) return;
    const formatted = syntax === 'pipe' ? formatPipe(value) : formatCQL(value);
    onChange(formatted);
  }, [value, syntax, onChange]);

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
      ? 'search "DNA gene" | where confidence > 0.7 | weight recency:high | top 10'
      : 'FIND "Renaissance Leonardo" WHERE confidence > 0.5 WEIGHT similarity=high LIMIT 10';

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

        <button
          onClick={handleFormat}
          disabled={!value.trim()}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Format query (Shift+Tab)"
        >
          Format
        </button>

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

// ── Shared tokenizer ──────────────────────────────────────────────

interface Token {
  type: 'keyword' | 'operator' | 'field' | 'preset' | 'string' | 'number' | 'pipe' | 'comment' | 'paren' | 'bracket' | 'comma' | 'text' | 'function';
  value: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const PIPE_KEYWORDS = new Set([
  'search', 'where', 'weight', 'top', 'expand', 'rerank',
  'return', 'in', 'as', 'of', 'known', 'at', 'mode', 'depth', 'ago',
]);
const PIPE_OPERATORS = new Set(['>=', '<=', '!=', '>', '<', '=', 'between', 'and']);
const PIPE_FIELDS = new Set([
  'confidence', 'recency', 'labels', 'source', 'similarity', 'utility',
  'valid_time', 'valid_until',
]);
const PIPE_PRESETS = new Set(['high', 'medium', 'low', 'off']);

function tokenizePipe(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    // Comments
    if (code[i] === '/' && code[i + 1] === '/' || code[i] === '#') {
      const end = code.indexOf('\n', i);
      const comment = end === -1 ? code.slice(i) : code.slice(i, end);
      tokens.push({ type: 'comment', value: comment });
      i += comment.length;
      continue;
    }

    // Strings (double-quoted)
    if (code[i] === '"') {
      let j = i + 1;
      while (j < code.length && code[j] !== '"') j++;
      tokens.push({ type: 'string', value: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Pipe
    if (code[i] === '|') {
      tokens.push({ type: 'pipe', value: '|' });
      i++;
      continue;
    }

    // Brackets / parens / commas / colon
    if (code[i] === '[' || code[i] === ']') {
      tokens.push({ type: 'bracket', value: code[i] });
      i++;
      continue;
    }
    if (code[i] === '(' || code[i] === ')') {
      tokens.push({ type: 'paren', value: code[i] });
      i++;
      continue;
    }
    if (code[i] === ',') {
      tokens.push({ type: 'comma', value: ',' });
      i++;
      continue;
    }
    if (code[i] === ':') {
      tokens.push({ type: 'paren', value: ':' });
      i++;
      continue;
    }

    // Multi-char operators
    if (i + 1 < code.length && PIPE_OPERATORS.has(code.slice(i, i + 2))) {
      tokens.push({ type: 'operator', value: code.slice(i, i + 2) });
      i += 2;
      continue;
    }
    // Single-char operators
    if (PIPE_OPERATORS.has(code[i])) {
      tokens.push({ type: 'operator', value: code[i] });
      i++;
      continue;
    }

    // Whitespace
    if (/\s/.test(code[i])) {
      let j = i;
      while (j < code.length && /\s/.test(code[j])) j++;
      tokens.push({ type: 'text', value: code.slice(i, j) });
      i = j;
      continue;
    }

    // Words and numbers
    if (/[\w.]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\w.\-]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const lower = word.toLowerCase();

      if (PIPE_KEYWORDS.has(lower)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (PIPE_OPERATORS.has(lower)) {
        tokens.push({ type: 'operator', value: word });
      } else if (PIPE_FIELDS.has(lower)) {
        tokens.push({ type: 'field', value: word });
      } else if (PIPE_PRESETS.has(lower)) {
        tokens.push({ type: 'preset', value: word });
      } else if (/^\d/.test(word)) {
        tokens.push({ type: 'number', value: word });
      } else {
        tokens.push({ type: 'text', value: word });
      }
      i = j;
      continue;
    }

    // Fallback
    tokens.push({ type: 'text', value: code[i] });
    i++;
  }

  return tokens;
}

const CQL_KEYWORDS = new Set([
  'find', 'where', 'follow', 'weight', 'limit', 'rerank', 'return',
  'in', 'namespace', 'as', 'of', 'known', 'at', 'mode',
  'exclude', 'sources', 'depth', 'with',
]);
const CQL_OPERATORS = new Set(['and', 'or', 'not', 'like', 'between', 'in', 'is', 'null']);
const CQL_FIELDS = new Set([
  'confidence', 'recency', 'labels', 'source', 'similarity', 'utility',
  'valid_time', 'valid_until', 'label',
]);
const CQL_PRESETS = new Set(['high', 'medium', 'low', 'off']);

function tokenizeCQL(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    // Comments
    if (code[i] === '-' && code[i + 1] === '-') {
      const end = code.indexOf('\n', i);
      const comment = end === -1 ? code.slice(i) : code.slice(i, end);
      tokens.push({ type: 'comment', value: comment });
      i += comment.length;
      continue;
    }

    // Strings (single or double quoted)
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== quote) j++;
      tokens.push({ type: 'string', value: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Pipe
    if (code[i] === '|') {
      tokens.push({ type: 'pipe', value: '|' });
      i++;
      continue;
    }

    if (code[i] === '(' || code[i] === ')') {
      tokens.push({ type: 'paren', value: code[i] });
      i++;
      continue;
    }
    if (code[i] === ',') {
      tokens.push({ type: 'comma', value: ',' });
      i++;
      continue;
    }

    // Multi-char operators (>=, <=, !=)
    if (i + 1 < code.length && ['>=', '<=', '!='].includes(code.slice(i, i + 2))) {
      tokens.push({ type: 'operator', value: code.slice(i, i + 2) });
      i += 2;
      continue;
    }
    if ('><*='.includes(code[i])) {
      tokens.push({ type: 'operator', value: code[i] });
      i++;
      continue;
    }

    // Whitespace
    if (/\s/.test(code[i])) {
      let j = i;
      while (j < code.length && /\s/.test(code[j])) j++;
      tokens.push({ type: 'text', value: code.slice(i, j) });
      i = j;
      continue;
    }

    // Words and numbers
    if (/[\w.]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\w.\-:]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const lower = word.toLowerCase();

      if (CQL_KEYWORDS.has(lower)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (CQL_OPERATORS.has(lower)) {
        tokens.push({ type: 'operator', value: word });
      } else if (CQL_FIELDS.has(lower)) {
        tokens.push({ type: 'field', value: word });
      } else if (CQL_PRESETS.has(lower)) {
        tokens.push({ type: 'preset', value: word });
      } else if (/^\d/.test(word)) {
        tokens.push({ type: 'number', value: word });
      } else {
        tokens.push({ type: 'text', value: word });
      }
      i = j;
      continue;
    }

    tokens.push({ type: 'text', value: code[i] });
    i++;
  }

  return tokens;
}

// ── Renderers ─────────────────────────────────────────────────────

const STYLE: Record<Token['type'], string> = {
  keyword:  'text-purple-400 font-bold',
  operator: 'text-cyan-400',
  field:    'text-blue-400',
  preset:   'text-yellow-400 italic',
  string:   'text-green-400',
  number:   'text-orange-400',
  pipe:     'text-white font-bold',
  comment:  'text-gray-500',
  function: 'text-yellow-400',
  paren:    'text-gray-300',
  bracket:  'text-gray-300',
  comma:    'text-gray-300',
  text:     'text-gray-200',
};

function renderTokens(tokens: Token[]): string {
  return tokens
    .map((t) => {
      const cls = STYLE[t.type];
      const escaped = escapeHtml(t.value);
      return cls ? `<span class="${cls}">${escaped}</span>` : escaped;
    })
    .join('');
}

function highlightPipe(code: string): string {
  if (!code) return '';
  return renderTokens(tokenizePipe(code));
}

function highlightCQL(code: string): string {
  if (!code) return '';
  return renderTokens(tokenizeCQL(code));
}

// ── Prettifier ────────────────────────────────────────────────────

// Collapse a query to a single line with normalized whitespace.
// The backend parser doesn't support multi-line pipe queries,
// so we always send a single-line version for parse/execute.
export function normalizeSingleLine(code: string): string {
  return code.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

export function formatPipe(code: string): string {
  // Normalize first, then re-tokenize for clean formatting
  const flat = normalizeSingleLine(code);
  const tokens = tokenizePipe(flat);
  const out: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.type === 'pipe') {
      // Trim trailing whitespace before pipe
      while (out.length > 0 && out[out.length - 1].match(/^\s+$/)) out.pop();
      out.push(' | ');
      // Skip whitespace after pipe
      while (i + 1 < tokens.length && tokens[i + 1].type === 'text' && tokens[i + 1].value.trim() === '') i++;
      continue;
    }

    out.push(t.value);
  }

  return out.join('').trim();
}

export function formatCQL(code: string): string {
  const flat = normalizeSingleLine(code);
  const tokens = tokenizeCQL(flat);
  const out: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.type === 'keyword') {
      out.push(t.value.toUpperCase());
      continue;
    }

    out.push(t.value);
  }

  return out.join('').trim();
}
