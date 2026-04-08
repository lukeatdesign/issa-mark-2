"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  MapIcon,
  DocumentTextIcon,
  MapPinIcon,
  ArrowRightOnRectangleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  ChatBubbleLeftRightIcon as ChatIconSolid,
  MapIcon as MapIconSolid,
  DocumentTextIcon as DocumentIconSolid,
  MapPinIcon as MapPinIconSolid,
} from "@heroicons/react/24/solid";
import type { ComponentType, SVGProps } from "react";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  IconSolid: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",           label: "Overview",   Icon: HomeIcon,                IconSolid: HomeIconSolid     },
  { href: "/dashboard/chat",      label: "Chat",       Icon: ChatBubbleLeftRightIcon, IconSolid: ChatIconSolid     },
  { href: "/dashboard/roadmap",   label: "My Roadmap", Icon: MapIcon,                 IconSolid: MapIconSolid      },
  { href: "/dashboard/documents", label: "Documents",  Icon: DocumentTextIcon,        IconSolid: DocumentIconSolid },
  { href: "/dashboard/status",    label: "App Status", Icon: MapPinIcon,              IconSolid: MapPinIconSolid   },
];

export default function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { token, username, clearAuth } = useAuthStore();

  // pinned = "always show"; !pinned = "auto-hide" (icon-only, hover to expand as overlay)
  const [pinned, setPinned] = useState(true);
  const [hovered, setHovered] = useState(false);

  const isExpanded = pinned || hovered;

  const handleSignOut = async () => {
    try {
      await api.post("/logout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* silent */ }
    clearAuth();
    router.replace("/login");
  };

  const handleTogglePin = () => {
    if (pinned) {
      setPinned(false);
      setHovered(false);
    } else {
      setPinned(true);
    }
  };

  return (
    <>
      {/*
        Layout spacer — stays in the flex flow and controls how much
        room the sidebar "reserves". The actual sidebar is position:fixed
        so it never shifts content by itself.
      */}
      <div className={`flex-shrink-0 transition-[width] duration-300 ${pinned ? "w-56" : "w-14"}`} />

      {/* Sidebar — always fixed so hover-expand overlays content */}
      <aside
        className={`fixed left-0 top-0 h-screen z-40 bg-white border-r border-gray-100 flex flex-col overflow-hidden transition-[width] duration-300 ${
          isExpanded ? "w-56" : "w-14"
        } ${!pinned && hovered ? "shadow-xl" : ""}`}
        onMouseEnter={() => { if (!pinned) setHovered(true); }}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Logo */}
        <div className={`border-b border-gray-100 flex-shrink-0 flex items-center transition-all duration-300 ${
          isExpanded ? "px-5 py-5" : "px-3 py-5 justify-center"
        }`}>
          <Link
            href="/"
            className="font-display font-bold text-brand-900 text-base whitespace-nowrap"
          >
            {isExpanded ? "Issa Compass" : "IC"}
          </Link>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
          {/* Pin/auto-hide toggle — left-aligned, label fades with sidebar */}
          <button
            type="button"
            onClick={handleTogglePin}
            title={pinned ? "Auto-hide sidebar" : "Always show sidebar"}
            className="w-full flex items-center gap-3 px-3 py-2 mb-2 rounded-xl text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {pinned
              ? <ChevronDoubleLeftIcon className="w-3.5 h-3.5 shrink-0" />
              : <ChevronDoubleRightIcon className="w-3.5 h-3.5 shrink-0" />
            }
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? "opacity-100" : "opacity-0"}`}>
              {pinned ? "Auto-hide sidebar" : "Always show sidebar"}
            </span>
          </button>

          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const NavIcon = active ? item.IconSolid : item.Icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!isExpanded ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700 border-brand-200"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <NavIcon className="w-4 h-4 shrink-0" />
                <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? "opacity-100" : "opacity-0"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-2 pb-5 space-y-1 flex-shrink-0 overflow-hidden">
          {username && (
            <div className={`px-3 py-2 text-xs text-gray-400 whitespace-nowrap transition-opacity duration-200 ${isExpanded ? "opacity-100" : "opacity-0"}`}>
              Signed in as <span className="font-medium text-gray-600">{username}</span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            title={!isExpanded ? "Sign out" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? "opacity-100" : "opacity-0"}`}>
              Sign out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
