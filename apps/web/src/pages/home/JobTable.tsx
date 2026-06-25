import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"

export function JobTable() {


  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* Table header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[#131200]">Applications</h2>
        <button className="text-sm px-4 py-2 rounded-md bg-[#392061] text-[#FAF0CA] hover:opacity-90 transition-opacity">
          + Add application
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#ECE7D8] rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F2F0EC] hover:bg-[#F2F0EC]">
              <TableHead className="text-[#5B5750] font-semibold">Company</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Title</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Platform</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Date</TableHead>
              <TableHead className="text-[#5B5750] font-semibold">Risk Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-[#FAF9F6] cursor-pointer">
              <TableCell className="font-medium text-[#131200]">Paper</TableCell>
              <TableCell className="text-[#5B5750]">Rock</TableCell>
              <TableCell className="text-[#5B5750]">Scissors</TableCell>
              <TableCell className="text-[#5B5750]">Rock</TableCell>
              <TableCell>
                <span className="text-xs px-2 py-1 rounded-md bg-[#E4F3EB] text-[#1A6B45]">Low</span>
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-[#FAF9F6] cursor-pointer">
              <TableCell className="font-medium text-[#131200]">Paper</TableCell>
              <TableCell className="text-[#5B5750]">Rock</TableCell>
              <TableCell className="text-[#5B5750]">Scissors</TableCell>
              <TableCell className="text-[#5B5750]">Rock</TableCell>
              <TableCell>
                <span className="text-xs px-2 py-1 rounded-md bg-[#FCF0D8] text-[#8A5A0A]">Medium</span>
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-[#FAF9F6] cursor-pointer">
              <TableCell className="font-medium text-[#131200]">Paper</TableCell>
              <TableCell className="text-[#5B5750]">Rock</TableCell>
              <TableCell className="text-[#5B5750]">Scissors</TableCell>
              <TableCell className="text-[#5B5750]">Rock</TableCell>
              <TableCell>
                <span className="text-xs px-2 py-1 rounded-md bg-[#FDE2E3] text-[#B0212B]">High</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}