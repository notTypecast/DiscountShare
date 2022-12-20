import json
from datetime import datetime, timedelta
from random import gauss

with open("newres.json", "r") as f:
    data = json.load(f)

out = {
    "fetch_date": data["fetch_date"],
    "data": []
}

c_date = datetime.fromtimestamp(data["fetch_date"])


dates_desc = []
for i in range(7):
    dates_desc.append(datetime.strftime(c_date, "%Y-%m-%d"))
    c_date -= timedelta(days=1)

for product in data["products"]:
    out["data"].append({
        "id": product["id"],
        "name": product["name"],
        "prices": []
    })

    p = product["price"]
    for d in dates_desc:
        p += gauss(0, 0.02)
        p = round(p, 2)
        out["data"][-1]["prices"].append({
            "date": d,
            "price": p
        })

with open("price_history.json", "w") as f:
    json.dump(out, f, ensure_ascii=False)
