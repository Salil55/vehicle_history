from flask import Flask, jsonify, request, render_template
from datetime import datetime

app = Flask(__name__)


def get_service_interval(vehicle):
    vehicle = vehicle.lower()

    if vehicle == "bike":
        return 6000
    elif vehicle == "car":
        return 10000
    else:
        return 
    


def format_service_date(service_date):
    date_object = datetime.strptime(service_date, "%Y-%m-%d")
    return date_object.strftime("%d-%m-%Y")


def service_calculator(svc_km, interval,oddo_meter):
    temp_svc= svc_km + interval
    next_svc = temp_svc - oddo_meter
    return next_svc

@app.route("/")
def home():

    return render_template("index.html")

@app.route("/service", methods=["POST"])
def service():
    

        data = request.get_json()
        # read form data once
        

        vehicle_type = data.get("vehicle")
        model = data.get("model")
        reg_number = data.get("reg_number")
        svc_km = int(data.get("svc_km"))
        service_date = data.get("service_date")
        oddo_meter = int(data.get("oddo_meter"))

        interval = get_service_interval(vehicle_type)
        formatted_date = format_service_date(service_date)
        next_svc = service_calculator(svc_km, interval, oddo_meter)


# API response
        result = {
            "vehicle": {
                "model": model,
                "registration_number": reg_number,
                "vehicle_type": vehicle_type
            },

            "service_details": {
                "service_interval": interval,
                "last_service_date": formatted_date,
                "last_service_km": svc_km,
                "current_odometer": oddo_meter,
                "remaining_km_for_service": next_svc
            }
    }


        return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)