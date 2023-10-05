from flask import Flask, jsonify, request
import sqlite3 as sqlite

engine = sqlite.connect('radar.db')

session = engine

app = Flask(__name__)

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





# @app.route('/places/')
# def get_places():
#    session = engine
#    places = session.query(places.id, places.name, places.type, places.slug, places.chain_name, places.domain, places.cat_1, places.cat_2, places.cat_3, places.lat, places.long, places.score, places.reviews).all()
#    session.close()
#    places_data = []
#    for id, name, type, slug, chain_name, domain, cat_1, cat_2, cat_3, lat, long, score, reviews in places:
#        places_data.append({
#            'id': id,
#            'name': name,
#            'type': type,
#            'slug': slug,
#            'chain_name': chain_name,
#            'domain': domain,
#            'cat_1': cat_1,
#            'cat_2': cat_2,
#            'cat_3': cat_3,
#            'lat': lat,
#            'long': long,
#            'score': score,
#            'reviews': reviews
#        })
#    return jsonify(places_data) 

    # @app.route('/')
    # def get_places():
    #     con = sqlite.connect('radar.db')
    #     cursor = con.cursor()
    #     cursor.execute("SELECT * FROM places")
    #     data = cursor.fetchall()
    #     return str(data)

    # def go_to_db():
    #     con = sqlite.connect('radar.db')
    #     con.execute("Create table if not exists places("
    #                 "id TEXT, ")

    # @app.route('/')
    # def index():
    #     data = get_db()
    #     return str(data)

    # @app.route('/list/')
    # def list():
    #     con = sqlite.connect('radar.db')

    # def get_db():
    #     db = sqlite.connect('radar.db')
    #     cursor = db.cursor()
    #     cursor.execute("SELECT * FROM places")
    #     return cursor.fetchall()

    # @app.teardown_appcontext
    # def close_connection(exception):
    #     db = get_db()
    #     db.close()


if __name__ == '__main__':
       app.run(port=5500, debug=True)
