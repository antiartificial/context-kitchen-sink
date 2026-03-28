import { useState } from "react";

interface JsonViewerProps {
  data: unknown;
  collapsed?: boolean;
}

export default function JsonViewer({
  data,
  collapsed = false,
}: JsonViewerProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const formatJson = (obj: unknown): string => {
    return JSON.stringify(obj, null, 2);
  };

  const colorizeJson = (json: string): React.ReactNode => {
    const lines = json.split("\n");
    return lines.map((line, i) => {
      const parts: React.ReactNode[] = [];

      // Regex patterns for different JSON elements
      const patterns = [
        { regex: /"([^"]+)":/g, color: "text-white", label: "key" },
        { regex: /"([^"]+)"/g, color: "text-green-400", label: "string" },
        { regex: /\b(\d+\.?\d*)\b/g, color: "text-blue-400", label: "number" },
        { regex: /\b(true|false)\b/g, color: "text-orange-400", label: "boolean" },
        { regex: /\b(null)\b/g, color: "text-gray-500", label: "null" },
      ];

      const matches: Array<{ start: number; end: number; color: string; text: string }> = [];

      // Find all matches
      for (const pattern of patterns) {
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
        let match;
        while ((match = regex.exec(line)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            color: pattern.color,
            text: match[0],
          });
        }
      }

      // Sort matches by start position
      matches.sort((a, b) => a.start - b.start);

      // Remove overlapping matches (keep first occurrence)
      const filteredMatches = matches.filter((match, index) => {
        if (index === 0) return true;
        const prev = matches[index - 1];
        return match.start >= prev.end;
      });

      // Build the colored line
      let lastIndex = 0;
      filteredMatches.forEach((match, idx) => {
        if (match.start > lastIndex) {
          parts.push(
            <span key={`text-${i}-${idx}`} className="text-gray-400">
              {line.slice(lastIndex, match.start)}
            </span>
          );
        }
        parts.push(
          <span key={`match-${i}-${idx}`} className={match.color}>
            {match.text}
          </span>
        );
        lastIndex = match.end;
      });

      if (lastIndex < line.length) {
        parts.push(
          <span key={`text-${i}-end`} className="text-gray-400">
            {line.slice(lastIndex)}
          </span>
        );
      }

      return (
        <div key={i}>
          {parts.length > 0 ? parts : <span className="text-gray-400">{line}</span>}
        </div>
      );
    });
  };

  const jsonString = formatJson(data);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          JSON
        </span>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          {isCollapsed ? "Expand" : "Collapse"}
        </button>
      </div>
      {!isCollapsed && (
        <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
          {colorizeJson(jsonString)}
        </pre>
      )}
    </div>
  );
}
