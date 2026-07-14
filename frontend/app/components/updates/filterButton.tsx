import type { EntryTag } from "./entry/pill";
import { colorMap } from "./entry/pill";

export type FilterTag = "All" | "New" | "Improved" | "Fixed";

interface FilterButtonProps {
  tag: FilterTag;
  isActive: boolean;
  count: number;
  onClick: () => void;
}

export default function FilterButton({ tag, isActive, count, onClick }: FilterButtonProps) {
  const activeStyles = tag === "All" ? "bg-gray-900 text-white border-transparent" : `${colorMap[tag.toLowerCase() as EntryTag]} border-transparent`;

  return (
    <button className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${isActive ? activeStyles : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900"}`} onClick={onClick}>
      {tag}
      <span className="ml-1.5 text-xs opacity-60">{count}</span>
    </button>
  );
}
