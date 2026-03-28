interface TabBarProps<T extends string> {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
}

export default function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: TabBarProps<T>) {
  return (
    <div className="border-b border-gray-800">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = tab === active;
          return (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              className={`
                px-4 py-3 text-sm font-medium transition-all duration-200
                border-b-2 -mb-px
                ${
                  isActive
                    ? "text-white border-[#6366f1]"
                    : "text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-700"
                }
              `}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
