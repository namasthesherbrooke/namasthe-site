import csv
import json
import os
import re

csv_path = "/home/namasth/Bureau/recettes_avec_categories_et_saveurs.csv"
out_path = "/run/media/namasth/Coeur du site/Antigravity/Namasthé/site/app/data/recipes.json"

recipes = []
all_flavors = set()

def clean_flavor(f):
    f = f.strip()
    # Remove quotes, parentheses, prices
    f = re.sub(r'["\(\)]', '', f)
    f = re.sub(r'\d+\s*\$\s*', '', f)
    f = re.sub(r'(?i)collagène|hydratation', '', f).strip()
    if not f: return ""
    return f[0].upper() + f[1:].lower()

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        name = row.get('title', '').strip()
        if not name: continue
        
        base = row.get('categorie_principale', '').strip()
        flavors_str = row.get('saveurs', '')
        
        if '|' in flavors_str:
            flavors_list = flavors_str.split('|')
        else:
            flavors_list = flavors_str.split(',')
            
        cleaned_flavors = []
        for fl in flavors_list:
            c = clean_flavor(fl)
            if c:
                cleaned_flavors.append(c)
                all_flavors.add(c)
                
        unique_flavors = sorted(list(set(cleaned_flavors)))
        
        recipes.append({
            'id': row.get('recipe_id', str(i)),
            'name': name,
            'base': base,
            'flavors': unique_flavors,
            'ingredients': row.get('ingredients', '')
        })

with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(recipes, f, ensure_ascii=False, indent=2)

print(f"Successfully parsed {len(recipes)} recipes.")
print(f"Found {len(all_flavors)} unique flavors.")
