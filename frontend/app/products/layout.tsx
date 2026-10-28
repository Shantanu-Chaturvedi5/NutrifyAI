import { Nav } from "@/components/Nav";
import { getCurrentUserOptional } from "@/lib/backend";
import type { UserResponse } from "@/lib/types";

export default async function ProductsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOptional<UserResponse>();

  return (
    <div className="min-h-screen bg-linen text-graphite">
      <Nav user={user} />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
