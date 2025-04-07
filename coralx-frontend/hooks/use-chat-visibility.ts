'use client';

import { useState, useEffect } from 'react';
import { VisibilityType } from '@/components/visibility-selector';

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string;
  initialVisibility: VisibilityType;
}) {
  const [visibilityType, setVisibilityType] = useState(initialVisibility);

  useEffect(() => {
    // Fetch the chat data from the backend to get the visibility status
    async function fetchVisibility() {
      const response = await fetch(`http://localhost:8080/chat/${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setVisibilityType(data.visibility); // assuming the response includes visibility
      } else {
        console.error('Failed to fetch chat visibility');
      }
    }

    fetchVisibility();
  }, [chatId]);

  const updateVisibility = async (newVisibility: VisibilityType) => {
    // Update the visibility both locally and on the backend
    setVisibilityType(newVisibility);

    const response = await fetch('http://localhost:8080/update-chat-visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        visibility: newVisibility,
      }),
    });

    if (!response.ok) {
      console.error('Failed to update visibility');
    }
  };

  return { visibilityType, setVisibilityType: updateVisibility };
}
