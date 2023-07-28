'use client'

import { IChatStore } from '@/store/chat'
import { useMount, useSetState } from 'ahooks'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input, Modal, Row, Select, Space } from 'antd'
import 'antd/dist/reset.css'
import { download } from '@/utils'

type Message = { role: string; content: string }

interface IChatProps {
  chatIndex?: number
  chatStore: IChatStore
}

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 20 },
  },
}

const formItemLayoutWithOutLabel = {
  wrapperCol: {
    xs: { span: 24, offset: 0 },
    sm: { span: 20, offset: 4 },
  },
}
const Chat = ({ chatIndex, chatStore }: IChatProps) => {
  const [state, setState] = useSetState({
    showPromptModal: false,
    showSessionModal: false,
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [key, setKey] = useState('')
  const [input, setInput] = useState('')
  const isKeyValid = useMemo(() => key.trim().length === 32, [key])

  // const [chatStore, curSession, curPrompt] = useChatStoreFactory(chatIndex)(
  //   (state) => [state, state.getCurrentSession(), state.getCurrentPrompt()]
  // )
  const curSession = chatStore.getCurrentSession()

  useMount(() => {
    const key = localStorage.getItem('azure-key')
    if (key) setKey(key)
  })

  useEffect(() => {
    const onClick = (e: any) => {
      if (!isKeyValid && e.target.id !== 'key') alert('azure key is invalid')
    }
    if (!isKeyValid) {
      window.addEventListener('click', onClick)
      return () => {
        window.removeEventListener('click', onClick)
      }
    }
  }, [isKeyValid])

  // const request = (msgs: Message[]) => {
  //   return fetch('/api/gpt', {
  //     method: 'POST',
  //     headers: {
  //       'api-key': key,
  //     },
  //     body: JSON.stringify({
  //       messages: msgs,
  //     }),
  //   })
  //     .then((res) => res.json())
  //     .then((json) => {
  //       console.log('json: ', json)
  //       setMessages((messages) =>
  //         messages.concat(json.choices.map((choice: any) => choice.message))
  //       )
  //     })
  // }
  const [form] = Form.useForm()

  const prompt = chatStore.getCurrentPrompt()

  const [_, setForceUpdate] = useState({})
  const forceUpdate = () => setForceUpdate({})

  return (
    <main className='mx-auto my-0 max-w-[50%] min-h-screen flex flex-col p-2 pb-5 shrink-0'>
      <div className='flex items-center mb-2'>
        当前选中的 session:
        <Select style={{ flex: 1 }} value={chatStore.currentSessionIndex}>
          {chatStore.sessions.map((session, sessionIndex) => {
            return (
              <Select.Option
                key={sessionIndex}
                value={sessionIndex}
                onClick={() => chatStore.setCurrentSessionIndex(sessionIndex)}
              >
                {session.title}
              </Select.Option>
            )
          })}
        </Select>
      </div>
      <div className='flex'>
        <Button
          className='mb-2 flex-1 mx-3'
          type='primary'
          onClick={() => {
            chatStore.newSession()
          }}
        >
          New Session
        </Button>
        <Button
          className='mb-2 flex-1 mx-3'
          type='primary'
          onClick={() => {
            setState({ showSessionModal: true })
          }}
        >
          edit current session
        </Button>
        <Modal
          title='edit current prompt'
          open={state.showSessionModal}
          footer
          onCancel={() => {
            setState({ showSessionModal: false })
          }}
        >
          <Form
            name='prompt'
            form={form}
            initialValues={curSession}
            onFinish={(values: any) => {
              console.log('Received values of form:', values)
              chatStore.updateCurrentSession((session) => {
                return {
                  ...session,
                  ...values,
                  messages: values.context.map((item: any) => ({
                    role: item.role,
                    content: item.content,
                  })),
                }
              })
              setState({ showSessionModal: false })
            }}
          >
            <Form.Item label='sessionName' name='title'>
              <Input
                onChange={(e) => {
                  const newName = e.target.value
                  chatStore.updateCurrentSession((session) => ({
                    ...session,
                    title: newName,
                  }))
                }}
              />
            </Form.Item>
            <Form.Item>
              <Button type='primary' htmlType='submit'>
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
      <div className='flex items-center mb-2'>
        当前选中的 prompt:
        <Select style={{ flex: 1 }} value={chatStore.currentPromptIndex}>
          {chatStore.promptList.map((prompt, promptIndex) => {
            return (
              <Select.Option
                key={promptIndex}
                value={promptIndex}
                onClick={() => chatStore.setCurrentPromptIndex(promptIndex)}
              >
                {prompt.name}
              </Select.Option>
            )
          })}
        </Select>
      </div>
      <div className='flex'>
        <Button
          className='mb-2 flex-1 mx-3'
          type='primary'
          onClick={() => {
            chatStore.newPrompt()
            setState({ showPromptModal: true })
          }}
        >
          New prompt
        </Button>
        <Button
          className='mb-2 flex-1 mx-3'
          type='primary'
          onClick={() => {
            setState({ showPromptModal: true })
          }}
        >
          edit current prompt
        </Button>
      </div>
      <Modal
        title='edit current prompt'
        open={state.showPromptModal}
        footer
        onCancel={() => {
          setState({ showPromptModal: false })
        }}
      >
        <Form
          name='prompt'
          form={form}
          initialValues={prompt}
          onFinish={(values: any) => {
            console.log('Received values of form:', values)
            chatStore.updateCurrentSession((prompt) => {
              return {
                ...prompt,
                ...values,
                context: values.context.map((item: any) => ({
                  role: item.role,
                  content: item.content,
                })),
              }
            })
            setState({ showPromptModal: false })
          }}
        >
          <Form.Item label='promptName' name='name'>
            <Input
              onChange={(e) => {
                const newName = e.target.value
                chatStore.updateCurrentSession((prompt) => ({
                  ...prompt,
                  name: newName,
                }))
              }}
            />
          </Form.Item>
          <div>prompts:</div>
          <Form.List name={`context`}>
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field, index) => (
                  <Row key={field.key}>
                    <Form.Item
                      {...field}
                      {...(index === 0
                        ? formItemLayout
                        : formItemLayoutWithOutLabel)}
                      name={[field.name, 'role']}
                      label='role'
                      key={field.key}
                      labelCol={{ span: 8 }}
                      wrapperCol={{ span: 16 }}
                      required
                      rules={[
                        {
                          required: true,
                          message: 'Please select role',
                        },
                      ]}
                    >
                      <Select placeholder='prompt'>
                        <Select.Option value='system'>system</Select.Option>
                        <Select.Option value='assistant'>
                          assistant
                        </Select.Option>
                        <Select.Option value='user'>user</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, 'content']}
                      label='content'
                      style={{ flex: 1 }}
                      labelCol={{ span: 6 }}
                      wrapperCol={{ span: 18 }}
                      required
                      rules={[
                        {
                          required: true,
                          message: 'Please input content',
                        },
                      ]}
                    >
                      <Input.TextArea rows={5} placeholder='prompt' />
                    </Form.Item>
                    {fields.length > 0 ? (
                      <MinusCircleOutlined
                        className='dynamic-delete-button'
                        width={20}
                        onClick={() => remove(field.name)}
                      />
                    ) : null}
                  </Row>
                ))}
                <Form.Item>
                  <Button
                    type='dashed'
                    onClick={() => add()}
                    style={{ width: '60%' }}
                    icon={<PlusOutlined />}
                  >
                    Add field
                  </Button>
                  <Button
                    type='dashed'
                    onClick={() => {
                      add('The head item', 0)
                    }}
                    style={{ width: '60%', marginTop: '20px' }}
                    icon={<PlusOutlined />}
                  >
                    Add field at head
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>
          <Form.Item>
            <Button type='primary' htmlType='submit'>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <h1 className='text-center'>Chat History:</h1>
      <div className='max-h-[500px] overflow-auto'>
        {curSession.messages.map((message, index) => {
          return (
            <div
              key={index}
              className={`max-w-[95%] flex ${
                message?.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <pre
                className={`w-fit whitespace-pre-wrap border rounded border-solid border-black mb-2 p-2`}
              >
                {message?.content}
              </pre>
            </div>
          )
        })}
        {curSession.messages.length === 0 && (
          <div className='text-center'>no message</div>
        )}
      </div>
      <h1 className='text-center'>Input:</h1>
      <Input.TextArea
        rows={5}
        disabled={!isKeyValid}
        className='m-0 w-full max-h-72 resize-none border rounded border-solid border-black p-2 focus:ring-0 focus-visible:ring-0 dark:bg-transparent'
        value={input}
        placeholder='input user message here'
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && input) {
            const nextMessages = messages.concat([
              { role: 'user', content: input },
            ])
            setMessages(nextMessages)
            chatStore
              .postMessage({ role: 'user', content: input.trim() })
              .finally(() => {
                // forceUpdate()
              })
            setInput('')
          }
        }}
      />
      <div className='mt-2'>
        azure openai key:{' '}
        <input
          id='key'
          type='text'
          value={key}
          onChange={(e) => {
            setKey(e.target.value)
            localStorage.setItem('azure-key', e.target.value)
          }}
        />
      </div>
      <Button
        onClick={() => {
          download(
            JSON.stringify({
              sessions: chatStore.sessions,
              promptList: chatStore.promptList,
            }),
            'all-session.json'
          )
        }}
      >
        导出所有 session 和 prompt
      </Button>
      <Button
        onClick={() => {
          download(
            JSON.stringify({
              sessions: [curSession],
              promptList: [prompt],
            }),
            'current-session.json'
          )
        }}
      >
        导出当前
      </Button>
    </main>
  )
}
export default Chat
