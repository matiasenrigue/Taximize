import AuthGuard from "../../../components/AuthGuard/AuthGuard";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}