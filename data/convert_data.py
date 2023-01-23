import datetime
import json
import random

with open("output.json", "r") as f:
    data = json.load(f)

out = {
    "fetch_date": int(datetime.datetime.now().timestamp()),
    "products": [],
    "categories": [],
}

prods = data["context"]["MAPP_PRODUCTS"]["result"]["products"]
cats = data["context"]["MAPP_PRODUCTS"]["result"]["categories"]

out["categories"] = cats

for i in enumerate(prods):
    prod = {
        "id": i,
        "name": prods[i]["name"],
        "image": prods[i]["image"],
        "category": prods[i]["category"][0],
        "subcategory": prods[i]["category"][1],
    }
    for k in prods[i]["prices"]:
        if k["price"] == 0:
            continue
        prod["price"] = k["price"]
        break
    else:
        prod["price"] = round(random.uniform(0.4, 50), 2)

    out["products"].append(prod)


with open("newres.json", "w") as f:
    json.dump(out, f, ensure_ascii=False)
