import AdManager from "../components/Ads/AdManager";
import MastheadManager from "../components/MastheadManager";
import { useAuth } from "../lib/firebase";

const AdminPage = () => {
  const { profile } = useAuth();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 pb-24">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">Admin console</h1>
        <p className="text-sm text-slate-500">
          Manage masthead assets and advertising creatives. Signed in as {profile?.displayName}.
        </p>
      </header>
      <MastheadManager />
      <AdManager />
    </div>
  );
};

export default AdminPage;
