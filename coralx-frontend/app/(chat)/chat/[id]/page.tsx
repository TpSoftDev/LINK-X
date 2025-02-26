import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  // Retrieve the JWT token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token) {
    // If no token is found, redirect to login
    redirect('/login');
  }

  // Decode the JWT token to get user info (optional)
  let userId = null;
  try {
    const decodedToken: any = jwtDecode(token);
    userId = decodedToken?.userId; // Assuming the token has a 'userId' field
  } catch (err) {
    console.error('Failed to decode JWT token', err);
    redirect('/login'); // Redirect if decoding fails
  }

  // Fetch the chat details from the backend API
  const chatResponse = await fetch(`${process.env.BACKEND_URL}/chat/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`, // Include the JWT token in the request
    },
  });

  if (!chatResponse.ok) {
    notFound();
  }

  const chat = await chatResponse.json();

  // Check if the chat exists
  if (!chat) {
    notFound();
  }

  // Check chat visibility and ensure the user has access if it's private
  if (chat.visibility === 'private') {
    // Ensure the user is logged in and has access to this chat
    if (!userId) {
      return notFound();
    }

    if (userId !== chat.userId) {
      return notFound(); // User is not allowed to access the chat
    }
  }

  // Fetch messages associated with the chat from the backend API
  const messagesResponse = await fetch(`${process.env.BACKEND_URL}/chat/${id}/messages`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`, // Include the JWT token here as well
    },
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
        isReadonly={userId !== chat.userId}
      />
      <DataStreamHandler id={id} />
    </>
  );
}