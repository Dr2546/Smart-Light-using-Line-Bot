#include <PubSubClient.h>
#include <WiFi.h>

// Update these with values suitable for your network.
const char* ssid = /*SSID*/;
const char* password = /*PASSWORD*/;

// Config MQTT Server
#define mqtt_server /*SERVER*/
#define mqtt_port /*PORT*/
#define mqtt_user /*USER*/
#define mqtt_password /*PASSWORD*/

// Define Pin
#define LED1 32
#define LED2 33
#define LED3 25

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED3, OUTPUT);

  Serial.begin(115200);
  delay(10);

  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}


void loop() {
  if (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32Client", mqtt_user, mqtt_password)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
      return;
    }
  } else {
    client.subscribe("ESP32");
  }
  client.loop();
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  String msg = "";
  int i=0;
  while (i<length) 
  {
    msg += (char)payload[i++];
  }
  Serial.println(msg);
  if(msg[0] == 'o' && msg[1] == 'n')
  {
    if(msg[2] == '1')
      digitalWrite(LED1,HIGH);
    else if(msg[2] == '2')
      digitalWrite(LED2,HIGH);
    else if(msg[2] == '3')
      digitalWrite(LED3,HIGH);
    client.publish("ESP32ON","ok"); 
  }
  else if(msg[0] == 'o' && msg[1] == 'f' && msg[2] == 'f')
  {
    if(msg[3] == '1')
      digitalWrite(LED1,LOW);
    else if(msg[3] == '2')
      digitalWrite(LED2,LOW);
    else if(msg[3] == '3')
      digitalWrite(LED3,LOW);
    client.publish("ESP32OFF","ok"); 
  }
  else if(msg == "report")
  {
    char out[4];
    out[0] = digitalRead(LED1)==HIGH ? '1' : '0';
    out[1] = digitalRead(LED2)==HIGH ? '1' : '0';
    out[2] = digitalRead(LED3)==HIGH ? '1' : '0';
    out[3] = '\0';  // add NUL termination
    client.publish("ESP32STATUS",out);  
  }
}
