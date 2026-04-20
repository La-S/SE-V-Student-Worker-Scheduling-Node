import requests
import urllib3
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from tabulate import tabulate


urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

IS_PROD = False
YOUR_WORKER_EMAIL = "l.skinner@eagles.oc.edu"  # can be None...
YOUR_MANAGER_EMAIL = "jrevery03@gmail.com" # can also be None


ENDPOINT = "https://127.0.0.1:3133/workerscheduling-t3"
if (IS_PROD):
    ENDPOINT = "https://workerscheduling.eaglesoftwareteam.com/workerscheduling-t3"
ADMIN_KEY = "admin"
CLEANUP_OLD_ARTIFACTS = True # if True, replaces all old users with new ones.
WIPE_DB = False # UNDER DEVELOPMENT (doesn't work): if True, fully resets the DB (expect sessions which allow this to work?) before putting this new data.
SECRET_PASSWORD = os.getenv("SECRET_PASSWORD")


users_generated = 0
business_units_generated = 0
employees_generated = 0
positions_created = 0
shifts_generated = 0
tasklists_generated = 0
tasks_generated = 0
task_completions_generated = 0
avilability_templates_created = 0
weekly_schedule_templates_created = 0
weekly_schedule_templates_loaded = 0

employees = []
business_units = []



def create_or_get_existing_user(email):
    your_user = get_existing_user(email)
    if your_user.get('id'):
        return your_user
    # user doesn't exist yet.abs
    your_user = create_user("your", "user", email, False)
    return your_user


def get_existing_user(email):
    r = requests.get(f'{ENDPOINT}/debug/bdiohjaiofjas/user/email/{email}', json = {
        "password": SECRET_PASSWORD
    }, verify=False)
    if r.status_code != 200:
        print("Warning, couldn't find existing user...", r.text)
    return r.json()

