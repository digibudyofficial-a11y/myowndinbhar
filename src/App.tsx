import { Outlet } from "react-router-dom";

import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import { useMasthead } from "./lib/hooks/useMasthead";

export type AppOutletContext = {
  mastheadImage?: string;
};

const App = () => {
  const { masthead } = useMasthead();

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Header mastheadImage={masthead?.imageData} />
      <main className="flex-1">
        <Outlet context={{ mastheadImage: masthead?.imageData }} />
      </main>
      <Footer />
    </div>
  );
};

export default App;
