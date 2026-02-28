import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center border-b px-4 py-3">
          <SidebarTrigger className="-ml-1" />
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
