import type { Route } from "./+types/home";
import Dashboard from "./dashboard";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Merge AI" }, { name: "description", content: "Merge AI" }];
}

export default function Home() {
  return (
    <main>
      <Dashboard />
    </main>
  );
}
