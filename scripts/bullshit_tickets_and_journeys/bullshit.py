import mariadb
from random import randint
from numpy.random import choice
import datetime

DAYS_RANGE = 10

conn = mariadb.connect(
    user="root",
    password="root",
    host="127.0.0.1",
    port=3306,
    database="tat"
)

cur = conn.cursor()

def move(day_num, train, departure_station, arrival_station, capacity):
    today = datetime.datetime.now()
    time_shift = datetime.timedelta(days=day_num)
    target_day = today + time_shift
    target_departure = target_day.replace(hour=randint(0, 23), minute=randint(0, 3)*15, second=0)
    journey_length = randint(1, 8)
    time_shift = datetime.timedelta(hours=journey_length)
    target_arrival = target_departure + time_shift
    cur.execute("INSERT INTO journeys (departure_time, arrival_time, train, departure_station, arrival_station) VALUES (?, ?, ?, ?, ?)", (target_departure, target_arrival, train, departure_station, arrival_station))
    conn.commit()
    cur.execute("SELECT COUNT(*) FROM journeys")
    journey_id = cur.fetchone()[0]
    for i in range(capacity):
        cur.execute("INSERT INTO tickets (price, journey) VALUES (?, ?);", (randint(50, 100), journey_id))
    conn.commit()

cur.execute("SELECT id, capacity FROM trains")
trains = []
for train in cur:
    trains.append(train)

cur.execute("SELECT id FROM stations")
stations = []
for station in cur:
    stations.append(station[0])

for x in trains:
    sd, sa = choice(stations, size=2, replace=False)
    move(0, x[0], int(sd), int(sa), x[1])
    for i in range(1, DAYS_RANGE+1):
        sd, sa = choice(stations, size=2, replace=False)
        move(i, x[0], int(sd), int(sa), x[1])
        sd, sa = choice(stations, size=2, replace=False)
        move(i*-1, x[0], int(sd), int(sa), x[1])
    
conn.close()