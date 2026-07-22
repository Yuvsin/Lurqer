import { TableCell, TableRow } from "@/components/ui/table";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowDown01Icon,
  Delete02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Job, JobStatus } from "@/types/Job";

type JobTableRowProps = {
  job: Job;
  onStatusChange: (job: Job, status: JobStatus) => void;
  onDelete: (job: Job) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  actionsDisabled: boolean;
};

const jobStatuses: JobStatus[] = [
  "Saved",
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
  "Ghosted",
  "No response",
];

const statusStyles: Record<JobStatus, string> = {
  Saved: "bg-[#ECE7D8] text-[#392061]",
  Applied: "bg-[#F2F0EC] text-[#5B5750]",
  Screening: "bg-[#E4F3EB] text-[#145235]",
  Interview: "bg-[#ECE7D8] text-[#392061]",
  Offer: "bg-[#E4F3EB] text-[#1A6B45]",
  Rejected: "bg-[#FDE2E3] text-[#7A1620]",
  Ghosted: "bg-[#FCF0D8] text-[#6B4407]",
  "No response": "bg-[#FCF0D8] text-[#8A5A0A]",
};

const statusDots: Record<JobStatus, string> = {
  Saved: "bg-[#9A98B5]",
  Applied: "bg-[#5B5750]",
  Screening: "bg-[#1A6B45]",
  Interview: "bg-[#392061]",
  Offer: "bg-[#1A6B45]",
  Rejected: "bg-[#B0212B]",
  Ghosted: "bg-[#8A5A0A]",
  "No response": "bg-[#8A5A0A]",
};

export function JobTableRow({
  job,
  onStatusChange,
  onDelete,
  isUpdating,
  isDeleting,
  actionsDisabled,
}: JobTableRowProps) {
  return (
    <TableRow className="hover:bg-[#FAF9F6]">
      <TableCell className="font-medium text-[#131200]">{job.company}</TableCell>
      <TableCell className="w-48 max-w-48 text-[#5B5750]">
        <span className="block truncate" title={job.title}>
          {job.title}
        </span>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" />}
            disabled={actionsDisabled}
            aria-label={`Change status for ${job.title} at ${job.company}`}
            onClick={(event) => event.stopPropagation()}
            className={`min-w-28 justify-between gap-2 border-transparent shadow-none ${statusStyles[job.status]}`}
          >
            <span>{job.status}</span>
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Application status</DropdownMenuLabel>
              {jobStatuses.map((status) => {
                const isSelected = status === job.status;

                return (
                  <DropdownMenuItem
                    key={status}
                    closeOnClick
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!isSelected && !actionsDisabled) {
                        onStatusChange(job, status);
                      }
                    }}
                    className={isSelected ? "bg-[#F2F0EC] text-[#131200]" : undefined}
                  >
                    <span className={`size-2 rounded-full ${statusDots[status]}`} aria-hidden="true" />
                    <span>{status}</span>
                    {isSelected && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        strokeWidth={2}
                        className="ml-auto text-[#392061]"
                      />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {isUpdating && <span className="sr-only">Updating status</span>}
      </TableCell>
      <TableCell className="text-[#5B5750]">{job.platform}</TableCell>
      <TableCell className="text-[#5B5750]">{job.date}</TableCell>
      <TableCell><RiskBadge riskLevel={job.riskLevel} /></TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          disabled={actionsDisabled}
          onClick={() => onDelete(job)}
          aria-label={`Delete ${job.title} at ${job.company}`}
          title={`Delete ${job.title} at ${job.company}`}
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          {isDeleting && <span className="sr-only">Deleting</span>}
        </Button>
      </TableCell>
    </TableRow>
  );
}
