import { type RouteConfig, index, route } from "@react-router/dev/routes";
console.log("Defining route configuration for the application...");
export default [
  index("routes/_index.tsx"),
  route("share-preview", "routes/share-preview.tsx"),
  route("api/share-image", "routes/api.share-image.tsx"),
  route(":locale", "routes/$locale._index.tsx"),
  route(":locale/:lang", "routes/$locale.$lang._index.tsx"),
  route(":locale/:lang/:level", "routes/$locale.$lang.$level.tsx"),
  route(":locale/:lang/:level/result", "routes/$locale.$lang.$level.result.tsx"),
] satisfies RouteConfig;
