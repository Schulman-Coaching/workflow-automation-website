const SAMPLE_PERSONAS = {
  concise_founder: [
    "Hey team, let's skip the meeting. Just send me the notes. Makes sense?",
    "Pushing this to Friday. Need to focus on the roadmap. Elie, you handle the sync.",
    "Great work on the landing page. Let's make the CTA bigger. No filler text needed.",
    "I'm not interested in the partnership. Too much jargon. Let's keep it simple.",
    "Syncing with the board tomorrow. Send me the latest metrics by EOD."
  ],
  warm_support: [
    "Hope you're having a wonderful week! I'd be absolutely delighted to help you with that.",
    "Thank you so much for reaching out. We really value your feedback and want to make this right.",
    "I've gone ahead and updated your account settings. Please let me know if there's anything else I can do!",
    "Sending you the warmest regards. Have a great day!",
    "It was such a pleasure chatting with you today. Looking forward to our next sync!"
  ]
};

async function simulateProfiling(name, messages) {
  console.log(`\n🧠 SIMULATING MASTER PROFILER FOR: ${name.toUpperCase()}`);
  console.log(`--------------------------------------------------`);
  console.log(`Input Samples:\n- ${messages.join('\n- ')}`);

  // This is the EXACT prompt logic from our AIService
  const prompt = `
    You are a Master Linguistic Profiler. Analyze the following message samples from a user to extract a high-fidelity "User Voice" profile.
    
    CRITICAL ANALYSIS GOALS:
    1. TONE: Identify the dominant emotional frequency (e.g., "Warm & Empathetic", "Ultra-Direct & Concise").
    2. FORMALITY: Determine the exact level (Scale 1-10).
    3. GREETINGS & SIGN-OFFS: List the top variants.
    4. LINGUISTIC QUIRKS: Identify specific repetitive phrases or structures.
    5. NEGATIVE CONSTRAINTS: Identify what this user NEVER says.

    Format the response as a JSON object.
  `;

  // For the simulation, since we don't have a live Ollama connection in this sandbox,
  // I will output what the AI would realistically produce based on the prompt logic.
  
  const simulatedResults = {
    concise_founder: {
      tone: "Ultra-Direct & Visionary",
      formality: "3/10",
      greetings: ["Hey team", "Elie", "Direct name"],
      signOffs: ["None used (Direct exit)", "Makes sense?"],
      commonPhrases: ["Let's push this", "Need to focus", "Keep it simple"],
      negativeConstraints: ["Avoids all generic pleasantries", "Never uses 'Hope you are well'", "No emojis"],
      styleSummary: "High-velocity communication focused on outcomes. No filler, no jargon."
    },
    warm_support: {
      tone: "Enthusiastic & Empathetic",
      formality: "6/10",
      greetings: ["Hope you're having a wonderful week", "Hi there"],
      signOffs: ["Warmest regards", "Have a great day"],
      commonPhrases: ["Delighted to help", "Value your feedback", "Make this right"],
      negativeConstraints: ["Never uses short/curt sentences", "Avoids negative framing"],
      styleSummary: "Service-oriented voice that uses high-warmth adjectives and proactive helpfulness."
    }
  };

  console.log(`\n✨ EXTRACTED STYLE PROFILE:`);
  console.log(JSON.stringify(simulatedResults[name], null, 2));
}

async function run() {
  await simulateProfiling('concise_founder', SAMPLE_PERSONAS.concise_founder);
  await simulateProfiling('warm_support', SAMPLE_PERSONAS.warm_support);
  
  console.log(`\n✅ Simulation Complete.`);
  console.log(`FlowStack will now use these profiles to draft replies that are indistinguishable from the user.`);
}

run();
