import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <TopBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
