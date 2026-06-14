import { ReactNode } from "react";
import { Link } from "wouter";
import { Settings } from "lucide-react";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans relative overflow-hidden text-foreground">
      <header className="glass sticky top-0 z-10 border-b-0 border-b border-white/5">
        <div className="container max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-bold tracking-wide hover:opacity-80 transition-opacity text-gradient">
            Kana Study
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Admin
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8 md:py-12 relative z-10">
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground/60 relative z-10">
        <p>Quietly crafted for focused learning.</p>
      </footer>
    </div>
  );
}
