"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import RoleGuard from "@/components/shared/RoleGuard";

const NAV = [
  { href: "/admin",            label: "Analytics",    icon: "📊" },
  { href: "/admin/overrides",  label: "Overrides",    icon: "🔍" },
  { href: "/admin/knowledge",  label: "Knowledge Base", icon: "📚" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RoleGuard roles={["consultant", "admin"]}>
      <div className="min-h-screen flex bg-gray-50">
        <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
          <div className="px-5 py-5 border-b border-gray-100">
            <Link href="/" className="font-display font-bold text-brand-900 text-base">
              Issa Compass
            </Link>
            <p className="text-xs text-gray-400 mt-0.5">Consultant Panel</p>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-3 pb-5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <span>←</span> User dashboard
            </Link>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </RoleGuard>
  );
}
