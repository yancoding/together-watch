const fs = require('fs')
const path = require('path')
const url = require('url')
const WebSocket = require('ws');
const has = require('has')

/* 进程管理约定 */
// 启动后将进程ID写入到./run/pidfile.pid文件中
let pidfile = path.join(__dirname, 'run/app.pid')
fs.writeFileSync(pidfile, process.pid)
// 接收到kill的SIGTERM信号时，删除pid文件，同时退出进程
process.on('SIGTERM', () => {
  if (fs.existsSync(pidfile)) {
    fs.unlinkSync(pidfile)
  }
  process.exit(0)
})


const wss = new WebSocket.Server({
  port: 8080
});
let users = []
let connections = []

let connectionList = []

const userExist = username => {
  for (item of connectionList) {
    if (item.username === username) {
      return true
    }
  }
  return false
}

const sendMessageToUser = (user, message) => {
  for (let i = 0; i < connections.length; i++) {
    if (connections[i].user === user) {
      console.log(`user: ${user}`)
      connections[i].client.send(JSON.stringify(message))
    }
  }
}

wss.on('connection', (ws, req) => {
  let name = url.parse(req.url, true).query.name
  if (!name || users.indexOf(name) !== -1) {
    ws.close()
    return
  }
  let friends = []
  users.push(name)
  connections.push({
    user: name,
    friends: [],
    client: ws,
  })

  wss.clients.forEach(client => {
    if (client.readyState = WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'updateUsers',
        content: users,
      }))
    }
  })

  ws.on('message', message => {
    try {
      message = JSON.parse(message)
    } catch (error) {
      return
    }
    console.log('received: ', message);
    if (typeof message === 'object' && has(message, 'type')) {
      switch (message.type) {
        case 'updateFriends':
          for (let i = 0; i < connections.length; i++) {
            if (connections[i].user === message.content) {
              connections[i].friends.push(name)

            }
          }
          break
        case 'updateFile':
          for (let i = 0; i < connections.length; i++) {
            if (connections[i].user === name) {
              connections[i].friends.forEach(friend => {
                console.log(`friend: ${friend}`)
                sendMessageToUser(friend, message)
              })
            }
          }
          break
        case 'play':
          for (let i = 0; i < connections.length; i++) {
            if (connections[i].user === name) {
              connections[i].friends.forEach(friend => {
                sendMessageToUser(friend, message)
              })
            }
          }
          break
        case 'pause':
          for (let i = 0; i < connections.length; i++) {
            if (connections[i].user === name) {
              connections[i].friends.forEach(friend => {
                sendMessageToUser(friend, message)
              })
            }
          }
          break
        case 'seek':
          for (let i = 0; i < connections.length; i++) {
            if (connections[i].user === name) {
              connections[i].friends.forEach(friend => {
                sendMessageToUser(friend, message)
              })
            }
          }
          break
      }
    }


  });

  ws.on('close', () => {
    users.splice(users.indexOf(name), 1)
    for (let i = 0; i < connections.length; i++) {
      if (connections[i].user.name === name) {
        connections.splice(i, 1)
      }
    }
    wss.clients.forEach(client => {
      if (client.readyState = WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'updateUsers',
          content: users,
        }))
      }
    })
  });
});