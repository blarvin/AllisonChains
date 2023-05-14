// import necessary libraries and modules
const { OpenAI } = require("langchain/llms/openai");
const { RetrievalQAChain } = require("langchain/chains");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");
const { OpenAIEmbeddings} = require("langchain/embeddings/openai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const fs = require("fs");
const dotenv = require("dotenv");
const prompt = require("prompt-sync")();
const path = require('path');  // Import path module to handle file paths

// load local config file
let config = JSON.parse(fs.readFileSync('./config.json'));
const updateConfig = (newConfig) => {
    fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
    config = newConfig;
}

// load environment variables
dotenv.config();


// setup input data and paths
let question = "";

const createIndex = async (filename) => {
    const txtPath = `./${filename}.txt`;
    const VECTOR_STORE_PATH = `./${filename}.index`;

    // Check if the vector store file exists
    let vectorStore;
    if (fs.existsSync(VECTOR_STORE_PATH)) {
        console.log("Existing vector store found. Loading existing vector store...");
        vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, new OpenAIEmbeddings());
    } else {
        console.log("Existing vector store not found. Creating a new one...");
        // Read the input text file
        const text = fs.readFileSync(txtPath, "utf-8");
        // Create a RecursiveCharacterTextSplitter with a specified chunk size
        const textSplitter = new RecursiveCharacterTextSplitter({chunkSize: 1000});
        // Split the text into documents
        const docs = await textSplitter.createDocuments([text]);
        // Create a new vector store from the documents using OpenAIEmbeddings
        vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
        // Save the vector store to a file
        await vectorStore.save(VECTOR_STORE_PATH);
    }
    return vectorStore;
};


const runWithEmbeddings = async (query, vectorStore) => {
    const txtFilename = config.txtFilename;
    const txtPath = `./${txtFilename}.txt`;
    const VECTOR_STORE_PATH = `./${txtFilename}.index`;

    // Initialize the OpenAI model with configuration object
    const model = new OpenAI({
        temperature: 0.5,
        modelName: "gpt-4"
    });

    // Create a new RetrievalQAChain with the OpenAI model and the vector store
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    // Call the RetrievalQAChain with the input question and store the result in the 'res' variable
    const res = await chain.call({
        query: query,
    });

    // Print the result to the console
    console.log( {res} );
};

// helper function for promptForFile()... 
const getTxtFilesInDir = () => {
    return fs.readdirSync('./').filter(file => file.endsWith('.txt'));
};

// helper function for promptForFile()...
const updateConfigWithFile = (filename) => {
    console.log(`Using existing file and vector store (${filename}.txt and ${filename}.index)`);
    updateConfig({
        txtFilename: filename,
        VECTOR_STORE_PATH: `./${filename}.index`
    });
};

// helper function for promptForFile()...
const handleMultipleFiles = (files) => {
    console.log("Multiple txt files found. Please choose one.");
    files.forEach((file, index) => {
        console.log(`${index + 1}: ${file}`);   
    });
    const choice = parseInt(prompt('Enter a number: '), 10);
    if (Number.isNaN(choice) || choice < 1 || choice > files.length) {
        console.log("Invalid choice, please try again.");
        return promptForFile();
    }
    const filename = files[choice - 1].split('.')[0];
    updateConfigWithFile(filename);
    return filename;
};

// helper function for promptForFile()...
const copyFile = async (filepath) => {
    const parsedPath = path.parse(filepath);
    const filename = parsedPath.name;
    const destinationPath = `./${filename}.txt`;
    if (fs.existsSync(destinationPath)) {
        console.log("We already have this file, silly! 🤪");
    } else {
        try {
            await fs.promises.copyFile(filepath, destinationPath);
            console.log(`File copied successfully!`);
            updateConfigWithFile(filename);
        } catch (err) {
            console.error(`Error copying file: ${err}`);
            process.exit(1);
        }
    }
    return filename;
};

const promptForFile = async () => {
    const filepath = prompt('Enter a file path (or press enter to use the existing file): ');

    if (filepath) {
        console.log(`File path received: ${filepath}`);
        return await copyFile(filepath);
    }

    const files = getTxtFilesInDir();

    if (files.length === 0) {
        console.log("No existing file found. Please provide a valid file path.");
        return await promptForFile();
    }
    if (files.length === 1) {
        const filename = files[0].split('.')[0];
        updateConfigWithFile(filename);
        return filename;
    }
    return handleMultipleFiles(files);
};


const promptForQuery = async () => {
    const query = prompt('Enter a query: ');

    console.log(`Query received: ${query}`)
    // 10.1 set question to the new query
    question = query;
    return question
}   

const runner = async () => {
    // Get the file path from the user
    const filename = await promptForFile();

    // If no filename was returned, terminate the program
    if (!filename) {
        console.error("No filename provided. Exiting...");
        process.exit(1);
    }

    // Get the query from the user
    const query = await promptForQuery();

    // Create the vector store
    const vectorStore = await createIndex(filename);

    // Run the main function
    await runWithEmbeddings(query, vectorStore);
};


// run the runner
runner();

module.exports = {
    runWithEmbeddings,
    promptForFile,
    promptForQuery,
    runner,
    createIndex
};
