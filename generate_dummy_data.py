import requests

ENDPOINT = "localhost:3123"

def create_user(first_name, last_name, email, role):
    r = requests.post(f'http://{ENDPOINT}/tracker-t3/users', data = {
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "role": role
        })
    if r.status_code != 200:
        print(r.text)
    else:
        print("200")

def create_team(name):
    r = requests.post(f'http://{ENDPOINT}/tracker-t3/team', data = {
        "name": name
        })
    print(r.status_code)



create_user("Lance", "Skinner", "l.skinner@eagles.oc.edu", "user")
create_user("Gus", "Cordero", "g.cordero@eagles.oc.edu", "user")
create_user("John", "Every", "j.every@eagles.oc.edu", "user")
create_user("Emily", "Forester", "e.forester@eagles.oc.edu", "user")
create_user("David", "North", "david.north@oc.edu", "admin")
create_team("Tackle Football")

