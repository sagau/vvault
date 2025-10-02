import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import RoleSwitcher from "@/components/RoleSwitcher";

export const metadata = {
  title: "VVAULT",
  description: "Role-based dashboard app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          {/* ✅ RoleSwitcher shows up on every page in dev, hidden in production */}
          {process.env.NODE_ENV !== "production" && <RoleSwitcher />}
        </AuthProvider>
      </body>
    </html>
  );
}
