import { PAGE_INSET } from "@/lib/ui/shell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-h-[100dvh] min-h-screen flex-1 flex-col bg-ui-bg pt-[env(safe-area-inset-top)] ${PAGE_INSET}`}
    >
      {children}
    </div>
  );
}
