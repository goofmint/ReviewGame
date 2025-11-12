import { type RouteConfig, index, route } from "@react-router/dev/routes";
console.log("Defining route configuration for the application...");
export default [
  index("routes/_index.tsx"),
  route("share-preview", "routes/share-preview.tsx"),
  route("api/share-image", "routes/api.share-image.tsx"),
  route(":lang", "routes/$lang._index.tsx"),
  route(":lang/:level", "routes/$lang.$level.tsx"),
  route(":lang/:level/result", "routes/$lang.$level.result.tsx"),
] satisfies RouteConfig;
