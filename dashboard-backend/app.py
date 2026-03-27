from flask import Flask
from flask_cors import CORS
from config import SECRET_KEY, FRONTEND_URL

from auth.routes import auth_bp
#from gitlab.routes import gitlab_bp
from users.routes import users_bp


def create_app():
    app = Flask(__name__)
    app.secret_key = SECRET_KEY

    # Allow requests from the TypeScript frontend
    CORS(app, origins=[FRONTEND_URL], supports_credentials=True)

    # Register all blueprints
    app.register_blueprint(auth_bp)
    #app.register_blueprint(gitlab_bp)
    app.register_blueprint(users_bp)

    @app.route("/health")
    def health():
        return {"status": "ok"}

    @app.route("/testdb")
    def testdb():
        from db import DbCursor
        with DbCursor() as cursor:
            cursor.execute("SELECT NOW()")
            result = cursor.fetchone()
        return {"db_time": str(result["NOW()"])}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)