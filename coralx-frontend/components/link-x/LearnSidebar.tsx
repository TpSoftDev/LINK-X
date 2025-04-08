"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseconfig";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Bell, Settings, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

const Avatar = () => (
  <div className="h-10 w-10 rounded-full bg-sidebar-primary/20 border border-sidebar-primary/30 flex items-center justify-center overflow-hidden">
    <User className="h-5 w-5 text-sidebar-primary" />
  </div>
);

const modules = [
  { name: "Introduction to Cryptocurrency" },
  { name: "Blockchain Technology" },
  { name: "Types of Cryptocurrencies" },
  { name: "Crypto Wallets and Security" },
  { name: "Buying and Selling Crypto" },
  { name: "Crypto Mining" },
  { name: "DeFi and Smart Contracts" },
  { name: "Crypto Regulations" },
  { name: "Crypto Investment Strategies" },
  { name: "Future of Cryptocurrency" },
  { name: "Future of Cryptocurrency" },
  { name: "Future of Cryptocurrency" },
  { name: "Future of Cryptocurrency" },
  { name: "Future of Cryptocurrency" },
  { name: "Future of Cryptocurrency" }
];

interface SidebarProps {
  className?: string;
  onCollapseChange?: (value: boolean) => void;
}

const Sidebar = ({ className, onCollapseChange }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  const toggleSidebar = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    onCollapseChange?.(newValue);
  };

  if (!mounted) return null;

  return (
    <>
      {!collapsed && isMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 animate-fade-in backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-screen z-50 flex flex-col sidebar-gradient border-r border-sidebar-border/30",
          collapsed ? "w-16" : "w-64",
          isMobile && collapsed ? "translate-x-[-100%]" : "translate-x-0",
          "transition-all duration-300 ease-in-out",
          className
        )}
      >
        {/* Header */}
        <div className="h-[10vh] px-3 flex items-center justify-between border-b border-sidebar-border/30 relative">
          {!collapsed && (
            <Link href="/" className="flex items-center h-full relative pl-1">
              <Image
                src="/images/Logo-dark.png"
                alt="Logo"
                width={288}
                height={197}
                className="max-h-[9vh] w-auto object-contain"
                priority
              />
            </Link>
          )}

          <div className={cn("absolute right-3", collapsed && "static mx-auto")}>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="rounded-full h-8 w-8 min-w-[2rem] bg-sidebar-accent border-sidebar-border/50 hover:bg-sidebar-primary/20 hover:text-sidebar-primary"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Module List */}
        <div className="flex-1 overflow-y-auto py-4 px-2 hide-scrollbar">
          <nav className="space-y-2">
            {modules.map((module, idx) => (
              <div
                key={idx}
                className={cn(
                  "transition-all duration-200 ease-in-out px-3 py-2 rounded-md cursor-pointer",
                  "hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed ? "flex justify-center" : "text-lg font-medium text-sidebar-foreground/80"
                )}
              >
                {collapsed ? (
                  <div className="w-2 h-2 rounded-full bg-sidebar-foreground/50" />
                ) : (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {module.name}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="px-2 py-2 border-t border-sidebar-border/30 space-y-2">
          <div
            className={cn(
              "mt-3 pt-3 border-t border-sidebar-border/30",
              collapsed ? "justify-center" : "justify-between",
              "flex items-center"
            )}
          >
            <Avatar />
            {!collapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Alex Johnson</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">Pro Member</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {isMobile && collapsed && (
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg border border-blue-400/30"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </>
  );
};

export default Sidebar;
