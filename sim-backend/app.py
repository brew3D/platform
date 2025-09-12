from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os

# -----------------------------
# Configuration
# -----------------------------
app = Flask(__name__)
CORS(app)

# Set your OpenAI API key here or in environment variables
# export OPENAI_API_KEY="your_key"
openai.api_key = os.getenv("OPENAI_API_KEY") or "YOUR_OPENAI_API_KEY"

# -----------------------------
# Helper function
# -----------------------------
def generate_scene_code(prompt, output_format="urdf"):
    """
    Uses OpenAI GPT to generate a scene description in URDF or JSON.
    """
    system_prompt = (
        "You are a simulation scene generator. "
        "Output ONLY the requested format (URDF or JSON) "
        "with object sizes, positions, and simple shapes. "
        "Do not add explanations."
    )

    user_prompt = f"Generate a {output_format.upper()} scene for this prompt:\n\"{prompt}\""

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0
        )
        code = response.choices[0].message.content.strip()
        return code
    except Exception as e:
        print(f"[ERROR] GPT generation failed: {e}")
        # fallback: dummy URDF
        return f"""
<link name="table">
  <visual>
    <geometry><box size="1 1 0.5"/></geometry>
    <origin xyz="0 0 0.25"/>
  </visual>
</link>
<!-- Prompt was: {prompt} -->
"""

# -----------------------------
# Routes
# -----------------------------
@app.route("/generate", methods=["POST"])
def generate_scene():
    data = request.json
    if not data or "prompt" not in data:
        print("[ERROR] No prompt provided")
        return jsonify({"error": "No prompt provided"}), 400

    prompt = data["prompt"]
    output_format = data.get("format", "urdf")  # default to URDF

    print(f"[LOG] Received prompt: {prompt}")
    print(f"[LOG] Generating {output_format.upper()} scene...")

    scene_code = generate_scene_code(prompt, output_format)

    print(f"[LOG] Returning scene code ({len(scene_code)} characters)")
    return jsonify({"scene_code": scene_code})

# -----------------------------
# Main
# -----------------------------
if __name__ == "__main__":
    print("[LOG] Starting Flask server on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
