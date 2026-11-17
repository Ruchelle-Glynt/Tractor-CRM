import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { photoSrc } from "@/lib/photo";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-montserrat",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Tractor Outdoor CRM",
  description: "Client intelligence tool for Tractor Outdoor",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const me = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true, photoUpdatedAt: true } })
    : null;
  return (
    <html lang="en" className={`${montserrat.variable} ${poppins.variable}`}>
      <body className="font-sans">
        <AppShell user={me ? { name: me.name, role: me.role, photo: photoSrc(me) } : null}>{children}</AppShell>
      </body>
    </html>
  );
}
