import { BarChart3, FolderKanban, Library, Settings } from "lucide-react";

export const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: BarChart3,
    description: "Overview of libraries, scans, and recent activity.",
  },
  {
    title: "Libraries",
    href: "/libraries",
    icon: Library,
    description: "Manage approved media folders and indexing sources.",
  },
  {
    title: "Media",
    href: "/media",
    icon: FolderKanban,
    description: "Browse indexed media and playback surfaces.",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Configure storage, playback, and deployment options.",
  },
];
