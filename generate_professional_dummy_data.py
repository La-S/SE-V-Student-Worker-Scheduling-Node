import requests
import urllib3
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

IS_PROD = True
YOUR_WORKER_EMAIL = "l.skinner@eagles.oc.edu"  # can be None...
YOUR_MANAGER_EMAIL = "okcbroncoshomeschool@gmail.com" # can also be None


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



def create_or_get_existing_user(email):
    your_user = get_existing_user(email)
    if your_user.get('id'):
        return your_user
    # user doesn't exist yet.abs
    your_user = create_user("your", "user", email, False)
    return your_user


def get_existing_user(email):
    r = requests.get(f'{ENDPOINT}/debug/bdiohjaiofjas/user/email/{email}', data = {
        "password": SECRET_PASSWORD
    }, verify=False)
    if r.status_code != 200:
        print("Warning, couldn't find existing user...", r.text)
    return r.json()

def create_user(first_name, last_name, email, isAdmin):
    global users_generated
    
    # first see if the user exists, and if so, delete him.
    r = requests.get(f'{ENDPOINT}/debug/bdiohjaiofjas/user/email/{email}', data = {
        "password": SECRET_PASSWORD
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

def delete_business_unit(name):
    print("trying to delete ", name)
    r = requests.get(f'{ENDPOINT}/businessunit/all', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    for artifact in r.json():
        print("artifact deleted:", artifact)
        if artifact["name"] == name:
            # if it's the same name, delete it.
            r = requests.delete(f'{ENDPOINT}/businessunit/{artifact["id"]}', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})


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

def getshift(shift_id):
    r = requests.get(f'{ENDPOINT}/shift/{shift_id}', verify=False, headers={'Authorization': f'Bearer {ADMIN_KEY}'})
    if r.status_code != 200:
        print('Hmm, we got an error getting shift for id', r.text)
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
    r = requests.put(f'{ENDPOINT}/taskcompletion/{task_completion_id}', data = {
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
    r = requests.post(f'{ENDPOINT}/availabilitytemplate/', data = {
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
    r = requests.post(f'{ENDPOINT}/weeklyscheduletemplate/fromshifts', data = {
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
    r = requests.post(f'{ENDPOINT}/weeklyscheduletemplate/loadshifts', data = {
        "id": template_id,
        "businessUnitId": business_unit_id,
        "startDate": start_date,
        "delete": delete
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

delete_business_unit("Jedi Fitness Center")


# light side
Brian = create_user("Brian", "Smith", "brian.smith@gmail.com", False)
Ben = create_user("Ben", "Kenobi", "ben.kenobi@gmail.com", False)
Leia = create_user("Leia", "South", "leia@gmail.com", False)
Luke = create_user("Luke", "South", "luke@gmail.com", False)

# neutral
Han =create_user("Han", "Solo", "han@gmail.com", False)

# dark side
Cody = create_user("Cody", "Smith", "cody@gmail.com", False)

Ezra = create_user("Ezra", "Johnson", "Ezra@gmail.com", False)
Lando = create_user("Lando", "Calrissian", "lando@gmail.com", False)

# set up sessions
create_session("admin", Luke['email'], Luke['id'])
# create_session("manager", obi_wan['email'], obi_wan['id'])
# create_session("user", anakin['email'], anakin['id'])


# BusinessUnits, Employees, and Positions
the_brew = create_business_unit("The Brew")
brian_employee_id = create_employee(Brian['id'], the_brew['id'], 'SP26', True, 40, 0, False)
ben_employee_id = create_employee(Ben['id'], the_brew['id'], 'SP26', True, 20, 0, False)
leia_employee_id = create_employee(Leia['id'], the_brew['id'], 'SP26', True, 20, 0, False)
luke_employee_id = create_employee(Luke['id'], the_brew['id'], 'SP26', True, 20, 0, False)
han_employee_id = create_employee(Han['id'], the_brew['id'], 'SP26', True, 20, 0, False)
cody_employee_id = create_employee(Cody['id'], the_brew['id'], 'SP26', True, 20, 0, False)
bar_back = create_position(the_brew['id'], "Bar Back", 10.00)
barista = create_position(the_brew['id'], "Barista", 12.00)
cashier = create_position(the_brew['id'], "Cashier", 10.00)
clean_up_cafe = create_tasklist(the_brew['id'], "Clean Up")
counters_task = create_task(clean_up_cafe['id'], 'Wipe down counters', 2)
clean_machines_task = create_task(clean_up_cafe['id'], 'Clean machines', 1)

the_dub = create_business_unit("The Dub")
# create_employee(obi_wan['id'], the_brew['id'], 'SP26', True, 40, 0, True)
# jaba_working_fitness_center = create_employee(jabba['id'], the_brew['id'], 'SP26', True, 40, 0, False)
# ahsoka_fitness_employee = create_employee(ahsoka['id'], the_brew['id'], 'SP26', True, 32, 0, False)
# anakin_fitness_employee = create_employee(anakin['id'], the_brew['id'], 'SP26', True, 40, 0, False)
# gate_keeper = create_position(the_brew['id'], "Gatekeeper", 10.00)
# physical_form_coach = create_position(the_brew['id'], "Master of Physical Forms", 10.00)
# conditioning_specialist = create_position(the_brew['id'], "Force Conditioning Specialist", 12.00)
# wipe_equipment = create_tasklist(the_brew['id'], "Wipe Down Equipment")
# wipe_force_weights_task = create_task(wipe_equipment['id'], 'Wipe down force weights (1)', 1)
# wipe_holo_bench_task = create_task(wipe_equipment['id'], 'Wipe down holo bench (3)', 3)
# wipe_saber_trainer_task = create_task(wipe_equipment['id'], 'Wipe down saber trainer (2)', 2)


# dexs_diner = create_business_unit("Dex's Diner") #https://starwars.fandom.com/wiki/Dex%27s_Diner/Legends
# jabba_working_for_dex = create_employee(jabba['id'], dexs_diner['id'], 'SP26', True, 40, 0, False)
# nerf_steak_chef = create_position(dexs_diner['id'], "Nerf Steak Chef", 10.00)

# Shifts:
TODAYS_DATE = str(datetime.today())[0:10]
TOMORROWS_DATE = str(datetime.today()+timedelta(days=1))[0:10]
YESTERDAYS_DATE = str(datetime.today()+timedelta(days=-1))[0:10]
TWO_DAYS_AGO = str(datetime.today()+timedelta(days=-2))[0:10]

num_of_day_of_week = datetime.today().isoweekday()
MOST_RECENT_SUNDAY = str(datetime.today()-timedelta(days=num_of_day_of_week))[0:10]
NEXT_SUNDAY = str(datetime.today()-timedelta(days=num_of_day_of_week)+timedelta(days=7))[0:10]
shift1 = create_shift(leia_employee_id['id'], the_brew['id'], barista['id'], "8:00", "13:00", TODAYS_DATE, True)
shift2 = create_shift(ben_employee_id['id'], the_brew['id'], cashier['id'], "7:00", "12:00", TODAYS_DATE, True)
shift3 = create_shift(cody_employee_id['id'], the_brew['id'], bar_back['id'], "8:30", "15:00", TODAYS_DATE, True)


add_tasklist_to_shift(shift1['id'], clean_up_cafe['id'])
add_tasklist_to_shift(shift3['id'], clean_up_cafe['id'])


# jabba's gotta make all that wealth somehow. Working crazy hours...
# create_availability_template(jabba['id'], "Monday", "06:00", "20:00", "available")
# create_availability_template(jabba['id'], "Tuesday", "06:00", "20:00", "available")
# create_availability_template(jabba['id'], "Wednesday", "06:00", "20:00", "available")
# create_availability_template(jabba['id'], "Wednesday", "08:00", "10:00", "preferred")

# create_availability_template(jabba['id'], "Wednesday", "05:00", "06:00", "preferred")# IDK if this should be legal. I think not...

# create_availability_template(jabba['id'], "Thursday", "06:00", "20:00", "available")
# create_availability_template(jabba['id'], "Friday", "06:00", "20:00", "available")
# give_employee_a_position(jaba_working_fitness_center['id'], conditioning_specialist['id'])
# give_employee_a_position(jabba_working_for_dex['id'], nerf_steak_chef['id'])
# shift3 = create_shift(jaba_working_fitness_center['id'], the_brew['id'], conditioning_specialist['id'], "8:00", "13:00", TODAYS_DATE, True)
# shift4 = create_shift(jabba_working_for_dex['id'], dexs_diner['id'], nerf_steak_chef['id'], "14:00", "19:00", TODAYS_DATE, True)


# ben works a lot
give_employee_a_position(ben_employee_id['id'], cashier['id'])

shift5 = create_shift(ben_employee_id['id'], the_brew['id'], cashier['id'], "16:00", "18:00", TODAYS_DATE, True)
shift6 = create_shift(ben_employee_id['id'], the_brew['id'], cashier['id'], "20:15", "21:10", TODAYS_DATE, True)
shift6 = create_shift(ben_employee_id['id'], the_brew['id'], cashier['id'], "10:30", "15:10", TOMORROWS_DATE, True)
shift6 = create_shift(ben_employee_id['id'], the_brew['id'], cashier['id'], "7:15", "9:10", YESTERDAYS_DATE, True)

# shift7 = create_shift(ben_employee_id['id'], the_brew['id'], cashier['id'], "16:00", "19:00", TODAYS_DATE, True)

give_employee_a_position(leia_employee_id['id'], barista['id'])
give_employee_a_position(cody_employee_id['id'], bar_back['id'])

# ahsoka likes to work but has classes
# create_availability_template(ahsoka['id'], "Monday", "09:00", "11:00", "unavailable")
# create_availability_template(ahsoka['id'], "Monday", "12:00", "3:30", "unavailable")
# create_availability_template(ahsoka['id'], "Tuesday", "8:00", "12:00", "unavailable")
# create_availability_template(ahsoka['id'], "Wednesday", "09:00", "11:00", "unavailable")
# create_availability_template(ahsoka['id'], "Wednesday", "12:00", "3:30", "unavailable")
# create_availability_template(ahsoka['id'], "Thursday", "8:00", "12:09", "unavailable")
# create_availability_template(ahsoka['id'], "Friday", "09:00", "11:00", "unavailable")
# create_availability_template(ahsoka['id'], "Friday", "12:00", "3:30", "unavailable")
# give_employee_a_position(ahsoka_fitness_employee['id'], conditioning_specialist['id'])
# shift8 = create_shift(ahsoka_fitness_employee['id'], the_brew['id'], conditioning_specialist['id'], "7:30", "10:00", TODAYS_DATE, True)
# shift9 = create_shift(ahsoka_fitness_employee['id'], the_brew['id'], conditioning_specialist['id'], "11:00", "15:00", TODAYS_DATE, True)
# shift10 = create_shift(ahsoka_fitness_employee['id'], the_brew['id'], conditioning_specialist['id'], "20:00", "21:00", TODAYS_DATE, True)

# if (YOUR_WORKER_EMAIL):
#     # add your user to some of these in order to have good dummy data for easy FE testing.
#     your_user = create_or_get_existing_user(YOUR_WORKER_EMAIL)
#     if not your_user.get('id'):
#         print("WARNING, we couldn't add data to your user. Log in on the FE once first!")
#     else:
#         your_users_employee = create_employee(your_user['id'], the_brew['id'], 'SP26', True, 40, 0, False) # you work at the fitness center
#         give_employee_a_position(your_users_employee['id'], barista['id'])
#         # give_employee_a_position(your_users_employee['id'], physical_form_coach['id'])
#         # give_employee_a_position(your_users_employee['id'], conditioning_specialist['id'])
#         shift0 = create_shift(your_users_employee['id'], the_brew['id'], barista['id'], "1:00", "3:00", YESTERDAYS_DATE, True)
#         shift1 = create_shift(your_users_employee['id'], the_brew['id'], barista['id'], "14:00", "16:00", TODAYS_DATE, True)
#         shift2 = create_shift(your_users_employee['id'], the_brew['id'], barista['id'], "17:00", "19:00", TODAYS_DATE, True)
#         shift3 = create_shift(your_users_employee['id'], the_brew['id'], barista['id'], "20:00", "22:59", TODAYS_DATE, True)
#         shift4 = create_shift(your_users_employee['id'], the_brew['id'], barista['id'], "23:30", "23:59", TODAYS_DATE, True) # this is just here to test time zones
#         shift5 = create_shift(your_users_employee['id'], the_brew['id'], barista['id'], "8:00", "13:00", TOMORROWS_DATE, True)

#         add_tasklist_to_shift(shift0['id'], wipe_equipment['id'])
#         add_tasklist_to_shift(shift1['id'], wipe_equipment['id'])
#         add_task_completion(shift1['id'], wipe_force_weights_task['id'], anakin_fitness_employee['id'], True, "14:00") # Anakin is going to complete one task for you. 
#         add_tasklist_to_shift(shift5['id'], wipe_equipment['id'])
#         add_task_completion(shift5['id'], wipe_force_weights_task['id'], anakin_fitness_employee['id'], True, "03:00") # Anakin is going to complete one task for you. 

# if (YOUR_MANAGER_EMAIL and not IS_PROD):
#     # make him a manager
#     your_user = create_or_get_existing_user(YOUR_MANAGER_EMAIL);
#     if not your_user.get('id'):
#         print(f"WARNING, we couldn't add data to your manager user {YOUR_MANAGER_EMAIL}. Log in on the FE once first!")
#     else:
#         your_users_employee = create_employee(your_user['id'], the_brew['id'], 'SP26', True, 40, 0, True) # you work at the fitness center


# template = create_weekly_schedule_template_from_existing_shifts("Jedi Fitness Original Snapshot", the_brew['id'], MOST_RECENT_SUNDAY)
# tmp_loaded = load_weekly_schedule_template_from_existing_shifts(template['id'], the_brew['id'], NEXT_SUNDAY, False)


# For prod dummy data...

if (IS_PROD):
    your_user = create_or_get_existing_user("l.skinner@eagles.oc.edu");
    your_users_employee = create_employee(your_user['id'], the_brew['id'], 'SP26', True, 40, 0, False) # you work at the fitness center

    give_employee_a_position(your_user['id'], barista['id'])
    # give_employee_a_position(your_user['id'], physical_form_coach['id'])
    # give_employee_a_position(your_user['id'], conditioning_specialist['id'])
    shift1 = create_shift(your_users_employee['id'], the_brew['id'], barista['id'], "6:00", "7:30", TODAYS_DATE, True)
    shift2 = create_shift(your_users_employee['id'], the_brew['id'], barista['id'], "16:00", "18:00", TODAYS_DATE, True)
    shift3 = create_shift(your_users_employee['id'], the_brew['id'], barista['id'], "22:10", "22:55", TODAYS_DATE, True)
    # shift4 = create_shift(your_users_employee['id'], the_brew['id'], gate_keeper['id'], "21:30", "23:59", TOMORROWS_DATE, True) # this is just here to test time zones
    # shift5 = create_shift(your_users_employee['id'], the_brew['id'], gate_keeper['id'], "6:00", "7:30", TOMORROWS_DATE, True)

    # # make him a manager on prod.
    your_user = create_or_get_existing_user("gusify@gmail.com")
    your_users_employee = create_employee(your_user['id'], the_brew['id'], 'SP26', True, 40, 0, True) # you work at the fitness center

    # make him a manager
    your_user = create_or_get_existing_user("okcbroncoshomeschool@gmail.com");
    your_users_employee = create_employee(your_user['id'], the_brew['id'], 'SP26', True, 40, 0, True) # you work at the fitness center





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
print("Important Info:")
print("The brew:\t", the_brew['id'])
# print("Jedi Fitness Center Id:\t", the_brew['id'])
# print("Dex's Diner Id:\t\t", dexs_diner['id'])