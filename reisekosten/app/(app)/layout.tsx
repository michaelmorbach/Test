import AppShell from '@/components/layout/AppShell';
import { requireUser } from '@/lib/dal';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
