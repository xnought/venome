import requests
import os

CONTENT = "From the [Venom Biochemistry & Molecular Biology Laboratory](https://venombiochemistrylab.weebly.com/) and predicted using [AlphaFold](https://github.com/google-deepmind/alphafold)."
REFS = ""
DIR = "./master_venom_galaxy"


def unzip_box():
    os.system(f"unzip {DIR}.zip")


def remove_box():
    os.system(f"rm -rf {DIR}")


def get_login_token():
    info = {
        "email": "test",
        "password": "test"
    }
    res = requests.post("http://localhost:8000/users/login", json=info)
    if res.json()['error']:
        print("Login error:", res.json()['error'])
        exit()
    return res.json()['token']


def upload_protein_file(path, name, species_name, content="", refs="", desc="", token=""):
    with open(path, "r") as f:
        pdb_file_str = f.read()
        payload = {
            "name": name,
            "species_name": species_name,
            "content": content,
            "refs": refs,
            "pdb_file_str": pdb_file_str,
            "description": desc,
        }
        out = requests.post("http://localhost:8000/protein/upload", json=payload, headers={

            "authorization":"Bearer {}".format(token)
        })
        return out


def upload_all():
    token=get_login_token()
    unzip_box()
    available_species = {
        "Gh": "ganaspis hookeri",
        "Lb": "leptopilina boulardi",
        "Lh": "leptopilina heterotoma",
        "*": "unknown",
    }
    for fn in os.listdir(DIR):
        if fn.endswith(".pdb"):
            full_path = os.path.join(DIR, fn)
            name = fn.split(".")[0].replace("_", " ")
            species_name = available_species[fn[:2]]
            upload_protein_file(
                full_path,
                name,
                species_name,
                content=CONTENT,
                refs=REFS,
                desc="from the venom lab at osu",
                token=token,
            )
            print("uploaded", full_path, name, species_name)
    remove_box()


upload_all()