def create_user(first_name, last_name, email, isAdmin):
    global users_generated
    
    # first see if the user exists, and if so, delete him.
    r = requests.get(f'{ENDPOINT}/debug/bdiohjaiofjas/user/email/{email}', json = {
        "password": SECRET_PASSWORD
    }, verify=False)
    if r.status_code == 200 and CLEANUP_OLD_ARTIFACTS:
        r = requests.delete(f'{ENDPOINT}/debug/bdiohjaiofjas/user/{r.json()["id"]}', json ={"password": SECRET_PASSWORD}, verify=False)

    r = requests.post(f'{ENDPOINT}/debug/bdiohjaiofjas/user', json = {
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
    r = requests.post(f'{ENDPOINT}/debug/bdiohjaiofjas/createSession', json = {
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

    r = requests.post(f'{ENDPOINT}/businessunit', json = {
        "name": name
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        business_units_generated += 1
    else:
        print('Hmm, we got an error creating business unit', r.text)

    return r.json()

def create_employee(userId, businessUnitId, semester, currentlyEmployed, maxWeeklyHours, minWeeklyHours, isManager):
    global employees_generated
    global employees

    r = requests.post(f'{ENDPOINT}/employee', json = {
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

    employees.append(r.json())
    return r.json()

def create_position(businessUnitId, name, payRate):
    global positions_created

    r = requests.post(f'{ENDPOINT}/position', json = {
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

    r = requests.post(f'{ENDPOINT}/shift', json = {
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

def getshift(shift_id):
    r = requests.get(f'{ENDPOINT}/shift/{shift_id}', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error getting shift for id', r.text)
    return r.json()

def create_tasklist(businessUnitId, name):
    global tasklists_generated

    r = requests.post(f'{ENDPOINT}/tasklist', json = {
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

    r = requests.post(f'{ENDPOINT}/task', json = {
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
        print('Hmm, we got an error adding a tasklist to a shift', r.text)

    return r.json()

def get_task_completion_id(shift_id):
    shift_data = getshift(shift_id)
    if (len(shift_data['taskList'][0]['tasks'][0]['taskcompletions']) == 0):
        raise Exception("Sorry, the shift has already started, so we can't add a taskcompletion to shiftId:", shift_id)
    return shift_data['taskList'][0]['tasks'][0]['taskcompletions'][0]['id']

def add_task_completion(shift_id, task_id, check_off_employee_id, is_checked_off, time):
    global task_completions_generated
    task_completion_id = 0;
    try:
        task_completion_id = get_task_completion_id(shift_id)
    except Exception as err:
        print(err)
        return

    # print("adding task completion to: ", task_id, shift_id, check_off_employee_id)
    r = requests.put(f'{ENDPOINT}/taskcompletion/{task_completion_id}', json = {
        "taskId": task_id,
        "shiftId": shift_id,
        "checkedOffEmployeeId": check_off_employee_id,
        "checkedOff": 1 if is_checked_off else 0,
        "time": time
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        task_completions_generated += 1
    else:
        print('Hmm, we got an error adding a task completion to a shift', r.text)

    return r.json()

def create_availability_template(user_id, day_of_week, start_time, end_time, preference):
    global avilability_templates_created
    r = requests.post(f'{ENDPOINT}/availabilitytemplate/', json = {
        "userId": user_id,
        "dayOfWeek": day_of_week, 
        "startTime": start_time,
        "endTime": end_time,
        "preference": preference
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        avilability_templates_created += 1
    else:
        print('Hmm, we got an error creating an availability template', r.text)
    return r.json()


def create_weekly_schedule_template_from_existing_shifts(name, business_unit_id, start_date):
    global weekly_schedule_templates_created
    r = requests.post(f'{ENDPOINT}/weeklyscheduletemplate/fromshifts', json = {
        "name": name,
        "businessUnitId": business_unit_id, 
        "startDate": start_date,
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        weekly_schedule_templates_created += 1
    else:
        print('Hmm, we got an error creating a weekly schedule template', r.text)
    return r.json()

def load_weekly_schedule_template_from_existing_shifts(template_id, business_unit_id, start_date, delete):
    global weekly_schedule_templates_loaded
    r = requests.post(f'{ENDPOINT}/weeklyscheduletemplate/loadshifts', json = {
        "id": template_id,
        "businessUnitId": business_unit_id,
        "startDate": start_date,
        "delete": delete,
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code == 200:
        weekly_schedule_templates_loaded += 1
    else:
        print('Hmm, we got an error loading a weekly schedule template', r.text)
    return r.json()

def give_employee_a_position(employee_id, position_id):
    r = requests.post(f'{ENDPOINT}/employee/{employee_id}/position/{position_id}', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error giving an employee a position', r.text)
    return r.json()

def create_cover_request(shift_id, requester_emp_id, request_posted_time, request_posted_date, note = None):
    r = requests.post(f'{ENDPOINT}/coverrequest', json = {
        "shiftId": shift_id,
        "requesterId": requester_emp_id,
        "requestPostedTime": request_posted_time,
        "requestPostedDate": request_posted_date,
        "note": note
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})

    if r.status_code != 200:
        print('Hmm, we got an error creating a cover request', r.text)
    return r.json()


def accept_cover_request(cover_req_id, accepter_emp_id):
    """
    EG: when another employee decides to work your shift for you.
    """
    r = requests.put(f'{ENDPOINT}/coverrequest/{cover_req_id}/accept/{accepter_emp_id}', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})

    if r.status_code != 200:
        print('Hmm, we got an error accepting a cover request', r.text)
    return r.json()

def approve_cover_request(cover_req_id, approver_emp_id, does_approve):
    """
    EG: when a manager approves your request
    """
    r = requests.put(f'{ENDPOINT}/coverrequest/{cover_req_id}/approve/{approver_emp_id}?approve={"true" if does_approve else "false"}', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})

    if r.status_code != 200:
        print('Hmm, we got an error approving a cover request', r.text)
    return r.json()

def create_drop_request(shift_id, requester_emp_id, request_posted_time, request_posted_date):
    r = requests.post(f'{ENDPOINT}/droprequest', json = {
        "shiftId": shift_id,
        "requesterId": requester_emp_id,
        "requestPostedTime": request_posted_time,
        "requestPostedDate": request_posted_date
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})

    if r.status_code != 200:
        print('Hmm, we got an error creating a drop request', r.text)
    return r.json()

def approve_drop_request(drop_req_id, approver_emp_id, does_approve):
    """
    EG: when a manager approves your request
    """
    r = requests.put(f'{ENDPOINT}/droprequest/{drop_req_id}/approve/{approver_emp_id}?approve={"true" if does_approve else "false"}', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})

    if r.status_code != 200:
        print('Hmm, we got an error approving a drop request', r.text)
    return r.json()

def create_announcement_to_business_unit(author_emp_id, business_unit_id, subject, body, post_date, post_time):
    r = requests.post(f'{ENDPOINT}/announcement', json = {
        "authorId": author_emp_id,
        "businessUnitId": business_unit_id,
        "subject": subject,
        "body": body,
        "postAtDate": post_date,
        "postAtTime": post_time,
        "priority": "low"
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error creating an announcement', r.text)
    return r.json()

def create_file(base64Data):
    r = requests.post(f'{ENDPOINT}/file', json = {
        "image": base64Data
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error creating a file', r.text)
    return r.json()

def link_file_and_announcement(ann_id, file_id):
    r = requests.post(f'{ENDPOINT}/announcementfile', json = {
        "announcementId": ann_id,
        "fileId": file_id
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error linking an announcement and file', r.text)
    return r.json()

def link_file_and_user(user_id, file_id):
    r = requests.post(f'{ENDPOINT}/userfile', json = {
        "userId": user_id,
        "fileId": file_id
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error linking a user and file', r.text)
    return r.json()

def time_off_request(requester_employee_id, posted_date, posted_time, start_date="2026-04-01", end_date="2026-08-14"):
    r = requests.post(f'{ENDPOINT}/timeoffrequest', json = {
        "requesterId": requester_employee_id,
        "requestPostedDate": posted_date,
        "requestPostedTime": posted_time,
        "startDate": start_date,
        "endDate": end_date
    }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error requesting time off', r.text)
    return r.json()

def create_setting(name, description, code, settings_type, default_value, int_min, int_max, is_for_business_unit, values = None):
    r = requests.post(f'{ENDPOINT}/setting', json = {
        "name": name,
        "description": description,
        "code": code,
        "type": settings_type,
        "defaultValue": default_value,
        "intMin": int_min,
        "intMax": int_max,
        "isForBusinessUnit": is_for_business_unit,
        "values": values,
        }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error creating a new setting', r.text)
    return r.json()

def get_setting_for_bu_by_code(businessUnitId, code):
    r = requests.get(f'{ENDPOINT}/businessunit/{businessUnitId}/setting/{code}', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error getting a setting', r.text)
    return r.json()

def delete_setting(code):
    r = requests.delete(f'{ENDPOINT}/setting/{code}', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error deleting a setting', r.text)
    return r.json()

def update_business_setting(setting_value_id, value):
    r = requests.put(f'{ENDPOINT}/businessunitsettingvalue/{setting_value_id}', json= {
        "settingValue": value
        }, verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error updating a setting', r.text)
    return r.json()

# light side
yoda = create_user("Master", "Yoda", "yoda@jedimasters.com", True)
obi_wan = create_user("Obi", "Wan", "obi.wan@jedimasters.com", True)
anakin = create_user("Anakin", "Skywalker", "anakin.s@skywalkeracademy.net", False)
ahsoka = create_user("Ahsoka", "Tano", "ahsoka.t@padawan.com", False)

# neutral
jabba =create_user("Jabba", "TheHutt", "jabba@hutt.com", False)
mando = create_user("Mando", "Lorian", "mando@thisistheway.org", False)

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
obi_wan_fitness_manager = create_employee(obi_wan['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, True)
jaba_working_fitness_center = create_employee(jabba['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, False)
ahsoka_fitness_employee = create_employee(ahsoka['id'], jedi_fitness_center['id'], 'SP26', True, 32, 0, False)
anakin_fitness_employee = create_employee(anakin['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, False)
gate_keeper = create_position(jedi_fitness_center['id'], "Gatekeeper", 10.00)
physical_form_coach = create_position(jedi_fitness_center['id'], "Master of Physical Forms", 10.00)
conditioning_specialist = create_position(jedi_fitness_center['id'], "Force Conditioning Specialist", 12.00)
wipe_equipment = create_tasklist(jedi_fitness_center['id'], "Wipe Down Equipment")
wipe_force_weights_task = create_task(wipe_equipment['id'], 'Wipe down force weights (1)', 1)
wipe_holo_bench_task = create_task(wipe_equipment['id'], 'Wipe down holo bench (3)', 3)
wipe_saber_trainer_task = create_task(wipe_equipment['id'], 'Wipe down saber trainer (2)', 2)
delete_setting("REMOTECLKIN")
create_setting("Allow Remote Clockin", "Allow users to clock in from their phone", "REMOTECLKIN", "boolean", 1, 0, 1, True)
remote_clockin_setting = get_setting_for_bu_by_code(jedi_fitness_center['id'], "REMOTECLKIN")
update_business_setting(remote_clockin_setting['id'], False) # disallow clockin via phone at the fitness center.

delete_setting("CLKINBUFF")
create_setting("Clock in Buffer", "Minutes to wait before sending an alert/marking an employee as late", "CLKINBUFF", "int", 3, 0, 15, True)
clockin_buffer_setting = get_setting_for_bu_by_code(jedi_fitness_center['id'], "CLKINBUFF")
update_business_setting(clockin_buffer_setting['id'], 2) # 2 minutes of buffer

delete_setting("STRSETT")
create_setting("Dummy String Setting", "Not Useful just for debugging", "STRSETT", "string", "a", 0, 3, True, ["a", "b", "c", "d"])
string_setting = get_setting_for_bu_by_code(jedi_fitness_center['id'], "STRSETT")
update_business_setting(string_setting['id'], "b") # set b as our value

dexs_diner = create_business_unit("Dex's Diner") #https://starwars.fandom.com/wiki/Dex%27s_Diner/Legends
jabba_working_for_dex = create_employee(jabba['id'], dexs_diner['id'], 'SP26', True, 40, 0, False)
mando_working_for_dex = create_employee(mando['id'], dexs_diner['id'], 'SP26', True, 40, 0, False)

nerf_steak_chef = create_position(dexs_diner['id'], "Nerf Steak Chef", 10.00)


# Shifts:
TODAYS_DATE = str(datetime.today())[0:10]
TOMORROWS_DATE = str(datetime.today()+timedelta(days=1))[0:10]
YESTERDAYS_DATE = str(datetime.today()+timedelta(days=-1))[0:10]
TWO_DAYS_AGO = str(datetime.today()+timedelta(days=-2))[0:10]

num_of_day_of_week = datetime.today().isoweekday()
MOST_RECENT_SUNDAY = str(datetime.today()-timedelta(days=num_of_day_of_week))[0:10]
NEXT_SUNDAY = str(datetime.today()-timedelta(days=num_of_day_of_week)+timedelta(days=7))[0:10]
shift1 = create_shift(darth_vader_employee_id['id'], sith_blue_milk_cafe['id'], darth_barista['id'], "8:00", "13:00", TODAYS_DATE, True)
shift2 = create_shift(darth_vader_employee_id['id'], sith_blue_milk_cafe['id'], electric_back_bar['id'], "8:00", "13:00", TODAYS_DATE, True)

add_tasklist_to_shift(shift1['id'], clean_up_cafe['id'])
add_tasklist_to_shift(shift2['id'], clean_up_cafe['id'])

# mando just is here to pick up odd jobs when jabba's out...
give_employee_a_position(mando_working_for_dex['id'], nerf_steak_chef['id'])


# jabba's gotta make all that wealth somehow. Working crazy hours...
create_availability_template(jabba['id'], "Monday", "06:00", "20:00", "available")
create_availability_template(jabba['id'], "Tuesday", "06:00", "20:00", "available")
create_availability_template(jabba['id'], "Wednesday", "06:00", "20:00", "available")
create_availability_template(jabba['id'], "Wednesday", "08:00", "10:00", "preferred")

create_availability_template(jabba['id'], "Wednesday", "05:00", "06:00", "preferred")# IDK if this should be legal. I think not...

create_availability_template(jabba['id'], "Thursday", "06:00", "20:00", "available")
create_availability_template(jabba['id'], "Friday", "06:00", "20:00", "available")
give_employee_a_position(jaba_working_fitness_center['id'], conditioning_specialist['id'])
give_employee_a_position(jabba_working_for_dex['id'], nerf_steak_chef['id'])
shift3 = create_shift(jaba_working_fitness_center['id'], jedi_fitness_center['id'], conditioning_specialist['id'], "20:00", "22:00", TODAYS_DATE, True)
shift4 = create_shift(jabba_working_for_dex['id'], dexs_diner['id'], nerf_steak_chef['id'], "14:00", "19:00", TODAYS_DATE, True)
# jabba wants off, but he's not going to get it, sorry bub
create_drop_request(shift3["id"], jabba_working_for_dex['id'], "12:00", TODAYS_DATE)
create_cover_request(shift4["id"], jabba_working_for_dex['id'], "12:00", TODAYS_DATE, "Sorry I wanted to go watch the sarlac")


# anakin works a lot
give_employee_a_position(anakin_fitness_employee['id'], gate_keeper['id'])
shift5 = create_shift(anakin_fitness_employee['id'], jedi_fitness_center['id'], gate_keeper['id'], "8:00", "11:00", TODAYS_DATE, True)
shift6 = create_shift(anakin_fitness_employee['id'], jedi_fitness_center['id'], gate_keeper['id'], "12:00", "14:00", TOMORROWS_DATE, True)
shift7 = create_shift(anakin_fitness_employee['id'], jedi_fitness_center['id'], gate_keeper['id'], "16:00", "19:00", TODAYS_DATE, True)
# whoops, anakin can't work this shift cause he's off chasing general grevious.
anakin_cover_request = create_cover_request(shift7["id"], anakin_fitness_employee['id'], "12:00", TODAYS_DATE, "gotta chase General Grevious")
accept_cover_request(anakin_cover_request["id"], ahsoka_fitness_employee['id'])
approve_cover_request(anakin_cover_request["id"], obi_wan_fitness_manager['id'], True)

# whoops, a planning mishap occurred. Anakin can't work another shift...
anakin_cover_request_2 = create_cover_request(shift6["id"], anakin_fitness_employee['id'], "12:00", TODAYS_DATE, "planning mishap, sorry")
accept_cover_request(anakin_cover_request_2["id"], ahsoka_fitness_employee['id'])
approve_cover_request(anakin_cover_request_2["id"], obi_wan_fitness_manager['id'], True)
# yikes, Ahsoka can't work it either...
ahsoka_cover_request = create_cover_request(shift6["id"], ahsoka_fitness_employee['id'], "12:05", TODAYS_DATE, "yikes, another planning mishap, I can't take this shift either.")

# ahsoka likes to work but has classes
create_availability_template(ahsoka['id'], "Monday", "09:00", "11:00", "unavailable")
create_availability_template(ahsoka['id'], "Monday", "12:00", "3:30", "unavailable")
create_availability_template(ahsoka['id'], "Tuesday", "8:00", "12:00", "unavailable")
create_availability_template(ahsoka['id'], "Wednesday", "09:00", "11:00", "unavailable")
create_availability_template(ahsoka['id'], "Wednesday", "12:00", "3:30", "unavailable")
create_availability_template(ahsoka['id'], "Thursday", "8:00", "12:09", "unavailable")
create_availability_template(ahsoka['id'], "Friday", "09:00", "11:00", "unavailable")
create_availability_template(ahsoka['id'], "Friday", "12:00", "3:30", "unavailable")
give_employee_a_position(ahsoka_fitness_employee['id'], conditioning_specialist['id'])
shift8 = create_shift(ahsoka_fitness_employee['id'], jedi_fitness_center['id'], conditioning_specialist['id'], "7:30", "10:00", TODAYS_DATE, True)
shift9 = create_shift(ahsoka_fitness_employee['id'], jedi_fitness_center['id'], conditioning_specialist['id'], "13:00", "15:00", TODAYS_DATE, True)
shift10 = create_shift(ahsoka_fitness_employee['id'], jedi_fitness_center['id'], conditioning_specialist['id'], "20:00", "21:00", TODAYS_DATE, True)
shift11 = create_shift(ahsoka_fitness_employee['id'], jedi_fitness_center['id'], conditioning_specialist['id'], "21:30", "22:00", TODAYS_DATE, True)
# ahsoka has jedi training during shifts 9, 10, and 11 and has to drop them.
dr_1 = create_drop_request(shift9["id"], ahsoka_fitness_employee['id'], "12:05", TODAYS_DATE)
dr_2 = create_drop_request(shift10["id"], ahsoka_fitness_employee['id'], "12:05", TODAYS_DATE)
dr_3 = create_drop_request(shift11["id"], ahsoka_fitness_employee['id'], "12:05", TODAYS_DATE)
# obi wan approves 9, disapproves 10, and ignores 11
approve_drop_request(dr_1["id"], obi_wan_fitness_manager["id"], True)
approve_drop_request(dr_2["id"], obi_wan_fitness_manager["id"], False)

if (YOUR_WORKER_EMAIL):
    # add your user to some of these in order to have good dummy data for easy FE testing.
    your_user = create_or_get_existing_user(YOUR_WORKER_EMAIL)
    if not your_user.get('id'):
        print("WARNING, we couldn't add data to your user. Log in on the FE once first!")
    else:
        your_users_employee = create_employee(your_user['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, False) # you work at the fitness center
        give_employee_a_position(your_users_employee['id'], gate_keeper['id'])
        give_employee_a_position(your_users_employee['id'], physical_form_coach['id'])
        give_employee_a_position(your_users_employee['id'], conditioning_specialist['id'])
        shift0 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], gate_keeper['id'], "1:00", "3:00", YESTERDAYS_DATE, True)
        shift1 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], gate_keeper['id'], "8:00", "13:00", TODAYS_DATE, True)
        shift2 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], physical_form_coach['id'], "15:00", "17:00", TODAYS_DATE, True)
        shift3 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], conditioning_specialist['id'], "22:00", "22:59", TODAYS_DATE, True)
        shift4 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], gate_keeper['id'], "23:30", "23:59", TODAYS_DATE, True) # this is just here to test time zones
        shift5 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], gate_keeper['id'], "8:00", "13:00", TOMORROWS_DATE, True)

        add_tasklist_to_shift(shift0['id'], wipe_equipment['id'])
        add_tasklist_to_shift(shift1['id'], wipe_equipment['id'])
        add_task_completion(shift1['id'], wipe_force_weights_task['id'], anakin_fitness_employee['id'], True, "14:00") # Anakin is going to complete one task for you. 
        add_tasklist_to_shift(shift5['id'], wipe_equipment['id'])
        add_task_completion(shift5['id'], wipe_force_weights_task['id'], anakin_fitness_employee['id'], True, "03:00") # Anakin is going to complete one task for you. 


# Announcements
ann = create_announcement_to_business_unit(obi_wan_fitness_manager["id"], jedi_fitness_center["id"], "Hello There!", "In the wise words of master Yoda: 'Attachment leads to jealousy. The shadow of greed, that is.'", "2026-04-02", "17:25")
# HighGround.png
file_data = create_file("{\"name\":\"IMG_5566.jpeg\",\"mimeType\":\"image/jpeg\", \"dataUrl\":\"data:image/jpeg;base64,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IvE5MJhZbLfbVPgfBkpqwqbfcvzlUJHluAXQeq8/rike/6gILg6KdqIDEO3+p/YkQAIk0IwAFtftGZf4fMwR79PsZYYHWJn/8LOS/AnE8LXrEq4AfhhRgMWWNe6wvcROtJQNrRgdgNB2LRUjARIggewJYD59sBJ3Hoz/ztnmhsV/6FNJnlYhgpt9uz6lRC63rRWRjS6LUNi2qavl6AB0NXHWRwIkQAJ5SgAr/c1CvxdgHLfItokw/r/HPv/Tx4rADndPGiLeywg8zLKpHToORqRjNxvZsMrQAQhrz1IvEiABEsiCwHyJT8R++kdhGIuyyJYWRej99oGSPKuim0b+DduLU4Zubvh7W98R6YC/Et1EByC6fU/NSYAESCBNAJf6XAdjcEe21+3W4dM/HyjexfmC0kQBEI1427I9Iy3lQilGByCU3UqlSIAESMCOgJnzhyG40k56sxRG/R62+v0IW/1+tflpfnzD+gWrc/8ht2t+tLh7WkEHoHu4s1YSIAESyAsCMII/z37kr6t90Sdgq9/9eaFEk0b4kvyrcVCaPG72KyIF3bJYsVlDuukBHYBuAs9qSYAESCBPCByQXTv0SqzyO3KwpKZnl6/rpHFE8CrU9rRFjVncKGhRWsBE6AAErMPYXBIgARLoRgIfeeINHizegm5sg1XVGNpPyyQImcmZZML8ng5AmHuXupEACZBAZgKvZxZJS0AuORBX8f7HUr5bxeCkvIQQ/0WtNcK8MzKtvY/Cc0z/MJEACZAACUSVQN3BPzKnrXUAmE9/pkq8U44RWR80TvPEPRwjXXPoz4EweA4M/wITHYi68Tf9SAcgaH/NbC8JkAAJdDIBOAFXwBhc39wJ0LCVctsS8X7enQf8dLK6LG4jAToA/FMgARIgARKQjZEA7AiQ+kWBr2O0fBP2+M8jHhIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIg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\"}")
ann_2 = create_announcement_to_business_unit(obi_wan_fitness_manager["id"], jedi_fitness_center["id"], "Anakin, don't", "Guess who has the high ground...", "2026-04-02", "17:25")
link_file_and_announcement(ann_2['id'], file_data['id'])


# User File - Cert.png
file_data_2 = create_file("{\"name\":\"IMG_5566.jpeg\",\"mimeType\":\"image/jpeg\", \"dataUrl\":\"data:image/jpeg;base64,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IAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQiE7g/wNEwQNT2gRvqwAAAABJRU5ErkJggg==\"}")
link_file_and_user(anakin['id'], file_data_2['id'])


if (YOUR_MANAGER_EMAIL and not IS_PROD):
    # make him a manager
    your_user = create_or_get_existing_user(YOUR_MANAGER_EMAIL);
    if not your_user.get('id'):
        print(f"WARNING, we couldn't add data to your manager user {YOUR_MANAGER_EMAIL}. Log in on the FE once first!")
    else:
        your_users_employee = create_employee(your_user['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, True) # you work at the fitness center


template = create_weekly_schedule_template_from_existing_shifts("Jedi Fitness Original Snapshot", jedi_fitness_center['id'], MOST_RECENT_SUNDAY)
tmp_loaded = load_weekly_schedule_template_from_existing_shifts(template['id'], jedi_fitness_center['id'], NEXT_SUNDAY, False)


# For prod dummy data...

if (IS_PROD):
    your_user = create_or_get_existing_user("emily.forster@eagles.oc.edu");
    your_users_employee = create_employee(your_user['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, False) # you work at the fitness center

    give_employee_a_position(your_user['id'], gate_keeper['id'])
    give_employee_a_position(your_user['id'], physical_form_coach['id'])
    give_employee_a_position(your_user['id'], conditioning_specialist['id'])
    shift1 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], gate_keeper['id'], "6:00", "7:30", TODAYS_DATE, True)
    shift2 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], physical_form_coach['id'], "12:00", "14:00", TODAYS_DATE, True)
    shift3 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], conditioning_specialist['id'], "22:00", "22:59", TODAYS_DATE, True)
    shift4 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], gate_keeper['id'], "21:30", "23:59", TOMORROWS_DATE, True) # this is just here to test time zones
    shift5 = create_shift(your_users_employee['id'], jedi_fitness_center['id'], gate_keeper['id'], "6:00", "7:30", TOMORROWS_DATE, True)

    # # make him a manager on prod.
    your_user = create_or_get_existing_user("gusify@gmail.com")
    your_users_employee = create_employee(your_user['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, True) # you work at the fitness center

    # make him a manager
    your_user = create_or_get_existing_user("okcbroncoshomeschool@gmail.com");
    your_users_employee = create_employee(your_user['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, True) # you work at the fitness center




print("Generated",users_generated,"Users.")
print("Generated",business_units_generated,"Business Units.")
print("Generated",employees_generated,"Employees.")
print("Generated",positions_created,"Positions.")
print("Generated",shifts_generated,"Shifts.")
print("Generated",tasklists_generated,"Tasklists.")
print("Generated",tasks_generated,"Tasks.")
print("Generated",avilability_templates_created,"Availability Templates.")
print("Generated",weekly_schedule_templates_created,"Weekly Schedule Templates")
print("Loaded",weekly_schedule_templates_loaded,"Weekly Schedule Templates")

print("Thank you for using Dummy Data! Now, work quickly, you must. To bring balance to the schedule.")
print("Important Info:\n")
# print("Sith Blue Milk Cafe Id:\t", sith_blue_milk_cafe['id'])
# print("Jedi Fitness Center Id:\t", jedi_fitness_center['id'])
# print("Dex's Diner Id:\t\t", dexs_diner['id'])

print(tabulate([["Sith Blue Milk Cafe", sith_blue_milk_cafe['id']], ["Jedi Fitness Center", jedi_fitness_center['id']], ["Dex's Diner", dexs_diner['id']]], headers=["business_unit", "id"]))
print()
print(tabulate([
    ["Obi Wan", obi_wan_fitness_manager['id'], obi_wan_fitness_manager["isManager"] == "1"], 
    ["Ahsoka", ahsoka_fitness_employee['id'], ahsoka_fitness_employee['isManager'] == "1"], 
    ["Anakin", anakin_fitness_employee['id'], anakin_fitness_employee['isManager'] == "1"],
    ["Jabba for dex", jabba_working_for_dex['id'], jabba_working_for_dex['isManager'] == "1"],
    ["Jabba for jedi fitness", jaba_working_fitness_center['id'], jaba_working_fitness_center['isManager'] == "1"],
    ["Mando", mando_working_for_dex['id'], mando_working_for_dex['isManager'] == "1"],

], headers=["employee", "id", "is_manager"]))

# print("Employees")
# print("Sith Blue Milk Cafe Id:\t", sith_blue_milk_cafe['id'])
# print("Jedi Fitness Center Id:\t", jedi_fitness_center['id'])
# print("Dex's Diner Id:\t\t", dexs_diner['id'])