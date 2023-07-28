export const download = (str: string, name = 'data.json') => {
  // const json = {
  //   sessions: chatStore.sessions,
  //   promptList: chatStore.promptList,
  // }
  // const str = JSON.stringify(json)
  // 创建 Blob 对象
  const blob = new Blob([str], { type: 'application/json' })

  // 创建一个链接，并将 Blob 对象绑定到链接上
  const url = URL.createObjectURL(blob)

  // 创建 <a> 标签来触发下载
  const a = document.createElement('a')
  a.href = url

  // 设置文件名
  a.download = 'data.json'

  // 添加 <a> 标签到文档中并模拟点击
  document.body.appendChild(a)
  a.click()

  // 清理 URL 对象
  URL.revokeObjectURL(url)
}
