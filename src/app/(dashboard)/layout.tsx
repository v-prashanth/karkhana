import { AppChrome } from "@/components/ui/AppChrome";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppChrome>{children}</AppChrome>;
}
