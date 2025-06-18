# from langchain_community.document_loaders import PyPDFLoader
# from langchain_unstructured import UnstructuredLoader
# from langchain_community.document_loaders import Docx2txtLoader
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain_chroma import Chroma
# from langchain_google_genai import GoogleGenerativeAIEmbeddings
# from langchain.retrievers.multi_query import MultiQueryRetriever
# import google.generativeai as genai
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain.chains import ConversationalRetrievalChain
# from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
# from langchain.memory import ConversationBufferMemory
# import os


# def load_and_divide_docs(directory='data'):
#     docs = []
#     for file in os.listdir(directory): 
#         path = os.path.join(directory, file)
#         if file.endswith('.pdf'):
#             loader = PyPDFLoader(path)
#         elif file.endswith('.docx'):
#             loader = Docx2txtLoader(path)
#         else:
#             loader = UnstructuredLoader(path)
#         docs.extend(loader.load())

#     splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
#     return splitter.split_documents(docs)

# os.environ["GOOGLE_API_KEY"] = "AIzaSyC63NCFPnqzK45OGF8XtZGn-f-vn5dfSfo"
# embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")


# def store_to_vector_db(docs, collection_name='rag_chatbot'):
#     db = Chroma.from_documents(
#         docs,
#         embedding,
#         collection_name=collection_name,
#         persist_directory="./chroma_store"
#     )
#     return db


# def get_qa_chain(collection_name='rag_chatbot'):
#     vectorstore = Chroma(
#         collection_name=collection_name,
#         embedding_function=embedding,
#         persist_directory="./chroma_store"
#     )

#     llm = ChatGoogleGenerativeAI(
#         model="gemini-1.5-flash-latest",
#         temperature=0.3,
#     )

#     base_retriever = vectorstore.as_retriever(search_kwargs={"k": 2})

#     retriever = MultiQueryRetriever.from_llm(
#         retriever=base_retriever,
#         llm=llm
#     )

#     memory = ConversationBufferMemory(
#         memory_key="chat_history", 
#         return_messages=True,
#         output_key="answer"
#     )

#     # Fixed prompt template - added 'context' variable
#     prompt = ChatPromptTemplate.from_messages([
#         ("system", "You are a helpful AI assistant. Use the following context to answer the user's question. If you cannot find the answer in the context, say so clearly.\n\nContext: {context}"),
#         MessagesPlaceholder(variable_name="chat_history"),
#         ("human", "{question}")
#     ])

#     response = ConversationalRetrievalChain.from_llm(
#         llm=llm,
#         retriever=retriever,
#         output_key="answer",
#         memory=memory,
#         combine_docs_chain_kwargs={"prompt": prompt},
#         return_source_documents=True,
#         verbose=True
#     )

#     return response


from langchain_community.document_loaders import PyPDFLoader
from langchain_unstructured import UnstructuredLoader
from langchain_community.document_loaders import Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.retrievers.multi_query import MultiQueryRetriever
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import ConversationalRetrievalChain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.prompts import PromptTemplate
import os

def load_and_divide_docs(directory='data'):
    docs = []
    for file in os.listdir(directory): 
        path = os.path.join(directory, file)
        if file.endswith('.pdf'):
            loader = PyPDFLoader(path)
        elif file.endswith('.docx'):
            loader = Docx2txtLoader(path)
        else:
            loader = UnstructuredLoader(path)
        docs.extend(loader.load())

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    return splitter.split_documents(docs)

os.environ["GOOGLE_API_KEY"] = "AIzaSyC63NCFPnqzK45OGF8XtZGn-f-vn5dfSfo"
embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")


def store_to_vector_db(docs, collection_name='rag_chatbot'):
    db = Chroma.from_documents(
        docs,
        embedding,
        collection_name=collection_name,
        persist_directory="./chroma_store"
    )
    return db


def get_qa_chain(collection_name='rag_chatbot'):
    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embedding,
        persist_directory="./chroma_store"
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash-latest",
        temperature=0.3,
    )

    base_retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    retriever = MultiQueryRetriever.from_llm(
        retriever=base_retriever,
        llm=llm
    )

    # docs = retriever.get_relevant_documents(query)  # Fetch some documents to initialize the retriever
    # print(f"Retrieved {len(docs)} documents for the retriever.")

    
    # CORRECTED: Proper prompt template with context variable
    qa_prompt = PromptTemplate(
        template="""You are a helpful AI assistant. Use the following context from the uploaded documents to answer the user's question. If the answer cannot be found in the context, say so clearly and the response should be in clear format. If the question is so general like Hi,Thank you,etc... then you can answer on your own knowledge, you dont have to see the vector database or mention any source.If the question is related to the chat history, you can use the chat history to answer the question.
        Context: {context}
        Chat History: {chat_history}
        Question: {question}
        Answer:""",
        input_variables=["context", "chat_history", "question"]
    )

    # Create ConversationalRetrievalChain WITH your custom prompt
    response = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        return_source_documents=True,
        verbose=True,
        combine_docs_chain_kwargs={"prompt": qa_prompt}  # ← Your prompt is used here
    )

    return response