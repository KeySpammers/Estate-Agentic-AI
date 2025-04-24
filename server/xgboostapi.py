# -*- coding: utf-8 -*-

import pandas as pd
from pycaret.regression import load_model, predict_model
from fastapi import FastAPI
import uvicorn
from pydantic import create_model, BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Create the app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Load trained Pipeline
model = load_model("xgboost")

# Create input/output pydantic models
input_model = create_model("xgboostapi_input", **{'type': (str, 'Apartment'), 
                                                  'no_bedrooms': (int, 7), 
                                                  'no_bathrooms': (int, 8), 
                                                  'area': (int, 2700), 
                                                  'latitude': (float, 25.197200775146484), 
                                                  'longitude': (float, 55.27439880371094), 
                                                  'p2024': (int, 14000000), 
                                                  'p2023': (int, 13800000), 
                                                  'p2022': (int, 13600000), 
                                                  'p2021': (int, 13400000), 
                                                  'p2020': (int, 13200000), 
                                                  'p2019': (int, 13000000), 
                                                  'p2018': (int, 12800000), 
                                                  'p2017': (int, 12600000), 
                                                  'p2016': (int, 12400000), 
                                                  'p2015': (int, 12200000), 
                                                  'neighborhood': (str, 'Downtown Dubai')})
output_model = create_model("xgboostapi_output", prediction=(int, 14200000))


class InputData(BaseModel):
    type: str
    no_bedrooms: int
    no_bathrooms: int
    area: float
    latitude: float
    longitude: float
    p2024: int
    p2023: int
    p2022: int
    p2021: int
    p2020: int
    p2019: int
    p2018: int
    p2017: int
    p2016: int
    p2015: int
    neighborhood: str
    
class PredictionOutput(BaseModel):
    prediction: float

from langchain_community.vectorstores import SKLearnVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
# List of URLs to load documents from
urls = [
    "https://www.arabianbusiness.com/industries/real-estate",
    "https://www.khaleejtimes.com/business/property",
    "https://www.propertynews.ae/",
    "https://gulfnews.com/business/property",
    "https://www.arabianbusiness.com/tags/dubai-real-estate",
]
# Load documents from the URLs
docs = [WebBaseLoader(url).load() for url in urls]
docs_list = [item for sublist in docs for item in sublist]

text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=250, chunk_overlap=0
)
# Split the documents into chunks
doc_splits = text_splitter.split_documents(docs_list)
embedding_model = "all-MiniLM:l6-v2" # Or another embedding model

# Create embeddings for documents and store them in a vector store
vectorstore = SKLearnVectorStore.from_documents(
    documents=doc_splits,
    embedding=OllamaEmbeddings(
        model=embedding_model,
    ),
)
retriever = vectorstore.as_retriever(k=4)

from langchain_ollama import ChatOllama
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
# Define the prompt template for the LLM
prompt = PromptTemplate(
    template="""Let's think step by step. You are an agentic ai that is very independent but asks for permissions before doing anything.
    Use the following documents to answer the question.
    If you don't know the answer, just say that you don't know.
    Question: {question}
    Documents: {documents}
    Answer:
    """,
    input_variables=["question", "documents"],
)

llm = ChatOllama(
    model="gemma3:1b",
    temperature=0.7,
    # other params...
)

rag_chain = prompt | llm | StrOutputParser()

# Define the RAG application class
class RAGApplication:
    def __init__(self, retriever, rag_chain):
        self.retriever = retriever
        self.rag_chain = rag_chain
    def run(self, question):
        # Retrieve relevant documents
        documents = self.retriever.invoke(question)
        # Extract content from retrieved documents
        doc_texts = "\\n".join([doc.page_content for doc in documents])
        # Get the answer from the language model
        answer = self.rag_chain.invoke({"question": question, "documents": doc_texts})
        return answer
    
    # Initialize the RAG application
rag_application = RAGApplication(retriever, rag_chain)
# Example usage


@app.post("/query")
def query(query: str):
    #question = "What specific places should i invest in dubai"
    answer = rag_application.run(query)
    return {"answer": answer}

@app.get("/")
def read_root():
    return {"Hello": "World"}
# Define predict function
@app.post("/predict", response_model=PredictionOutput)
def predict(data: InputData):
    data = pd.DataFrame([data.dict()])
    predictions = predict_model(model, data=data)
    return {"prediction": predictions["prediction_label"].iloc[0]}

@app.get("/getall")
def getall():
    data = pd.read_csv("final_cleaned.csv")
    data = data.dropna()
    return data.to_dict(orient="records")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
