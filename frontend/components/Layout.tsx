import BottomNav from './BottomNav';
import SideNav from './SideNav';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,161,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(10,100,255,0.08),transparent_20%),linear-gradient(180deg,#f8fbff_0%,#eff7ff_100%)]">
      <div className="lg:flex lg:min-h-screen">
        <SideNav />
        <main className="flex-1 lg:px-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
