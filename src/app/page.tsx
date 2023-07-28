"use client"

import Chat from '@/components/chat'
import { useChatStore1, useChatStore2 } from '@/store/chat'

export default function Home() {
  const chatStore1 = useChatStore1((state) => state)
  const chatStore2 = useChatStore2((state) => state)
  return (
    <main className='flex min-h-screen items-center justify-between px-4'>
      <Chat chatStore={chatStore1} />
      <Chat chatStore={chatStore2} />
    </main>
  )
}
