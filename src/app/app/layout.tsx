import AuthProvider from "@/components/AuthProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider requireAuth={true}>{children}</AuthProvider>;
}
