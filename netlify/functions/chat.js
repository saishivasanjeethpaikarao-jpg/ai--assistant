// Netlify Serverless Function - AI Chat Handler
// This connects to the Python backend or uses OpenAI

exports.handler = async function(event, context) {
  try {
    const { message } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No message provided" })
      };
    }

    // Option 1: Use local Python backend
    const localBackendURL = process.env.BACKEND_URL || "http://localhost:5000";
    
    try {
      const response = await fetch(`${localBackendURL}/api/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ input: message })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reply: data.response?.learning || "Message processed successfully",
            type: data.response?.type,
            status: data.response?.status,
            thinking: data.response?.plan
          })
        };
      }
    } catch (e) {
      console.log("Local backend not available, using fallback");
    }

    // Option 2: Fallback to OpenAI if Python backend unavailable
    if (process.env.OPENAI_API_KEY) {
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant. Provide concise, accurate responses."
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const data = await openaiResponse.json();
      
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reply: data.choices[0].message.content,
          type: "AI",
          status: "complete"
        })
      };
    }

    // Fallback response if no backend available
    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: "I'm ready to assist! Connect me to an AI backend (OpenAI API or local Python service) to get started.",
        type: "SYSTEM",
        status: "waiting"
      })
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error: " + error.message
      })
    };
  }
};
