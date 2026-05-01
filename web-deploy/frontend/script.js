const chat = document.getElementById("chat");
const input = document.getElementById("input");

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.textContent = sender + ": " + text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function send() {
  const message = input.value.trim();
  
  if (!message) return;
  
  addMessage(message, "You");
  input.value = "";
  input.disabled = true;

  try {
    const res = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    
    if (data.reply) {
      addMessage(data.reply, "AI");
    } else {
      addMessage("Error: No response from AI", "System");
    }
  } catch (error) {
    addMessage("Error: " + error.message, "System");
  } finally {
    input.disabled = false;
    input.focus();
  }
}

// Allow sending with Enter key
input.addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    send();
  }
});
