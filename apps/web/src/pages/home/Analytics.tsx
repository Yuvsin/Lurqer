import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Analytics() {
  return (
    <section className="m-10">
      <div className="grid grid-cols-2 gap-5">
        <Card className="border-[#ECE7D8] bg-[#F2F0EC] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#5B5750]">
              Total Jobs Scanned
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold tracking-tight text-[#131200]">
                  20
                </p>
                <p className="mt-1 text-sm text-[#5B5750]">
                  Job postings analyzed by Lurqer
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#ECE7D8] bg-[#F2F0EC] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#5B5750]">
              Unsafe Job Signals
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold tracking-tight text-[#B0212B]">
                  SOMETHING
                </p>
                <p className="mt-1 text-sm text-[#5B5750]">
                  Jobs marked as medium or high risk
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-[#ECE7D8] bg-[#FAF9F6] p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#5B5750]">
                Most common flag:
              </p>
              <p className="mt-1 text-sm font-semibold text-[#131200]">
                Suspicious application link
              </p>
              <p className="mt-1 text-xs text-[#5B5750]">
                Several postings redirected away from the company domain.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}