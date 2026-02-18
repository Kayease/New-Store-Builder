import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./AppIcon";

const SidebarItem = ({
  name,
  href,
  icon,
  className = "",
  showCount = false,
  count = 0,
}) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${className} ${isActive
        ? "bg-indigo-50 text-indigo-600"
        : "text-[#64748b] hover:bg-slate-50 hover:text-[#1a2333]"
        }`}
    >
      <div className={`p-2 rounded-lg transition-colors ${isActive ? "bg-indigo-100 text-indigo-600" : "bg-transparent text-[#64748b] group-hover:bg-white group-hover:text-[#1a2333]"
        }`}>
        <Icon
          name={icon}
          size={18}
          className="transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      <span className="flex-1">{name}</span>

      {showCount && count > 0 && (
        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}

      {isActive && (
        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.4)] animate-pulse"></div>
      )}
    </Link>
  );
};

export default SidebarItem;
