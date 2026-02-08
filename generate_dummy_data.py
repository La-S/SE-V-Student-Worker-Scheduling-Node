import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


ENDPOINT = "https://127.0.0.1:3133/workerscheduling-t3"
ADMIN_KEY = "admin"
CLEANUP_OLD_ARTIFACTS = True # if True, replaces all old users with new ones.
WIPE_DB = False # UNDER DEVELOPMENT (doesn't work): if True, fully resets the DB (expect sessions which allow this to work?) before putting this new data.

users_generated = 0
business_units_generated = 0
employees_generated = 0



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



# light side
obi_wan = create_user("Obi", "Wan", "obi.wan@jedimasters.com", True)
anakin = create_user("Anakin", "Skywalker", "anakin.s@skywalkeracademy.net", False)
ahsoka = create_user("Ahsoka", "Tano", "ahsoka.t@padawan.com", False)

# neutral
jabba =create_user("Jabba", "TheHutt", "jabba@hutt.com", False)

# dark side
darth_vader = create_user("Darth", "Vader", "darthvader@empire.gov", False)
grevious = create_user("General", "Grevious", "general@separatist.org", False)
maul = create_user("Darth", "Maul", "darthmaul@empire.gov", False)

# BusinessUnits & Employees
sith_blue_milk_cafe = create_business_unit("Sith Blue Milk Cafe")
create_employee(darth_vader['id'], sith_blue_milk_cafe['id'], 'SP26', True, 40, 0, True)
create_employee(grevious['id'], sith_blue_milk_cafe['id'], 'SP26', True, 20, 0, False)
create_employee(maul['id'], sith_blue_milk_cafe['id'], 'SP26', False, 20, 0, False)

jedi_fitness_center = create_business_unit("Jedi Fitness Center")
create_employee(obi_wan['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, True)
create_employee(jabba['id'], jedi_fitness_center['id'], 'SP26', True, 40, 0, False)
create_employee(ahsoka['id'], jedi_fitness_center['id'], 'SP26', True, 32, 0, False)
create_employee(anakin['id'], jedi_fitness_center['id'], 'SP26', False, 40, 0, False)


print("Generated",users_generated,"Users.")
print("Generated",business_units_generated,"Business Units.")
print("Generated",employees_generated,"Employees.")