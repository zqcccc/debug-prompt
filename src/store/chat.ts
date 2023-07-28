import { axiosInstance } from '@/axios'
import { randomUUID } from 'crypto'
import { create, createStore, useStore } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

interface ChatMessage {
  content: string
  role: string
}
interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  lastMessage: ChatMessage | null
}
interface ChatPrompt {
  id: string
  name: string
  context: ChatMessage[]
}
export interface IChatStore {
  sessions: ChatSession[]
  currentSessionIndex: number
  newSession: () => void
  newPrompt: () => void
  setCurrentSessionIndex: (index: number) => void
  getCurrentSession: () => ChatSession
  getCurrentPrompt: () => ChatPrompt
  updateCurrentSession: (
    updater: (session: ChatSession) => void | ChatSession
  ) => void
  updateCurrentPrompt: (updater: (session: ChatPrompt) => ChatPrompt) => void
  setCurrentPromptIndex: (index: number) => void
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  postMessage: (message: ChatMessage) => Promise<any>
  promptList: ChatPrompt[]
  currentPromptIndex: number
}

const createEmptySession = () => ({
  id: uuidv4(),
  title: '默认 session title',
  messages: [],
  lastMessage: null,
})

let promptId = 1
const createEmptyPrompt = () => ({
  id: uuidv4(),
  name: '默认空 prompt',
  context: [],
})

const persistStoreFactory = (key: string | number) => {
  return createStore(
    persist<IChatStore>(
      (set, get) => ({
        sessions: [createEmptySession()],
        currentSessionIndex: 0,
        promptList: [createEmptyPrompt()],
        currentPromptIndex: 0,
        newSession: () => {
          const sessions = get().sessions
          sessions.push(createEmptySession())
          set(() => ({ sessions }))
          get().setCurrentSessionIndex(sessions.length - 1)
        },
        newPrompt: () => {
          const promptList = get().promptList
          promptList.push(createEmptyPrompt())
          set(() => ({ promptList }))
          get().setCurrentPromptIndex(promptList.length - 1)
        },
        getCurrentSession: () => {
          let index = get().currentSessionIndex
          const sessions = get().sessions

          if (index < 0 || index >= sessions.length) {
            index = Math.min(sessions.length - 1, Math.max(0, index))
            set(() => ({ currentSessionIndex: index }))
          }

          const session = sessions[index]

          return session
        },
        setCurrentSessionIndex(index) {
          set(() => ({ currentSessionIndex: index }))
        },
        setCurrentPromptIndex: (index) => {
          set(() => ({ currentPromptIndex: index }))
        },
        getCurrentPrompt() {
          return (
            get().promptList[get().currentPromptIndex] || createEmptyPrompt()
          )
        },
        setMessages: (messages) => {
          get().getCurrentSession().messages = messages
        },
        updateCurrentSession: (updater) => {
          const sessions = get().sessions
          const index = get().currentSessionIndex
          updater(sessions[index])
          set(() => {
            return { sessions: [...sessions] }
          })
        },
        updateCurrentPrompt: (updater) => {
          const promptList = get().promptList
          const index = get().currentPromptIndex
          promptList[index] = updater(promptList[index])
          set(() => ({ promptList: promptList.concat() }))
        },
        addMessage(message) {
          get().updateCurrentSession((session) => {
            session.messages = session.messages.concat()
            session.messages.push(message)
          })
        },
        async postMessage(message) {
          get().updateCurrentSession((session) => {
            session.lastMessage = message
            session.messages.push(message)
          })
          return axiosInstance
            .post('/api/gpt', {
              messages: get()
                .getCurrentPrompt()
                .context.concat(get().getCurrentSession().messages),
            })
            .then((res) => {
              const data = res.data
              if (data?.choices?.length) {
                const message = data.choices[0].message
                if (message.role && message.content) {
                  console.log(
                    '%c message: ',
                    'font-size:12px;background-color: #9E9689;color:#fff;',
                    message
                  )
                  get().addMessage(message)
                }
              }
            })
        },
      }),
      {
        name: `chat-storage-${key}`,
        version: 0.4,
        migrate(persistedState: any, version) {
          const newSessions = persistedState.sessions.map((item: any) => {
            return {
              id: item.id || uuidv4(),
              title: item.title || '默认 session title',
              messages: item.messages
                .filter(Boolean)
                .filter((i: any) => i.role && i.message),
            }
          })
          const promptList = persistedState.promptList.map((item: any) => {
            return {
              id: item.id || uuidv4(),
              name: item.name,
              context: item.context
                .filter(Boolean)
                .filter((i: any) => i.role && i.message),
            }
          })
          if (newSessions.length === 0) newSessions.push(createEmptySession())
          if (promptList.length === 0) promptList.push(createEmptyPrompt())
          return version < 0.4
            ? {
                sessions: newSessions,
                promptList: promptList,
              }
            : persistedState
        },
      }
    )
  )
}

export const ChatStore1 = persistStoreFactory(1)
export const ChatStore2 = persistStoreFactory(2)

export const useChatStore1 = <T>(selector: (state: IChatStore) => T) =>
  useStore(ChatStore1, selector)
export const useChatStore2 = <T>(selector: (state: IChatStore) => T) =>
  useStore(ChatStore2, selector)
