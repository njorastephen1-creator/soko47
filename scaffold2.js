import fs from 'fs';
import path from 'path';
const files = {
'src/routes/__root.tsx': `import { Outlet, Link, createRootRouteWithContext } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link to="/" className="text-xl font-bold text-emerald-700">Soko47</Link>
          <nav className="ml-4 flex gap-6 text-sm font-medium">
            <Link to="/">Home</Link>
            <Link to="/browse">Browse</Link>
            <Link to="/auth">Sign In</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t py-8 text-center text-sm">Soko47 - Kenya's Markets</footer>
      <Toaster />
    </div>
  ),
});`,
'src/routes/index.tsx': `import { createFileRoute, Link } from "@tanstack/react-router";
export const Route = createFileRoute("/")({ component: Home });
function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 text-center">
      <h1 className="text-5xl font-extrabold">Welcome to Soko47</h1>
      <p className="mt-4 text-xl text-gray-600">Kenya's 47 county markets, now online.</p>
      <Link to="/browse" className="mt-8 inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold">Start Shopping</Link>
    </div>
  );
}`,
'src/routes/browse.tsx': `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/browse")({ component: Browse });
function Browse() { return <div className="p-8"><h1 className="text-3xl font-bold">Browse Goods</h1></div>; }`,
'src/routes/auth.tsx': `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/auth")({ component: Auth });
function Auth() { return <div className="p-8"><h1 className="text-3xl font-bold">Sign In</h1></div>; }`
};
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
