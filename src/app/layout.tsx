import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Geist } from "next/font/google"; // Khai báo Google Font
import "./globals.css";
import { cn } from "@/lib/utils";
import { WorkoutProvider } from "@/context/WorkoutContext"; // Import Provider

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <WorkoutProvider>
        <html
          lang="en"
          className={cn(
            inter.className,
            "font-sans",
            geist.variable,
            "scroll-smooth",
          )}
        >
          <body className="bg-black text-white antialiased">{children}</body>
        </html>
      </WorkoutProvider>
    </ClerkProvider>
  );
}
