from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api/hello", methods=["GET"])
def hello():
    return jsonify(message="Hello from Flask!")

@app.route("/api/add", methods=["POST"])
def add():
    data = request.json
    return jsonify(result=data["a"] + data["b"])

if __name__ == "__main__":
    app.run(debug=True)
