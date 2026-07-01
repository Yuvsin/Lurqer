import { NavLink } from "react-router";
import ghostLogo from "../assets/ghostLogo.png";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${isActive
    ? "text-[#FAF0CA]"
    : "text-[#C4B8E0] hover:text-[#FAF0CA]"
  }`;

export function NavBar() {
  return (
    <header className="h-16 w-full bg-[#392061] px-7">
      <nav className="grid h-full grid-cols-3 items-center">
        <NavLink to="/" end className="flex items-center gap-2">
          <img
            src={ghostLogo}
            alt="Lurqer ghost logo"
            className="h-8 w-auto"
          />
          <span className="font-bold text-[#FAF0CA]">Lurqer</span>
        </NavLink>

        <div className="flex justify-center gap-8">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>

          <NavLink to="/scan" className={navLinkClass}>
            Scan
          </NavLink>

          <NavLink to="/reports" className={navLinkClass}>
            Reports
          </NavLink>
        </div>

        <div className="flex justify-end" />
      </nav>
    </header>
  );
}