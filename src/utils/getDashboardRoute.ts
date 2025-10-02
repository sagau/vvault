export function getDashboardRoute(role: string | null | undefined): string {
  switch (role?.toLowerCase()) {
    case "superadmin":
      return "/superadmin";
    case "admin":
      return "/admin";
    case "vendor":
      return "/vendor";
    default:
      return "/login"; // fallback
  }
}
