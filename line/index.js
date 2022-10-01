
var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

var mqtt = require('mqtt');

const CH_ACCESS_TOKEN = /*Line Channel Token*/"";

// MQTT Host
var mqtt_host = /*MQTTHOST*/"";

// MQTT Topic
var mqtt_topic = 'ESP32';

var sender;

app.use(bodyParser.json())

app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

const client = mqtt.connect({
  port: /*port*/"",
  host: mqtt_host,
  username: /*username */"",
  password: /*password*/""
});

client.on('connect',function(){
  console.log("[MQTT] Connected!");
  client.subscribe("ESP32STATUS",function(){
    console.log("subscribe to ESP32STATUS");
  });
  client.subscribe("ESP32ON",function(){
    console.log("subscribe to ESP32ON");
  });
  client.subscribe("ESP32OFF",function(){
    console.log("subscribe to ESP32OFF");
  });

});

client.on('reconnect', (error) => {
  console.log('reconnecting:', error)
})

client.on('error', (error) => {
  console.log('Connection failed:', error)
})

client.on('message',function(topic,message)
  {
    var mes;

    //Report
    if(topic == "ESP32STATUS")
      {
        console.log('Message from ESP32 :' + message);
        var stat = message.toString();
        var mes1 = (stat[0] == '1') ? 'หลอดไฟดวงที่ 1 เปิดอยู่' : 'หลอดไฟดวงที่ 1 ปิดอยู่';
        var mes2 = (stat[1] == '1') ? 'หลอดไฟดวงที่ 2 เปิดอยู่' : 'หลอดไฟดวงที่ 2 ปิดอยู่';
        var mes3 = (stat[2] == '1') ? 'หลอดไฟดวงที่ 3 เปิดอยู่' : 'หลอดไฟดวงที่ 3 ปิดอยู่';
        mes = mes1 + '\n' + mes2 + '\n' + mes3;
      } 
    
    //LedOn
    else if(topic == "ESP32ON")
    {
      mes = 'เปิดไฟแล้ว';
    }

    //LedOff
    else if(topic == "ESP32OFF")
    {
      mes = 'ปิดไฟแล้ว';
    }

    //Send message to line
    let data = {
      to: sender,
      messages: [
        {
          type: 'text',
          text: mes
        }
      ]
    }
    request({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+CH_ACCESS_TOKEN+''
      },
      url: 'https://api.line.me/v2/bot/message/push',
      method: 'POST',
      body: data,
      json: true
    }, function (err, res, body) {
      if (err) console.log('error')
      if (res) console.log('success')
      if (body) console.log(body)
    })
    
  }
); 

app.post('/webhook', (req, res) => {
  
  var text = req.body.events[0].message.text.toLowerCase()
  sender = req.body.events[0].source.userId
  var replyToken = req.body.events[0].replyToken
  console.log(text, sender, replyToken)
  console.log(typeof sender, typeof text)
  // console.log(req.body.events[0])
  
  if (text.slice(0,-1) === 'off' && ( text.slice(-1) === '1' || text.slice(-1) === '2' || text.slice(-1) === '3' )) 
  {
    // Command
    client.publish(mqtt_topic, text);
  }
  else if(text === 'report')
  {
    client.publish(mqtt_topic, text);
  }
  else if(text.slice(0,-1) === 'on' && ( text.slice(-1) === '1' || text.slice(-1) === '2' || text.slice(-1) === '3' ))
  {
    client.publish(mqtt_topic, text);
  }
  else {
    //Send message to line that wrong input
    let data = {
      to: sender,
      messages: [
        {
          type: 'text',
          text: 'วิธีใช้งาน เปิดไฟให้พิมพ์ on ตามด้วยหลอดไฟที่จะเปิดติดกัน เช่น on1\n พิมพ์ off เพื่อปิดไฟ พิมพ์แบบเดียวกับ on\nพิมพ์ report เพื่อดูว่าหลอดไฟแต่ละดวงเปิดหรือปิดอยู่'
        }
      ]
    }
    request({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+CH_ACCESS_TOKEN+''
      },
      url: 'https://api.line.me/v2/bot/message/push',
      method: 'POST',
      body: data,
      json: true
    }, function (err, res, body) {
      if (err) console.log('error')
      if (res) console.log('success')
      if (body) console.log(body)
    })
  }
  res.sendStatus(200)
})

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})

