import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { jwtDecode } from 'jwt-decode';
import Script from 'next/script';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Retrieve the cookies from the request
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  let session = null;
  if (token) {
    try {
      // Decode the JWT token to extract user data
      const decodedToken: any = jwtDecode(token);
      session = { user: decodedToken };
    } catch (err) {
      console.error('Failed to decode JWT token', err);
    }
  }

  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session?.user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}