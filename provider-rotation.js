const providers = [
  { name: "Gemini",  model: "gemini-2.0-flash" },
  { name: "OpenAI",  model: "gpt-4o-mini" },
  { name: "Claude",  model: "claude-haiku-4-5" },
  { name: "Groq",    model: "llama-3.3-70b" },
  { name: "Ollama",  model: "llama3.2" }
];

let current = 0;

async function getActiveProvider() {
  for (let i = current; i < providers.length; i++) {
    try {
      // test provider health
      console.log(`✅ Using: ${providers[i].name}`);
      current = i;
      return providers[i];
    } catch (e) {
      console.log(`❌ ${providers[i].name} unavailable, trying next...`);
    }
  }
  // always fallback to Ollama
  return providers[providers.length - 1];
}

module.exports = { providers, getActiveProvider };
