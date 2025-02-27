'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0 sidebar">
      <SidebarHeader>
      <SidebarMenu>
      <div className="flex flex-col gap-4">
        <Link
          href="/"
          onClick={() => {
            setOpenMobile(false);
          }}
          className="flex flex-row gap-3 items-center"
        >
          <span className="text-lg font-bold px-2 hover:bg-muted rounded-md cursor-pointer">
            Link-X
          </span>
        </Link>
        <Button
          variant="ghost"
          type="button"
          className="flex items-center gap-4 p-2 rounded-lg gradient-button w-full"
          onClick={() => {
            setOpenMobile(false);
            router.push('/');
            router.refresh();
          }}
        >
          <PlusIcon className="h-4 w-4" />
          <span>New Chat</span>
        </Button>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <span className="text-medium font-semibold">
          RECENT CHATS:
        </span>
      </div>
    </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
