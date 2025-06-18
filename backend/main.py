
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from rag_pipeline import load_and_divide_docs, store_to_vector_db, get_qa_chain
import os

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create necessary directories if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('data', exist_ok=True)

# Initialize the RAG chain when the application starts
qa_chain = get_qa_chain()

# --- File Upload Endpoint ---
@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Handles document uploads, moves them to the 'data' directory,
    and processes them into the vector database.
    """
    file = request.files.get('file')

    if not file:
        return jsonify({"error": "No file provided"}), 400

    filename = secure_filename(file.filename)
    upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    final_path = os.path.join("data", filename)

    file.save(upload_path)
    os.rename(upload_path, final_path)

    try:
        docs = load_and_divide_docs("data")
        store_to_vector_db(docs)
        return jsonify({"message": "File uploaded and processed successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500

# --- Chat Memory ---
# CORRECTED: ConversationalRetrievalChain expects tuples, not BaseMessage objects
chat_memory = []  # List of (question, answer) tuples

# --- Ask Question Endpoint ---
@app.route('/ask', methods=['POST'])
def ask():
   
    data = request.get_json()
    question = data.get('question')

    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        # CORRECTED: ConversationalRetrievalChain expects chat_history as list of tuples
        # Format: [(question1, answer1), (question2, answer2), ...]
        result = qa_chain({  # Using __call__ method instead of .invoke()
            "question": question,
            "chat_history": chat_memory  # List of (question, answer) tuples
        })

        # CORRECTED: Store as tuple (question, answer) not BaseMessage objects
        chat_memory.append((question, result["answer"]))

        return jsonify({
            "answer": result["answer"],
            "sources": [doc.metadata for doc in result.get("source_documents", [])]
        })

    except Exception as e:
        print(f"Error during /ask: {e}")
        return jsonify({"error": str(e)}), 500

# --- Clear Memory Endpoint ---
@app.route('/clear', methods=['POST'])
def clear_memory():
    """
    Clears the entire chat history. Useful for starting a new conversation.
    """
    global chat_memory
    chat_memory = []
    return jsonify({"message": "Chat memory cleared successfully"}), 200

# --- Run the Flask Application ---
if __name__ == '__main__':
    # Run in debug mode for development (reloads on code changes, provides debugger)
    # Set debug=False for production
    app.run(debug=True)