// netlify/functions/openai-embeddings.js

const { OpenAI } = require("langchain/llms/openai");
const { RetrievalQAChain } = require("langchain/chains");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");
const { OpenAIEmbeddings} = require("langchain/embeddings/openai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const fs = require("fs");
const path = require('path');

exports.handler = async function(event, context) {
  // Your code here
  // Use event.body to access POST request data
}
