import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import DashboardContent from './components/DashboardContent';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <DashboardContent user={user} />;
}