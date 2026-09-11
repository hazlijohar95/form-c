import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import App from "./App.js";

const rootRoute = createRootRoute();
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});
const engagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engagement/$engagementId/$tab",
  component: App,
});

const routeTree = rootRoute.addChildren([indexRoute, engagementRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
