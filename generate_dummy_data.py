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
YOUR_EMAIL = "l.skinner@eagles.oc.edu"

users_generated = 0
business_units_generated = 0
employees_generated = 0
positions_created = 0
shifts_generated = 0
tasklists_generated = 0
tasks_generated = 0
task_completions_generated = 0


def get_existing_user(email):
    r = requests.get(f'{ENDPOINT}/debug/bdiohjaiofjas/user/email', data = {
        "email": email,
        "password": SECRET_PASSWORD,
    }, verify=False)
    if r.status_code != 200:
        print("Error, couldn't get existing user...", r.text)
    return r.json()

def create_user(first_name, last_name, email, isAdmin):
    global users_generated
    
    # first see if the user exists, and if so, delete him.
    r = requests.get(f'{ENDPOINT}/debug/bdiohjaiofjas/user/email', data = {
        "email": email,
        "password": SECRET_PASSWORD,
    }, verify=False)
    if r.status_code == 200 and CLEANUP_OLD_ARTIFACTS:
        r = requests.delete(f'{ENDPOINT}/debug/bdiohjaiofjas/user/{r.json()["id"]}', data={"password": SECRET_PASSWORD}, verify=False)

    r = requests.post(f'{ENDPOINT}/debug/bdiohjaiofjas/user', data = {
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "isAdmin": 1 if isAdmin else 0,
        "password": SECRET_PASSWORD
    }, verify=False)
    if r.status_code == 200:
        users_generated += 1
    else:
        print('Hmm, we got an error creating user', r.text)

    return r.json()

