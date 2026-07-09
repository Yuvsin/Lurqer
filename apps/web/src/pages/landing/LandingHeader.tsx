import { Link } from "react-router";

export function LandingHeader() {
  return (
    <header className="absolute left-0 right-0 top-0 z-30">
      <div className="mx-auto flex max-w-368 items-center justify-end px-5 py-4 sm:px-8 lg:px-10">
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-[#FAF0CA] transition hover:bg-white/10"
          >
            Log in
          </Link>

          <Link
            to="/signup"
            className="rounded-xl bg-[#FAF0CA] px-4 py-2 text-sm font-semibold text-[#392061] transition hover:opacity-90"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}