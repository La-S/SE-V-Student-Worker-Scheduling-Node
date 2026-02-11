import requests
import urllib3
from datetime import datetime
from dotenv import load_dotenv
import os

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()


ENDPOINT = "https://127.0.0.1:3133/workerscheduling-t3"
ADMIN_KEY = "admin"
CLEANUP_OLD_ARTIFACTS = True # if True, replaces all old users with new ones.
WIPE_DB = False # UNDER DEVELOPMENT (doesn't work): if True, fully resets the DB (expect sessions which allow this to work?) before putting this new data.
SECRET_PASSWORD = os.getenv("SECRET_PASSWORD")

users_generated = 0
business_units_generated = 0
employees_generated = 0
positions_created = 0
shifts_generated = 0


def create_user(first_name, last_name, email, isAdmin):
    global users_generated
    
    # first see if the user exists, and if so, delete him.
    r = requests.get(f'{ENDPOINT}/user/email', data = {
        "email": email,
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200 and CLEANUP_OLD_ARTIFACTS:
        r = requests.delete(f'{ENDPOINT}/user/{r.json()["id"]}', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})

    r = requests.post(f'{ENDPOINT}/user', data = {
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "isAdmin": 1 if isAdmin else 0
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        users_generated += 1
    else:
        print('Hmm, we got an error creating user', r.text)

    return r.json()

def create_session(newToken, email, userId, password):
    r = requests.post(f'{ENDPOINT}/debug/createSession/withPassword', data = {
        "newToken": newToken,
        "email": email,
        "userId": userId,
        "password": password,
    }, verify=False)
    if r.status_code != 200:
        print('Hmm, we got an error creating a session', r.text)

    return r.json()

def create_business_unit(name):
    global business_units_generated

    if CLEANUP_OLD_ARTIFACTS:
        r = requests.get(f'{ENDPOINT}/businessunit/all', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
        for artifact in r.json():
            if artifact["name"] == name:
                # if it's the same name, delete it.
                r = requests.delete(f'{ENDPOINT}/businessunit/{artifact["id"]}', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})

    r = requests.post(f'{ENDPOINT}/businessunit', data = {
        "name": name
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        business_units_generated += 1
    else:
        print('Hmm, we got an error creating business unit', r.text)

    return r.json()

def create_employee(userId, businessUnitId, semester, currentlyEmployed, maxWeeklyHours, minWeeklyHours, isManager):
    global employees_generated

    r = requests.post(f'{ENDPOINT}/employee', data = {
        "userId": userId,
        "businessUnitId": businessUnitId,
        "semester": semester,
        "currentlyEmployed": 1 if currentlyEmployed else 0,
        "maxWeeklyHours": maxWeeklyHours,
        "minWeeklyHours": minWeeklyHours,
        "isManager": 1 if isManager else 0
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        employees_generated += 1
    else:
        print('Hmm, we got an error creating employee', r.text)

    return r.json()

def create_position(businessUnitId, name, payRate):
    global positions_created

    r = requests.post(f'{ENDPOINT}/position', data = {
        "businessUnitId": businessUnitId,
        "name": name,
        "payRate": payRate,
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        positions_created += 1
    else:
        print('Hmm, we got an error creating a position', r.text)

    return r.json()

def create_shift(employeeId, businessUnitId, positionId, startTime, endTime, date, isPublished):
    global shifts_generated

    r = requests.post(f'{ENDPOINT}/shift', data = {
        "employeeId": employeeId,
        "businessUnitId": businessUnitId,	
        "positionId": positionId,
        "startTime": startTime,
        "endTime": endTime,
        "date": date,
        "published": 1 if isPublished else 0
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        shifts_generated += 1
    else:
        print('Hmm, we got an error creating a shift', r.text)

    return r.json()



# light side
yoda = create_user("Master", "Yoda", "yoda@jedimasters.com", True)
obi_wan = create_user("Obi", "Wan", "obi.wan@jedimasters.com", True)
anakin = create_user("Anakin", "Skywalker", "anakin.s@skywalkeracademy.net", False)
ahsoka = create_user("Ahsoka", "Tano", "ahsoka.t@padawan.com", False)

# neutral
jabba =create_user("Jabba", "TheHutt", "jabba@hutt.com", False)

# dark side
darth_vader = create_user("Darth", "Vader", "darthvader@empire.gov", False)

grevious = create_user("General", "Grevious", "general@separatist.org", False)
maul = create_user("Darth", "Maul", "darthmaul@empire.gov", False)


# set up sessions
create_session("admin", yoda['email'], yoda['id'], SECRET_PASSWORD)
create_session("manager", obi_wan['email'], obi_wan['id'], SECRET_PASSWORD)
create_session("user", anakin['email'], anakin['id'], SECRET_PASSWORD)


# BusinessUnits, Employees, and Positions
sith_blue_milk_cafe = create_business_unit("Sith Blue Milk Cafe")
create_employee(darth_vader['id'], sith_blue_milk_cafe['id'], 'SP26', True, 40, 0, True)
create_employee(grevious['id'], sith_blue_milk_cafe['id'], 'SP26', True, 20, 0, False)
create_employee(maul['id'], sith_blue_milk_cafe['id'], 'SP26', False, 20, 0, False)
register_terror = create_position(sith_blue_milk_cafe['id'], "Register Terror", 10.00)
darth_barista = create_position(sith_blue_milk_cafe['id'], "Darth Barista", 12.00)
electric_back_bar = create_position(sith_blue_milk_cafe['id'], "Electric Back Bar", 10.00)


jedi_fitness_center = create_business_unit("Jedi Fitness Center")
create_employee(obi_wan['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, True)
create_employee(jabba['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, False)
create_employee(ahsoka['id'], jedi_fitness_center['id'], 'SP26', True, 32, 0, False)
create_employee(anakin['id'], jedi_fitness_center['id'], 'SP26', False, 40, 0, False)
create_position(jedi_fitness_center['id'], "Gatekeeper", 10.00)
create_position(jedi_fitness_center['id'], "Master of Physical Forms", 10.00)
create_position(jedi_fitness_center['id'], "Force Conditioning Specialist", 12.00)

# Shifts:
TODAYS_DATE = str(datetime.today())[0:10]
create_shift(darth_vader['id'], sith_blue_milk_cafe['id'], darth_barista['id'], "8:00", "13:00", TODAYS_DATE, True)
# create_shift(darth_vader['id'], sith_blue_milk_cafe['id'], darth_barista['id'], "8:00", "13:00", TODAYS_DATE, True)




print("Generated",users_generated,"Users.")
print("Generated",business_units_generated,"Business Units.")
print("Generated",employees_generated,"Employees.")
print("Generated",positions_created,"Positions.")
print("Generated",shifts_generated,"Shifts.")