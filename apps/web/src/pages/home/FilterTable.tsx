import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export type ApplicationFilter = "All" | "Active" | "Flagged" | "Ghosted";
export type ApplicationSort = "Company" | "Title" | "Status" | "Platform" | "Date" | "Risk";
export type SortDirection = "asc" | "desc";

type FilterTableProps = {
  activeFilter: ApplicationFilter;
  activeSort?: ApplicationSort;
  sortDirection: SortDirection;
  onFilterChange: (filter: ApplicationFilter) => void;
  onSortChange: (sort: ApplicationSort) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
};

const filters: ApplicationFilter[] = ["All", "Active", "Flagged", "Ghosted"];
const sortOptions: ApplicationSort[] = ["Company", "Title", "Status", "Platform", "Date", "Risk"];
const sortDirections: { value: SortDirection; label: string }[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

export function FilterTable({
  activeFilter,
  activeSort,
  sortDirection,
  onFilterChange,
  onSortChange,
  onSortDirectionChange,
}: FilterTableProps) {
  const directionLabel = sortDirection === "asc" ? "Asc" : "Desc";

  return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-[#131200]">Applications</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-[#ECE7D8] bg-[#F2F0EC] p-1">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => onFilterChange(filter)}
                  aria-pressed={activeFilter === filter}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeFilter === filter
                      ? "bg-[#FAF9F6] text-[#131200] shadow-sm"
                      : "text-[#5B5750] hover:text-[#131200]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                Sort
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {sortOptions.map((sort) => (
                    <DropdownMenuItem
                      key={sort}
                      onClick={() => onSortChange(sort)}
                      className={activeSort === sort ? "bg-[#F2F0EC] text-[#131200]" : undefined}
                    >
                      <span>{sort}</span>
                      {activeSort === sort && (
                        <span className="ml-auto text-[#392061]">{directionLabel}</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {sortDirections.map((direction) => (
                    <DropdownMenuItem
                      key={direction.value}
                      onClick={() => onSortDirectionChange(direction.value)}
                      className={sortDirection === direction.value ? "bg-[#F2F0EC] text-[#131200]" : undefined}
                    >
                      <span>{direction.label}</span>
                      {sortDirection === direction.value && (
                        <span className="ml-auto text-[#392061]">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
  );
}
