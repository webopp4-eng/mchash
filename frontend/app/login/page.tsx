import { redirect } from 'next/navigation';

export default function LoginPage() {
  // Redirect to the new auth page
  redirect('/auth');
}
