"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  MapIcon,
  DocumentTextIcon,
  MapPinIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", Icon: HomeIcon },
  { href: "/dashboard/chat", label: "Chat", Icon: ChatBubbleLeftRightIcon },
  { href: "/dashboard/roadmap", label: "My Roadmap", Icon: MapIcon },
  { href: "/dashboard/documents", label: "Documents", Icon: DocumentTextIcon },
  { href: "/dashboard/status", label: "Status", Icon: MapPinIcon },
];

export default function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { token, username, clearAuth } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await api.post("/logout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* silent — clear client state regardless */ }
    clearAuth();
    router.replace("/login");
  };

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/" className="font-display font-bold text-brand-900 text-base">
          Issa Compass
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5 space-y-1">
        {username && (
          <div className="px-3 py-2 text-xs text-gray-400 truncate">
            Signed in as <span className="font-medium text-gray-600">{username}</span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
