from flask import Flask,jsonify,render_template
from flask_cors import CORS
import requests
import pyodbc
from datetime import datetime, timedelta

app=Flask(__name__)
CORS(app)

API_KEY = "ee604a0d841d4076961161101240609"

conn = pyodbc.connect(
    "Driver={ODBC Driver 17 for SQL Server};"
    "Server=OBITO\\SQLEXPRESS;"
    "Database=WeatherApp;"
    "Trusted_Connection=yes;"
)
cursor = conn.cursor()

TEMP_THRESHOLD_HIGH = 35.0  # Example: High temperature threshold
TEMP_THRESHOLD_LOW = 5.0    # Example: Low temperature threshold

def check_temperature(city, current_temp):
    # Query to get the latest temperature update for the specific city
    cursor.execute("""
        SELECT TemperatureC, Timestamp
        FROM WeatherData
        WHERE City = ?
        ORDER BY Timestamp DESC;
    """, (city,))
    result = cursor.fetchone()

    alert_type = "Normal"
    if current_temp > TEMP_THRESHOLD_HIGH:
        alert_type = (city, f"Temperature in {city} is high at {current_temp}°C.")
        trigger_alert(city, f"Temperature in {city} is high at {current_temp}°C.")
    elif current_temp < TEMP_THRESHOLD_LOW:
        alert_type = (city, f"Temperature in {city} is low at {current_temp}°C.")
        trigger_alert(city, f"Temperature in {city} is low at {current_temp}°C.")

    return alert_type

def trigger_alert(city, alert_message):
    # Insert alert into AlertHistory table
    cursor.execute("""
        INSERT INTO AlertHistory (City, AlertMessage, Timestamp)
        VALUES (?, ?, ?);
    """, (city, alert_message, datetime.now()))
    conn.commit()
    
    print(f"ALERT TRIGGERED: {alert_message}")

def celsius_to_kelvin(celsius):
    # Kelvin is Celsius + 273.15
    kelvin = celsius + 273.15
    return round(kelvin, 2)


@app.route('/')
def homePage():
    return "Welcome ! Open WeatherPage.html"

@app.route('/weather/<city>')
def getWether(city):
    url = f"http://api.weatherapi.com/v1/current.json?key={API_KEY}&q={city}&aqi=no"
    response = requests.get(url)
    data =response.json()
    current_temp = data['current']['temp_c']
    
    # Check for temperature alert and get alert type
    alert_type = check_temperature(city, current_temp)
    reports={"Name":data['location']['name'],"Region":data['location']['region'],"Country":data['location']['country'],"IconURL":data['current']['condition']['icon'],"Weather":data['current']['condition']['text'],"Time":data['location']['localtime'],"TemperatureC":data['current']['temp_c'],"TemperatureF":data['current']['temp_f'],"TemperatureK":celsius_to_kelvin(data['current']['temp_c']),"Humidity":data['current']['humidity'],"Wind":data['current']['wind_kph'],"Alert": alert_type }
    
    cursor.execute("""INSERT INTO WeatherData (City, Region, Country, Weather, Time, TemperatureC, TemperatureF, TemperatureK, Humidity, WindSpeed, Timestamp)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""", (data['location']['name'], data['location']['region'], data['location']['country'], data['current']['condition']['text'],data['location']['localtime'], data['current']['temp_c'], data['current']['temp_f'],celsius_to_kelvin(data['current']['temp_c']), data['current']['humidity'], data['current']['wind_kph'], datetime.now()))
        
    # Commit the transaction
    conn.commit()

    return reports


if __name__=='__main__':
    app.run(debug=True)