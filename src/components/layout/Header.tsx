import { Link } from "react-router-dom";

import Masthead from "../Masthead";
import { useAuth } from "../../lib/firebase";

interface HeaderProps {
  mastheadImage?: string;
}

const Header = ({ mastheadImage }: HeaderProps) => {
  const { user, profile, signOutUser } = useAuth();
  const displayName = profile?.displayName || user?.email || "";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="h-16 w-full md:w-2/3">
          <Masthead src={mastheadImage} />
        </div>
        <nav className="flex items-center justify-end gap-3 text-sm text-slate-600">
          {profile?.role === "admin" ? (
            <Link className="font-medium text-brand-orange hover:underline" to="/admin">
              Admin
            </Link>
          ) : null}
          <span className="truncate font-medium" title={displayName}>
            {displayName}
          </span>
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="rounded-md border border-slate-300 px-3 py-1 font-semibold text-slate-600 hover:bg-slate-100"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
