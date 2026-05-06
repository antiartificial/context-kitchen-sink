interface TabBarProps<T extends string> {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
  icons?: Record<string, string>;
}

export default function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  icons,
}: TabBarProps<T>) {
  return (
    <div className="border-b border-gray-800">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = tab === active;
          const iconPath = icons?.[tab];
          return (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              className={`
                px-4 py-3 text-sm font-medium transition-all duration-200
                border-b-2 -mb-px inline-flex items-center gap-1.5
                ${
                  isActive
                    ? "text-white border-[#6366f1]"
                    : "text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-700"
                }
              `}
            >
              {iconPath && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                </svg>
              )}
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
