import json
from datetime import datetime, timedelta
from random import gauss

with open("products.json", "r") as f:
    data = json.load(f)

out = {
    "fetch_date": data["fetch_date"],
    "data": []
}

today = datetime.today()
monday = today - timedelta(days=today.weekday())
monday = monday.replace(hour=12, minute=0, second=0, microsecond=0)



#c_date = datetime.fromtimestamp(data["fetch_date"])
c_date = datetime.fromtimestamp(monday.timestamp())


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

with open(f"price_history_{monday.strftime('%Y-%m-%d')}.json", "w") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
