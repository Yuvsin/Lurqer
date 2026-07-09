export type ReportCategoryKey =
  | "phishing"
  | "fakeRecruiter"
  | "scam"
  | "ghost";

export type ReportCategory = {
  key: ReportCategoryKey;
  label: string;
  score: number;
};

const categoryCard: Record<
  ReportCategoryKey,
  {
    bg: string;
    label: string;
    score: string;
    track: string;
    fill: string;
  }
> = {
  phishing: {
    bg: "bg-[#FDE2E3]",
    label: "text-[#B0212B]",
    score: "text-[#7A1620]",
    track: "bg-[#FAC5C5]",
    fill: "bg-[#B0212B]",
  },
  fakeRecruiter: {
    bg: "bg-[#FCF0D8]",
    label: "text-[#8A5A0A]",
    score: "text-[#6B4407]",
    track: "bg-[#FAD89A]",
    fill: "bg-[#8A5A0A]",
  },
  scam: {
    bg: "bg-[#FDE2E3]",
    label: "text-[#B0212B]",
    score: "text-[#7A1620]",
    track: "bg-[#FAC5C5]",
    fill: "bg-[#B0212B]",
  },
  ghost: {
    bg: "bg-[#E4F3EB]",
    label: "text-[#1A6B45]",
    score: "text-[#145235]",
    track: "bg-[#A8DFC0]",
    fill: "bg-[#1A6B45]",
  },
};

type ReportCategoriesProps = {
  categories: ReportCategory[];
};

export function ReportCategories({ categories }: ReportCategoriesProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 grid grid-cols-4 gap-3">
      {categories.map(({ key, label, score }) => {
        const s = categoryCard[key];

        return (
          <div key={key} className={`${s.bg} rounded-xl p-3`}>
            <p className={`mb-1 text-xs ${s.label}`}>{label}</p>

            <p className={`text-xl font-semibold ${s.score}`}>{score}</p>

            <div className={`mt-1.5 h-1 rounded-full ${s.track}`}>
              <div
                className={`h-1 rounded-full ${s.fill}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}