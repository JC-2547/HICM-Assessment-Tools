import { getLocale } from "next-intl/server";

import AuthGuard from "@/app/auth/auth-guard";
import LanguageSwitcher from "@/app/component/languageSwitcher";
import Navbar from "@/app/component/navbar";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex min-h-[calc(100vh-56px)] flex-col">
        <div className="flex-1">
          <AuthGuard
            redirectTo={`/${locale}`}
            allowedRoles={["company"]}
            roleRedirects={{
              admin: `/${locale}/admindashboard`,
              audit: `/${locale}/auditdashboard`,
            }}
          >
            {children}
          </AuthGuard>
        </div>
      </div>
      <LanguageSwitcher />
    </div>
  );
}