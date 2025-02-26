import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  // Fetch the chat details from the backend API
  const chatResponse = await fetch(`${process.env.BACKEND_URL}/chat/${id}`, {
    method: 'GET',
  });

  if (!chatResponse.ok) {
    notFound();
  }

  const chat = await chatResponse.json();

  // Check if the chat exists
  if (!chat) {
    notFound();
  }

  const session = await auth();

  // Check chat visibility and ensure the user has access if it's private
  if (chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  // Fetch messages associated with the chat from the backend API
  const messagesResponse = await fetch(`${process.env.BACKEND_URL}/chat/${id}/messages`, {
    method: 'GET',
  });

  if (!messagesResponse.ok) {
    return notFound();
  }

  const messagesFromDb = await messagesResponse.json();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedModelId={selectedModelId}
        selectedVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
      />
      <DataStreamHandler id={id} />
    </>
  );
}