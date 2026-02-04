/**
 * Master Profile Prime: Yossi Newman (MBA Supply)
 * This script demonstrates how we ground the AI's "User Voice" engine for Yossi Newman.
 */

const YOSSI_BIO = "Yossi Newman, Founder & CEO of MBA Supply. Focuses on efficiency, reliable logistics, and high-trust wholesale relationships.";
const YOSSI_INDUSTRY = "Supply Chain / Industrial Supply / Wholesale";

const YOSSI_SAMPLES = [
  "Hi, checking on the tracking for the bulk order. Need this by tomorrow morning for the client. Please confirm EOD.",
  "Great price, but the lead time is too long. Can we expedite the freight? Let me know if we can do 3 days instead of 5.",
  "Invoice received. Sending payment now. Thanks for the quick turnaround on the quote.",
  "Elie, can you check the warehouse for the SKU #8472? Client is asking for 500 units.",
  "Not a good fit for this quarter. Let's revisit when the new stock arrives. Best, Yossi."
];

async function primeYossiVoice() {
  console.log("🧬 PRIMING USER VOICE: Yossi Newman (MBA Supply)");
  console.log("-----------------------------------------------");
  
  // This mirrors the injection logic in our AIService
  const profile = {
    tone: "Professional, High-Velocity, and Reliability-Focused",
    formality: "5/10 (Business-Casual but Direct)",
    greetings: ["Hi", "Hey Elie", "Checking in"],
    signOffs: ["Best, Yossi", "Thanks", "Confirm EOD"],
    commonPhrases: ["Need this by", "Lead time", "Bulk order", "SKU", "Freight"],
    negativeConstraints: [
      "No generic 'How are you' filler",
      "No flowery adjectives",
      "Avoids long explanations - keep it to the point"
    ],
    styleSummary: "A voice that values time and logistics accuracy. Uses industrial shorthand (SKU, Lead time) and prioritizes deadlines over pleasantries."
  };

  const samplePrompt = "A client is asking why their shipment of 200 units is delayed by 2 days due to weather.";
  
  const primedContext = `
    ROLE: You are Yossi's AI Assistant. You MUST mirror his voice for MBA Supply.
    
    USER BIO: ${YOSSI_BIO}
    INDUSTRY: ${YOSSI_INDUSTRY}
    
    USER STYLE PROFILE:
    - Tone: ${profile.tone}
    - Formality: ${profile.formality}
    - Signature Phrases: ${profile.commonPhrases.join(', ')}
    - Constraints: NEVER use generic business filler or emojis.
  `;

  console.log("✨ PRE-CONFIGURED LINGUISTIC IDENTITY:");
  console.log(JSON.stringify(profile, null, 2));
  
  console.log("\n📬 GENERATING DRAFT (Yossi Newman Style):");
  console.log("Input: " + samplePrompt);
  console.log("-----------------------------------------------");
  
  // Simulated output based on the profile
  console.log("AI DRAFT: \"Hi, checking on this. We have a 2-day delay on the 200 units due to the storm. Tracking says it moves tonight. I'll confirm EOD once it hits the hub. Thanks for patience. Best, Yossi.\"");
}

primeYossiVoice();
