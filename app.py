from flask import Flask, jsonify, request, render_template
import sqlite3 as sqlite
from flask_cors import CORS

engine = sqlite.connect('radar.db')

session = engine

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/places', methods=['GET'])
def get_places():
    con = sqlite.connect('database/radar.db')
    cursor = con.cursor()
    cursor.execute("SELECT * FROM places")
    data = cursor.fetchall()
    con.close()
    places_data = []
    for id, name, type, slug, chain_name, domain, cat_0, cat_1, cat_2, cat_3, lat, long, score, reviews in data:
        places_data.append({
            'places': {
            'id': id,
            'name': name,
            'type': type,
            'slug': slug,
            'chain_name': chain_name,
            'domain': domain,
            'cat_0': cat_0,
            'cat_1': cat_1,
            'cat_2': cat_2,
            'cat_3': cat_3,
            'lat': lat,
            'long': long,
            'score': score,
            'reviews': reviews
        }})
    return jsonify(places_data)

@app.route('/restaurants', methods=['GET'])
def get_restaurants():
    con = sqlite.connect('database/radar.db')
    cursor = con.cursor()
    cursor.execute("SELECT * FROM restaurants")
    data = cursor.fetchall()
    con.close()
    restaurants_data = []
    for id, name, type, slug, chain_name, domain, cat_0, cat_1, cat_2, cat_3, lat, long, score, reviews in data:
        restaurants_data.append({
            'restaurants': {
            'id': id,
            'name': name,
            'type': type,
            'slug': slug,
            'chain_name': chain_name,
            'domain': domain,
            'cat_0': cat_0,
            'cat_1': cat_1,
            'cat_2': cat_2,
            'cat_3': cat_3,
            'lat': lat,
            'long': long,
            'score': score,
            'reviews': reviews
        }})
    return jsonify(restaurants_data)

@app.route('/places_cat', methods=['GET'])
def get_places_cat():
    con = sqlite.connect('database/radar.db')
    cursor = con.cursor()
    cursor.execute("SELECT * FROM places_cat")
    data = cursor.fetchall()
    con.close()
    places_cat_data = []
    for p_cat_0, p_cat_1, p_cat_2, p_cat_3 in data:
        places_cat_data.append({
            'places_cat': {
            'p_cat_0': p_cat_0,
            'p_cat_1': p_cat_1,
            'p_cat_2': p_cat_2,
            'p_cat_3': p_cat_3
        }})
    return jsonify(places_cat_data)

@app.route('/restaurants_cat', methods=['GET'])
def get_restaurants_cat():
    con = sqlite.connect('database/radar.db')
    cursor = con.cursor()
    cursor.execute("SELECT * FROM restaurants_cat")
    data = cursor.fetchall()
    con.close()
    restaurants_cat_data = []
    for r_cat_0, r_cat_1, r_cat_2, r_cat_3 in data:
        restaurants_cat_data.append({
            'Restaurants_cat': {
            'r_cat_0': r_cat_0,
            'r_cat_1': r_cat_1,
            'r_cat_2': r_cat_2,
            'r_cat_3': r_cat_3
        }})
    return jsonify(restaurants_cat_data)


@app.route('/unique_places_cat', methods=['GET'])
def get_unique_places_cat():
    con = sqlite.connect('database/radar.db')
    cursor = con.cursor()
    cursor.execute("SELECT * FROM unique_places_cat")
    data = cursor.fetchall()
    con.close()
    unique_places_cat_data = []
    for p_cat_0, p_cat_1, p_cat_2, p_cat_3 in data:
        unique_places_cat_data.append({
            'unique_places_cat': {
            'p_cat_0': p_cat_0,
            'p_cat_1': p_cat_1,
            'p_cat_2': p_cat_2,
            'p_cat_3': p_cat_3
        }})
    return jsonify(unique_places_cat_data)

@app.route('/unique_restaurants_cat', methods=['GET'])
def get_unique_restaurants_cat():
    con = sqlite.connect('database/radar.db')
    cursor = con.cursor()
    cursor.execute("SELECT * FROM unique_restaurants_cat")
    data = cursor.fetchall()
    con.close()
    unique_restaurants_cat_data = []
    for r_cat_0, r_cat_1, r_cat_2, r_cat_3 in data:
        unique_restaurants_cat_data.append({
            'unique_restaurants_cat': {
            'r_cat_0': r_cat_0,
            'r_cat_1': r_cat_1,
            'r_cat_2': r_cat_2,
            'r_cat_3': r_cat_3
        }})
    return jsonify(unique_restaurants_cat_data)
     

if __name__ == '__main__':
       app.run(port=5500, debug=True)
