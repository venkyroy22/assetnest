import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Kanban Board — Professional Task Workflow | AssetNest",
    description: "Organize your projects with a stunning, minimalist Kanban board. Features seamless drag-and-drop, custom columns, and local-first privacy. Free to use.",
    keywords: [
        "kanban",
        "kanban board",
        "task management",
        "project tracking",
        "workflow tool",
        "productivity board",
        "drag and drop tasks",
        "free kanban tool",
        "minimalist kanban"
    ],
    openGraph: {
        title: "Kanban Board — Professional Task Workflow | AssetNest",
        description: "Organize your projects with a stunning, minimalist Kanban board. Features seamless drag-and-drop, custom columns, and local-first privacy.",
        url: "https://www.assetnest.space/tools/kanban",
        type: "website",
    },
};

export default function KanbanLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
