import { NavLink } from "react-router";
import ghostLogo from "../assets/ghostLogo.png";

export function NavBar() {
  return (
    <div className="bg-[#392061] w-full h-16 flex items-center px-7">

      <div className="flex items-center gap-2">
        <img src={ghostLogo} alt="LurqerGhostLogo" className="h-8 w-auto" />
        <span className="text-[#FAF0CA] font-bold">Lurqer</span>
      </div>

      <div className="flex-1 flex justify-center gap-8">
        <NavLink to="/"
          className={({ isActive }) =>
            `text-sm font-medium transition-colors 
            ${isActive ? "text-[#FAF0CA]" : "text-[#C4B8E0] hover:text-[#FAF0CA]"
            }`}>
          Home
        </NavLink>

        <NavLink to="/scan"
        className={({ isActive }) =>
            `text-sm font-medium transition-colors 
            ${isActive ? "text-[#FAF0CA]" : "text-[#C4B8E0] hover:text-[#FAF0CA]"
            }`}>
          Scan
        </NavLink>

        <NavLink to="/reports"
        className={({ isActive }) =>
            `text-sm font-medium transition-colors 
            ${isActive ? "text-[#FAF0CA]" : "text-[#C4B8E0] hover:text-[#FAF0CA]"
            }`}>
          Reports
        </NavLink>
      </div>
      <div className="w-24" />
    </div>
  );
}