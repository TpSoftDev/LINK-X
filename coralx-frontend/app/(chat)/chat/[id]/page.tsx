"use client";

import { notFound, redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

import { Chat } from "@/components/chat";
import { DEFAULT_MODEL_NAME } from "@/lib/ai/models";
import { convertToUIMessages } from "@/lib/utils";
import { DataStreamHandler } from "@/components/data-stream-handler";

type PageParams = {
  id: string;
};

export default function Page(props: { params: Promise<PageParams> }) {
  const [myParams, setMyParams] = useState<PageParams | null>(null);

  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    props.params.then((resolvedParams) => {
      setMyParams(resolvedParams);
    });
  }, [props.params]);

  useEffect(() => {
    if (!myParams) return;

    const chatId = myParams.id;

    const token = localStorage.getItem("token");
    if (!token) {
      redirect("/login");
      return;
    }

    type FirebaseIdToken = { user_id?: string };
    try {
      const decodedToken: FirebaseIdToken = jwtDecode(token);
      if (!decodedToken.user_id) {
        console.error("No user_id in Firebase token");
        redirect("/login");
        return;
      }
    } catch (error) {
      console.error("Failed to decode Firebase ID token:", error);
      redirect("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/${chatId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) notFound();
        return res.json();
      })
      .then((data) => {
        if (!data) notFound();
        setChat(data);
      })
      .catch((err) => {
        console.error("Failed to fetch chat:", err);
        notFound();
      });

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/messages/${chatId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) notFound();
        return res.json();
      })
      .then((data) => {
        if (!data) notFound();
        setMessages(data);
      })
      .catch((err) => {
        console.error("Failed to fetch messages:", err);
        notFound();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [myParams]);

  if (!myParams) {
    return <div>Loading route params...</div>;
  }
  if (isLoading) {
    return <div>Loading chat data...</div>;
  }
  if (!chat) {
    return null;
  }

  const isReadOnly = false;

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messages)}
        selectedModelId={DEFAULT_MODEL_NAME}
        selectedVisibilityType={chat.visibility}
        isReadonly={isReadOnly}
      />
      <DataStreamHandler id={chat.id} />
    </>
  );
}