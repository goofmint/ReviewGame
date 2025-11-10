import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route(":lang", "routes/$lang._index.tsx"),
  route(":lang/:level", "routes/$lang.$level.tsx"),
  route(":lang/:level/result", "routes/$lang.$level.result.tsx"),
] satisfies RouteConfig;
