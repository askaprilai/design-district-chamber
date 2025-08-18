import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import LandingPage from './components/LandingPage';

export default async function HomePage() {
  const user = await currentUser();

  // If user is signed in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}