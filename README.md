# 🧠 DocuChat AI – RAG-powered Document Q&A Chatbot

DocuChat AI is an intelligent chatbot that allows users to upload documents (PDFs, DOCX, etc.) and ask questions, receiving precise answers extracted from the content. It leverages a **Retrieval-Augmented Generation (RAG)** pipeline with **LangChain**, **ChromaDB**, **Flask**, and **React** to deliver a seamless interactive experience.

---

## 🚀 Features

- 📄 Upload support for PDF, DOCX, and other text-based documents  
- 🤖 Ask natural language questions based on uploaded content  
- 🔍 Context-aware answers powered by LangChain and ChromaDB  
- 🖥️ Flask backend for API integration  
- 💡 React frontend for a smooth and responsive UI  

---

## 🛠️ Project Structure

```text
RagChatbot/
├── backend/             # Flask backend with LangChain + ChromaDB
│   ├── main.py
│   ├── rag_pipeline.py
│   └── requirements.txt
├── frontend/            # React frontend
│   ├── public/
│   ├── src/
│   └── package.json
└── README.md
```

---

## 🧩 Tech Stack

| Layer       | Tech                             |
|------------|----------------------------------|
| Frontend   | React + Tailwind CSS             |
| Backend    | Python + Flask                   |
| Framework  | LangChain                        |
| Vector DB  | ChromaDB                         |
| Language   | OpenAI / other LLMs via LangChain|

---

## 💡 How It Works

1. User uploads a document via the frontend.
2. Backend processes and splits the document using LangChain.
3. Content is embedded and stored in ChromaDB.
4. When a user asks a question, the chatbot retrieves relevant chunks and generates an answer using a language model.

---

## 🧪 Future Improvements

- ✨ Support for image-to-text (OCR) documents
- 🔐 User authentication and session tracking
- ☁️ Deployment on Vercel (frontend) and Render/Heroku (backend)

---

## 📜 License

This project is licensed under the MIT License.

---

## 👤 Author

Made with ❤️ by [Joshua Ranish T](https://github.com/Joshua-Ranish-T)
