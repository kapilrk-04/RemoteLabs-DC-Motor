#include "WiFi.h"
#include "ThingSpeak.h"
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <time.h>

//ONEM2M VALUES
#define CSE_IP "esw-onem2m.iiit.ac.in"
#define CSE_PORT 443
#define OM2M_ORGIN "Hocua9:mH0QdO"
#define OM2M_MN "/~/in-cse/in-name/"
#define OM2M_AE "Team-26"
#define OM2M_DATA_CONT "Node-1/Data"
#define INTERVAL 15000L
String m2mserver = "https://esw-onem2m.iiit.ac.in/~/in-cse/in-name/Team-41/Node-1/Data";

//MQTT-THINGSPEAK VALUES
const char* server = "mqtt3.thingspeak.com";
char* payload;
char* mqttUsername = "CwIhGBQbFiYKADQtFgsyAjE"; //devices -> mqtt channel 1 -> username
char* mqttPass = "NmNCTM5C3uhnvMNWJ66PHa+u"; //devices -> mqtt channel 2 -> password
const char* myWriteAPIKey = "X6AIB4BT742F561D";
const char* myReadAPIKey = "7LE70TACXFMTWDES";
unsigned long myChannel = 1922369;

HTTPClient http;

//unsigned long getTime() {
//  time_t now;
//  struct tm timeinfo;
//  if (!getLocalTime( & timeinfo)) {
//    //Serial.println("Failed to obtain time");
//    return (0);
//  }
//  time( & now);
//  return now;
//}


WiFiClient client;
PubSubClient mqttClient(server, 1883, client);

// Motor A
int motor1Pin1 = 27;
int motor1Pin2 = 26;
int enable1Pin = 14;

// Setting PWM properties
const int freq = 30000;
const int pwmChannel = 0;
const int resolution = 8;
int dutycycle = 200;

// RPM Sensor
const int Rpmsensor = 25;

// Current Sensor
const int Currsensor = 34;
char* ssid = "Kapil's Galaxy A32";
char* pwd = "egvt2820";

int fieldsToPush[8]  ={0, 1, 0, 0, 0, 0, 0, 0};

float old_rpm = -1;
float old_voltage = -1;

void pushMQTT(long pubChannelID, int value)
{
  String dataString1 = "field2=" + String(value);
  Serial.println(dataString1);
  String topicString = "channels/" + String(pubChannelID) + "/publish";
  if(mqttClient.publish(topicString.c_str(), dataString1.c_str()))
    Serial.println("MQTT push success\n");
  else
    Serial.println("MQTT push failure\n");
  Serial.println(pubChannelID);
}

//void pushOM2M(String value)
//{
//  static int last_push = millis();
//  if(millis() - last_push < 0) return;
//  HTTPClient http;
//  http.begin(m2mserver);
//  http.addHeader("X=M2M-Origin","Hocua9:mH0QdO");
//  http.addHeader("Content-Type", "application/json;ty=4");
//  Serial.println("{\"m2m:cin\": {\"cnf\":\"application/json\",\"con\": \"" + value + "\"}}");
//  int code = http.POST("{\"m2m:cin\": {\"cnf\":\"application/json\",\"con\": \"" + value + "\"}}");
//  Serial.println(code);
//  if (code == -1)
//    Serial.println("Connection failed");
//  http.end();
//  last_push = millis();
//}

float getRPS()
{
  unsigned long startTime = millis();
  float Rota = 0;
  unsigned long endTime = startTime + 1000;

  // Run for 1000 ms
  while (millis() < endTime)
  { 

    if (digitalRead(Rpmsensor))
    {
      Rota += 1;;
      while (digitalRead(Rpmsensor));
    }
  }

  // Due to the defect every slot produces 2 interrupts
  Rota /= 40;

  return Rota;
}

float getVoltage()
{
  float voltage = ThingSpeak.readFloatField(myChannel, 1, "X6AIB4BT742F561D");
  return voltage;
}

void mqttSubscribe(unsigned long channelID)
{
  String topicStr = "channels/" + String(channelID) + "/subscribe";
  if(mqttClient.subscribe(topicStr.c_str()))
    Serial.println("SUBSCRIBED SUCCESSFULLY");
  else
    Serial.println("UNSUCCESSFUL SUBSCRIPTION");
   
}

