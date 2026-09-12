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
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: App,
});
const settingsSectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/$section",
  component: App,
});

const routeTree = rootRoute.addChildren([indexRoute, engagementRoute, settingsRoute, settingsSectionRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
