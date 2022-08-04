const localUUID = localStorage.getItem('uuid')
const uuid = localUUID || +new Date() + ''
localStorage.setItem('uuid', uuid)

let pubnub = new PubNub({
  publishKey: "pub-c-dc002b3e-a84f-4b05-9715-c862d5a02d13",
  subscribeKey: "sub-c-a0f77065-f4c1-4ec5-9e42-d25c3f76566f",
  uuid
});
let throwDom = document.querySelector('.throw')
let throwButton = throwDom.querySelector('.button')
let throwInput = throwDom.querySelector('textarea')
let throwReply = throwDom.querySelector('.t-reply')
let pickUpDom = document.querySelector('.pick-up')
let pickUpButton = pickUpDom.querySelector('.button')
let pickUpReply = document.querySelector('.pick-up-reply')
let pickUpReplyH3 = pickUpReply.querySelector('h3')
let pickUpReplyInput = pickUpReply.querySelector('textarea')
let pickUpReplyButton = pickUpReply.querySelector('.button')
let isThrow = true
let channels = 'drifting-bottle-15'
let history = []
let musicBg
let ding

function setup() {
  if (location.search) {
    const num = location.search.split('=')[1]
    if (num == 1) {
      isThrow = true
      throwDom.className = 'throw active'
      pickUpDom.className = 'pick-up'
    } else {
      isThrow = false
      throwDom.className = 'throw'
      pickUpDom.className = 'pick-up active'
    }
  } else {
    throwDom.className = 'throw active'
    pickUpDom.className = 'pick-up'
    isThrow = true
  }

  throwButton.onclick = () => {
    handleThrow(throwInput.value)
    throwInput.value = ''
  }
  pickUpButton.onclick = () => {
    fetchHistory(() => {
      console.log(history)
      const list = history.filter(item => !item.reply)
      if (list.length) {
        const target = list[Math.floor(Math.random() * list.length)]
        pickUpDom.className = 'pick-up'
        pickUpReply.className = 'pick-up-reply active'
        pickUpReplyH3.innerHTML = 'Received the drift bottle: <br>' + target.text
        pickUpReplyButton.onclick = () => {
          const index = history.findIndex(item => item.text == target.text && item.uuid == target.uuid)
          history[index].reply = pickUpReplyInput.value
          handleThrow(true, true, JSON.parse(JSON.stringify(history)))
          pickUpReplyInput.value = ''
          pickUpDom.className = 'pick-up active'
          pickUpReply.className = 'pick-up-reply'
        }
      } else {
        alert('There are no bottles to pick up')
      }
    })
  }

  initPubnub()
  musicBg = loadSound('./bgm.mp3')
  // ding = loadSound('./ding.mp3')
}

function mouseClicked() {
  musicBg.play()
  loop()
}

function initPubnub() {
  if (isThrow) {
    pubnub.subscribe({ channels: [channels] });
    pubnub.addListener({

      message: function ({ message }) {
        console.log('收到回复')
        // 收到回复
        const target = message.find(item => item.uuid == uuid)
        if (target && target.reply) {
          alert(`${target.text}\nReply Received:${target.reply}`)
        }
      }
    });
  }
}

// 仍漂流瓶
function handleThrow(text = '', isReply, data) {
  if (!text) {
    return
  }
  fetchHistory(() => {
    if (!isReply) {
      history.unshift({
        uuid,
        text,
        reply: ''
      })
    }
    pubnub.publish(
      {
        channel: channels,
        message: isReply ? data : history
      },
      function (status, response) {
        console.log(status);
        console.log(response);
        alert('Success')
      }
    );
  })
}

// 获取漂流瓶
function fetchHistory(callback) {
  pubnub.fetchMessages(
    {
      channels: [channels],
      end: '15343325004275466',
      count: 1
    },
    function (status, response) {
      if (status.statusCode == 200) {
        let res = response.channels[channels]
        if (res) {
          history = res[0].message
        }
        callback && callback()
      }
    }
  );
}