void CreateCI(int cnt1, int cnt2)
{
    String data;
    String server = "https://" + String() + CSE_IP + ":" + String() + CSE_PORT + String() + OM2M_MN;

    http.begin(server + String() + OM2M_AE + "/" + OM2M_DATA_CONT + "/");

    http.addHeader("X-M2M-Origin", OM2M_ORGIN);
    http.addHeader("Content-Type", "application/json;ty=4");
    http.addHeader("Content-Length", "100");

    data = "[" + String(cnt1) + ", " + String(cnt2) + "]"; 
    String req_data = String() + "{\"m2m:cin\": {"

      +
      "\"con\": \"" + data + "\","

      +
      "\"lbl\": \"" + "V1.0.0" + "\","

      //+ "\"rn\": \"" + "cin_"+String(i++) + "\","

      +
      "\"cnf\": \"text\""

      +
      "}}";
    int code = http.POST(req_data);
    http.end();
    Serial.print("OM2M code:");
    Serial.println(code);  
} 
void setup()
{
  // sets the pins as outputs:
  pinMode(motor1Pin1, OUTPUT);
  pinMode(motor1Pin2, OUTPUT);
  pinMode(enable1Pin, OUTPUT);
  pinMode(Currsensor, INPUT);
  pinMode(Rpmsensor, INPUT);
  
  // configure LED PWM functionalitites
  ledcSetup(pwmChannel, freq, resolution);
  
  // attach the channel to the GPIO to be controlled
  ledcAttachPin(enable1Pin, pwmChannel);

  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  // Connect to WiFi
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    while (WiFi.status() != WL_CONNECTED)
    {
      WiFi.begin(ssid, pwd);  // Connect to WPA/WPA2 network. Change this line if using open or WEP network
      Serial.print(".");
      delay(5000);
    }
    Serial.println("\nConnected.");
  }
  mqttClient.setServer(server, 1883);
  //mqttClient.setCallback(call_back);
  ThingSpeak.begin(client);
  // Testing
  Serial.println("Testing DC Motor...");
}

void loop()
{ 
  float rpm;
  // Read voltage from ThingSpeak
  Serial.println("Getting voltage:\n");
  float voltage = getVoltage();
 
  Serial.print("Voltage = ");
  Serial.println(voltage);

  if(!mqttClient.connected())
  {
    Serial.println("Connecting to MQTT Client\n");
    mqttClient.connect("CwIhGBQbFiYKADQtFgsyAjE", "CwIhGBQbFiYKADQtFgsyAjE", "NmNCTM5C3uhnvMNWJ66PHa+u");
  }
  Serial.println(mqttClient.connected());
  Serial.println("MQTT CLIENT CONNECTED\n");

  
  int dutycycle = 200 + (((55) / (7)) * (int) voltage);
  Serial.println(dutycycle);
  // Move DC motor forward
  digitalWrite(motor1Pin1, HIGH);
  digitalWrite(motor1Pin2, LOW);
  ledcWrite(pwmChannel, dutycycle);
  rpm = getRPS() * 60;
  Serial.print("Duty Cycle = ");
  Serial.println(dutycycle);
  Serial.print("RPM = ");
  Serial.println(rpm);
  mqttClient.loop();
  
  if ((old_rpm != rpm) && (old_voltage != voltage))
  {  
    pushMQTT(myChannel,rpm);
    CreateCI(voltage, rpm);
    //pushOM2M("[" + String(voltage) + "," + String(rpm) + "]");
  }
  mqttClient.loop();
//  old_rpm = rpm;
//  old_voltage = voltage;
//  if (millis() - prev_millis >= INTERVAL) {
//    epochTime = getTime();
//    String data;
//    String server = "https://" + String() + CSE_IP + ":" + String() + CSE_PORT + String() + OM2M_MN;
//
//    http.begin(server + String() + OM2M_AE + "/" + OM2M_DATA_CONT + "/");
//
//    http.addHeader("X-M2M-Origin", OM2M_ORGIN);
//    http.addHeader("Content-Type", "application/json;ty=4");
//    http.addHeader("Content-Length", "100");
//    
//    String pdata = "[" + String(epochTime) + ", " + String(voltage) + ", " + String(rpm) + " ]"; 
//    String req_data = String() + "{\"m2m:cin\": {"
//
//      +
//      "\"con\": \"" + pdata + "\","
//
//      +
//      "\"lbl\": \"" + "V1.0.0" + "\","
//
//      //+ "\"rn\": \"" + "cin_"+String(i++) + "\","
//
//      +
//      "\"cnf\": \"text\""
//
//      +
//      "}}";
//    Serial.println(server + String() + OM2M_AE + "/" + OM2M_DATA_CONT + "/");
//    Serial.println(req_data);
//    int code = http.POST(req_data);
//    http.end();
//    Serial.println(code);
//    prev_millis = millis();
//  }
//  delay(500);
  for (int a = 0; a < 20; a++)
  {
    Serial.print("-");
  }
  Serial.print("\n");
  
}
