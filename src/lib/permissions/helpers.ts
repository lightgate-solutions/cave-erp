import type { UserPermissionContext, Module } from "./types";
import { getModuleAccessByDepartment, ROUTE_MODULE_MAP } from "./config";
import { DEPARTMENTS } from "./types";

/**
 * Check if a user can access a specific module
 */
export function canAccessModule(
  user: UserPermissionContext,
  module: Module,
): boolean {
  // Admin department always has access
  if (user.department === DEPARTMENTS.ADMIN) {
    return true;
  }

  // Admin role always has access
  if (user.role === "admin") {
    return true;
  }

  const allowedModules = getModuleAccessByDepartment(user.department);
  return allowedModules.includes(module);
}

/**
 * Check if a user can access a specific route
 */
export function canAccessRoute(
  user: UserPermissionContext,
  route: string,
): boolean {
  // Normalize route (remove trailing slashes)
  const normalizedRoute =
    route.endsWith("/") && route !== "/" ? route.slice(0, -1) : route;

  // Check if route is mapped to a module
  const module = ROUTE_MODULE_MAP[normalizedRoute];

  if (!module) {
    // If route is not in the map, allow access by default
    // (for dynamic routes or future additions)
    return true;
  }

  return canAccessModule(user, module);
}

/**
 * Get redirect path for unauthorized users
 */
export function getUnauthorizedRedirect(): string {
  return "/";
}

/**
 * Filter modules list based on user permissions
 */
export function filterModulesByPermission(
  user: UserPermissionContext,
  modules: Module[],
): Module[] {
  return modules.filter((module) => canAccessModule(user, module));
}
