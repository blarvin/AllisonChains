// app.js
async function runQuery() {
    const filenameInput = document.getElementById('filename');
    const queryInput = document.getElementById('query');
    const resultDiv = document.getElementById('result');
  
    const response = await fetch('/.netlify/functions/openai-embeddings', {
      method: 'POST',
      body: JSON.stringify({
        filename: filenameInput.value,
        query: queryInput.value,
      }),
    });
  
    const result = await response.json();
  
    resultDiv.textContent = JSON.stringify(result, null, 2);
  }
  