def create_session(newToken, email, userId):
    r = requests.post(f'{ENDPOINT}/debug/bdiohjaiofjas/createSession', data = {
        "newToken": newToken,
        "email": email,
        "userId": userId,
        "password": SECRET_PASSWORD,
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
        print(startTime, endTime)

    return r.json()

def create_tasklist(businessUnitId, name):
    global tasklists_generated

    r = requests.post(f'{ENDPOINT}/tasklist', data = {
        "businessUnitId": businessUnitId,	
        "name": name,
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        tasklists_generated += 1
    else:
        print('Hmm, we got an error creating a tasklist', r.text)

    return r.json()

def create_task(taskListId, name, sequence_number):
    global tasks_generated

    r = requests.post(f'{ENDPOINT}/task', data = {
        "taskListId": taskListId,	
        "name": name,
        "sequenceNumber": sequence_number,
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        tasks_generated += 1
    else:
        print('Hmm, we got an error creating a task', r.text)

    return r.json()

def add_tasklist_to_shift(shift_id, task_list_id):
    r = requests.post(f'{ENDPOINT}/shift/{shift_id}/tasklist/{task_list_id}', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error creating a task', r.text)

    return r.json()

def add_task_completion(shift_id, task_id, check_off_employee_id, is_checked_off, time):
    global task_completions_generated
    # print("adding task completion to: ", task_id, shift_id, check_off_employee_id)
    r = requests.post(f'{ENDPOINT}/taskcompletion/', data = {
        "taskId": task_id,
        "shiftId": shift_id,
        "checkedOffEmployeeId": check_off_employee_id,
        "checkedOff": 1 if is_checked_off else 0,
        "time": time
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        task_completions_generated += 1
    else:
        print('Hmm, we got an error creating a task completion', r.text)

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
create_session("admin", yoda['email'], yoda['id'])
create_session("manager", obi_wan['email'], obi_wan['id'])
create_session("user", anakin['email'], anakin['id'])


# BusinessUnits, Employees, and Positions
sith_blue_milk_cafe = create_business_unit("Sith Blue Milk Cafe")
darth_vader_employee_id = create_employee(darth_vader['id'], sith_blue_milk_cafe['id'], 'SP26', True, 40, 0, True)
grevious_employee_id = create_employee(grevious['id'], sith_blue_milk_cafe['id'], 'SP26', True, 20, 0, False)
maul_employee_id = create_employee(maul['id'], sith_blue_milk_cafe['id'], 'SP26', False, 20, 0, False)
register_terror = create_position(sith_blue_milk_cafe['id'], "Register Terror", 10.00)
darth_barista = create_position(sith_blue_milk_cafe['id'], "Darth Barista", 12.00)
electric_back_bar = create_position(sith_blue_milk_cafe['id'], "Electric Back Bar", 10.00)
clean_up_cafe = create_tasklist(sith_blue_milk_cafe['id'], "Clean Up")
counters_task = create_task(clean_up_cafe['id'], 'Wipe down counters', 2)


jedi_fitness_center = create_business_unit("Jedi Fitness Center")
create_employee(obi_wan['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, True)
jaba_working_fitness_center = create_employee(jabba['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, False)
create_employee(ahsoka['id'], jedi_fitness_center['id'], 'SP26', True, 32, 0, False)
anakin_fitness_employee = create_employee(anakin['id'], jedi_fitness_center['id'], 'SP26', False, 40, 0, False)
gate_keeper = create_position(jedi_fitness_center['id'], "Gatekeeper", 10.00)
physical_form_coach = create_position(jedi_fitness_center['id'], "Master of Physical Forms", 10.00)
conditioning_specialist = create_position(jedi_fitness_center['id'], "Force Conditioning Specialist", 12.00)
wipe_equipment = create_tasklist(jedi_fitness_center['id'], "Wipe Down Equipment")
wipe_force_weights_task = create_task(wipe_equipment['id'], 'Wipe down force weights (1)', 1)
wipe_holo_bench_task = create_task(wipe_equipment['id'], 'Wipe down holo bench (3)', 3)
wipe_saber_trainer_task = create_task(wipe_equipment['id'], 'Wipe down saber trainer (2)', 2)


dexs_diner = create_business_unit("Dex's Diner") #https://starwars.fandom.com/wiki/Dex%27s_Diner/Legends
jabba_working_for_dex = create_employee(jabba['id'], dexs_diner['id'], 'SP26', True, 40, 0, False)
nerf_steak_chef = create_position(dexs_diner['id'], "Nerf Steak Chef", 10.00)


# Shifts:
TODAYS_DATE = str(datetime.today())[0:10]
shift1 = create_shift(darth_vader_employee_id['id'], sith_blue_milk_cafe['id'], darth_barista['id'], "8:00", "13:00", TODAYS_DATE, True)
shift2 = create_shift(darth_vader_employee_id['id'], sith_blue_milk_cafe['id'], electric_back_bar['id'], "8:00", "13:00", TODAYS_DATE, True)

add_tasklist_to_shift(shift1['id'], clean_up_cafe['id'])
add_tasklist_to_shift(shift2['id'], clean_up_cafe['id'])

# jabba's gotta make all that wealth somehow. Working crazy hours...
shift3 = create_shift(jaba_working_fitness_center['id'], jedi_fitness_center['id'], conditioning_specialist['id'], "8:00", "13:00", TODAYS_DATE, True)
shift4 = create_shift(jabba_working_for_dex['id'], dexs_diner['id'], nerf_steak_chef['id'], "14:00", "19:00", TODAYS_DATE, True)



if (YOUR_EMAIL):
    # add your user to some of these in order to have good dummy data for easy FE testing.
    your_user = get_existing_user(YOUR_EMAIL);
    your_users_employee = create_employee(your_user['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, False) # you work at the fitness center
    shift1 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], gate_keeper['id'], "8:00", "13:00", TODAYS_DATE, True)
    shift2 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], physical_form_coach['id'], "15:00", "17:00", TODAYS_DATE, True)
    shift3 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], conditioning_specialist['id'], "22:00", "22:59", TODAYS_DATE, True)
    shift4 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], gate_keeper['id'], "23:30", "23:59", TODAYS_DATE, True) # this is just here to test time zones

    add_tasklist_to_shift(shift1['id'], wipe_equipment['id'])
    add_task_completion(shift1['id'], wipe_force_weights_task['id'], anakin_fitness_employee['id'], True, "03:00") # Anakin is going to complete one task for you. 




print("Generated",users_generated,"Users.")
print("Generated",business_units_generated,"Business Units.")
print("Generated",employees_generated,"Employees.")
print("Generated",positions_created,"Positions.")
print("Generated",shifts_generated,"Shifts.")
print("Generated",tasklists_generated,"Tasklists.")
print("Generated",tasks_generated,"Tasks.")