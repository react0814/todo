from flask import Flask, request, jsonify, render_template
import json
import uuid
from datetime import datetime
from pathlib import Path

app = Flask(__name__)
DATA_FILE = Path("todos.json")


def load_todos():
    if DATA_FILE.exists():
        with open(DATA_FILE, encoding="utf-8") as f:
            return json.load(f)
    return []


def save_todos(todos):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(todos, f, ensure_ascii=False, indent=2)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/todos", methods=["GET"])
def get_todos():
    todos = load_todos()
    todos.sort(key=lambda t: (t["completed"], -{"high": 2, "medium": 1, "low": 0}[t["priority"]]))
    return jsonify(todos)


@app.route("/api/todos", methods=["POST"])
def create_todo():
    data = request.get_json()
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "タイトルは必須です"}), 400

    priority = data.get("priority", "medium")
    if priority not in ("high", "medium", "low"):
        return jsonify({"error": "優先度が不正です"}), 400

    todo = {
        "id": str(uuid.uuid4()),
        "title": title,
        "completed": False,
        "priority": priority,
        "created_at": datetime.now().isoformat(),
    }
    todos = load_todos()
    todos.append(todo)
    save_todos(todos)
    return jsonify(todo), 201


@app.route("/api/todos/<todo_id>", methods=["PUT"])
def update_todo(todo_id):
    data = request.get_json()
    todos = load_todos()
    for todo in todos:
        if todo["id"] == todo_id:
            if "title" in data:
                title = data["title"].strip()
                if not title:
                    return jsonify({"error": "タイトルは必須です"}), 400
                todo["title"] = title
            if "completed" in data:
                todo["completed"] = bool(data["completed"])
            if "priority" in data:
                if data["priority"] not in ("high", "medium", "low"):
                    return jsonify({"error": "優先度が不正です"}), 400
                todo["priority"] = data["priority"]
            save_todos(todos)
            return jsonify(todo)
    return jsonify({"error": "見つかりません"}), 404


@app.route("/api/todos/<todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    todos = load_todos()
    new_todos = [t for t in todos if t["id"] != todo_id]
    if len(new_todos) == len(todos):
        return jsonify({"error": "見つかりません"}), 404
    save_todos(new_todos)
    return "", 204


if __name__ == "__main__":
    app.run(debug=True)
