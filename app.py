from flask import Flask, jsonify, request, render_template
import sqlite3 as sqlite

engine = sqlite.connect('radar.db')

session = engine

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/places')
def get_places():
    con = sqlite.connect('radar.db')
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

@app.route('/restaurants')
def get_restaurants():
    con = sqlite.connect('radar.db')
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


if __name__ == '__main__':
       app.run(port=5500, debug=True)
