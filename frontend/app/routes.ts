import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("pages/landing.tsx"), route("main", "pages/main.tsx"), route("updates/:owner/:repo", "pages/updates.tsx"), route("updates/:owner/:repo/review", "pages/review.tsx")] satisfies RouteConfig;
