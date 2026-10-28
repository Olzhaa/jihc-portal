import { AboutPage } from "./pages/About";
import { HomePage } from "./pages/Home";
import { NewsPage } from "./pages/News";
import { ProgramsPage } from "./pages/Programs";
import { StaffPage } from "./pages/Staff";
import { useRoute, useScrollOnRoute } from "./router";
import { Footer, Header } from "./ui";

const PAGES: Record<string, () => React.ReactElement> = {
  "/": HomePage,
  "/about": AboutPage,
  "/programs": ProgramsPage,
  "/news": NewsPage,
  "/staff": StaffPage,
};

export function Site() {
  const route = useRoute();
  useScrollOnRoute(route);
  const Page = PAGES[route.path] ?? HomePage;
  return (
    <div className="min-h-screen overflow-x-clip">
      <Header />
      <main>
        <Page />
      </main>
      <Footer />
    </div>
  );
}
