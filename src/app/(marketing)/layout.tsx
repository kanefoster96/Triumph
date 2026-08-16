import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { DemoSignIn } from "@/components/members/DemoSignIn";
import { isDemoMode } from "@/lib/members/service";

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const demo = await isDemoMode();

  return (
    <>
      {/* The switcher is a server component handed to a client one as a prop —
          the menu itself has no way to read the session. */}
      <TopBar demoSlot={demo ? <DemoSignIn /> : null} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
