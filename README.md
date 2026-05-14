A minimal, clean web application built with Flask and vanilla JavaScript to track vehicle service intervals, log service history, and monitor when your next service is due.


Features
=============

Add and manage multiple vehicles (Bike or Car)
Automatic service interval calculation — 6,000 km for bikes, 10,000 km for cars
Log multiple service entries per vehicle with date, odometer reading, and notes
View remaining KM and next service KM for each entry
Color-coded status indicators — Good, Monitor, Due Soon
Filter service history by individual vehicle
Dark / Light mode toggle
Responsive, minimal UI with no external CSS frameworks


Project Structure
==========================

project/
├── oilchange.py          # Flask backend — app entry point
├── README.md
├── templates/
│   └── index.html        # HTML structure and layout
└── static/
    ├── style.css         # All styles and theme variables
    └── app.js            # All frontend logic
