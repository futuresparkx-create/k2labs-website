const widget = document.querySelector(".chat-widget");
if (!widget) throw new Error("chat widget missing");

const locale = widget.dataset.locale || "en";
const toggle = widget.querySelector(".chat-toggle");
const panel = widget.querySelector(".chat-panel");
const log = widget.querySelector(".chat-log");
const statusEl = widget.querySelector(".chat-status");
const form = widget.querySelector(".chat-form");
const input = form.querySelector("input");
const send = form.querySelector("button");

const MODEL_ID = "Xenova/LaMini-Flan-T5-77M";
let generator = null;
let loading = null;
let busy = false;

const KB_EN = [
  { tags: ["about", "what", "k2labs", "mission", "research", "community"], text: "K2Labs is a research-first community lab. It upskills Tier-3 communities in AI and software and builds practical digital tools by and for those communities." },
  { tags: ["where", "tier", "town", "location", "community"], text: "K2Labs works in small towns and Tier-3 regions where technology access is limited, running training centres and building locally grounded tools." },
  { tags: ["track", "course", "business", "software", "enroll", "training"], text: "K2Labs offers Track A, the AI Business Toolkit, and Track B, AI-Native Software Engineering." },
  { tags: ["enroll", "form", "student", "join", "application"], text: "Students enroll through the K2Labs Google Form on the enroll page, which asks for student details and track interest." },
  { tags: ["lab", "labs", "run", "active", "two"], text: "K2Labs runs two active labs: the AI Systems Lab and the Medical Intelligence Lab." },
  { tags: ["ai systems", "systems lab", "lab", "ai"], text: "The AI Systems Lab builds robust, efficient AI systems under real-world constraints such as limited compute, intermittent connectivity, and minimal data labeling. It prioritizes safety, interpretability, and utility, and tests prototypes with partner communities." },
  { tags: ["medical", "health", "clinic", "medical intelligence"], text: "The Medical Intelligence Lab develops assistive tools for clinical workflows, patient triage, and decision support, with human-centered design, privacy, and safety, aimed at resource-constrained clinics." },
  { tags: ["vision", "future", "own", "technology"], text: "K2Labs' vision is a future where every community in Tier-3 India has the skills to build its own digital tools and owns the technology it relies on, through a grassroots innovation ecosystem." },
  { tags: ["philosophy", "ethics", "responsible", "action"], text: "K2Labs believes knowledge has value only when it improves human life: innovation begins with communities, grows through responsible research, and becomes ethical, affordable, accessible action." },
  { tags: ["ethics", "privacy", "safety", "accessibility", "bias", "transparent"], text: "K2Labs works with human-centered design, accessibility and inclusion, privacy and consent, transparency, safety first, and bias awareness." },
  { tags: ["experience", "narrative", "website", "animation", "audio"], text: "The K2Labs site uses a narrated, animated paper-stage experience for home, vision, and labs, with audio captions and interactive nodes." },
  { tags: ["contact", "reach", "email"], text: "You can use the contact page on the K2Labs website, or the enrollment form for student inquiries." }
];

const KB_TA = [
  { tags: ["பணி", "ஆய்வகம்", "k2labs", "சமூகம்", "அடுக்கு-3", "என்ன"], text: "K2Labs ஒரு ஆராய்ச்சி-முதல் சமூக ஆய்வகம். இது அடுக்கு-3 சமூகங்களுக்கு AI மற்றும் மென்பொருள் திறன்களை வழங்கி, அவர்களுக்காக நடைமுறை டிஜிட்டல் கருவிகளை உருவாக்குகிறது." },
  { tags: ["பாடம்", "பாடங்கள்", "டிராக்", "பதிவு", "மாணவர்", "பயிற்சி", "கோர்ஸ்"], text: "K2Labs இல் Track A — AI Business Toolkit மற்றும் Track B — AI-Native Software Engineering என இரண்டு பாடங்கள் உள்ளன. மாணவர்கள் பதிவு பக்கத்தில் உள்ள Google Form மூலம் சேரலாம்." },
  { tags: ["ஆய்வகங்கள்", "லேப்", "இரண்டு", "செயல்படும்"], text: "K2Labs இரண்டு செயல்படும் ஆய்வகங்களை நடத்துகிறது: AI Systems Lab மற்றும் Medical Intelligence Lab." },
  { tags: ["ஏஐ", "மெடிக்கல்", "ஆய்வகம்", "மருத்துவ"], text: "AI Systems Lab குறைந்த கணினி வளம், இடைவிடாத இணைப்பு போன்ற நிஜ உலகக் கட்டுப்பாடுகளில் செயல்படும் AI அமைப்புகளை உருவாக்குகிறது. Medical Intelligence Lab மருத்துவ பணிப்பாய்வு, நோயாளி வரிசைப்படுத்தல் மற்றும் முடிவெடுக்கும் ஆதரவுக்கான கருவிகளை உருவாக்குகிறது." },
  { tags: ["பார்வை", "எதிர்காலம்", "தொழில்நுட்பம்"], text: "K2Labs இன் பார்வை: அடுக்கு-3 இந்தியாவில் ஒவ்வொரு சமூகமும் தங்கள் சொந்த டிஜிட்டல் கருவிகளை உருவாக்கும் திறனைப் பெற்று, அவர்கள் சார்ந்திருக்கும் தொழில்நுட்பத்தை சொந்தமாக வைத்திருக்கும் எதிர்காலம்." },
  { tags: ["நெறிமுறை", "தனியுரிமை", "பாதுகாப்பு", "அணுகல்"], text: "K2Labs மனித-மைய வடிவமைப்பு, அணுகல் மற்றும் உள்ளடக்கம், தனியுரிமை மற்றும் ஒப்புதல், வெளிப்படைத்தன்மை, பாதுகாப்பு, மற்றும் பாரபட்ச ச awareness ஆகியவற்றை கடைபிடிக்கிறது." }
];

function addMessage(role, text) {
  const el = document.createElement("div");
  el.className = `chat-msg ${role}`;
  el.textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function retrieve(query, kb) {
  const q = query.toLowerCase();
  const scored = kb.map((entry) => {
    const score = entry.tags.reduce((n, tag) => n + (q.includes(tag.toLowerCase()) ? 1 : 0), 0);
    return { entry, score };
  });
  const top = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  const chosen = top.length ? top.map((s) => s.entry) : kb.slice(0, 3);
  return chosen.map((e) => e.text).join(" ");
}

function directAnswer(query, kb) {
  const q = query.toLowerCase();
  const scored = kb.map((entry) => {
    const score = entry.tags.reduce((n, tag) => n + (q.includes(tag.toLowerCase()) ? 1 : 0), 0);
    return { entry, score };
  });
  const best = scored.sort((a, b) => b.score - a.score)[0];
  return best && best.score > 0 ? best.entry.text : null;
}

async function getModel() {
  if (generator) return generator;
  if (loading) return loading;
  loading = (async () => {
    setStatus("Loading local model (~57 MB) from Hugging Face...");
    const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2/dist/transformers.min.js");
    generator = await pipeline("text2text-generation", MODEL_ID, { dtype: "q4f16" });
    setStatus("Model ready — runs locally in your browser.");
    return generator;
  })();
  return loading;
}

async function answerEnglish(query) {
  try {
    const model = await getModel();
    const context = retrieve(query, KB_EN);
    const prompt = `You are the K2Labs website assistant. Answer from the context only, concisely. Context: ${context} Question: ${query} Answer:`;
    const out = await model(prompt, { max_new_tokens: 120 });
    const text = out?.[0]?.generated_text?.trim();
    if (text) return text;
  } catch (err) {
    console.error(err);
    setStatus("Model unavailable; using site knowledge base.");
  }
  const fallback = directAnswer(query, KB_EN);
  return fallback || "I couldn't find that in the K2Labs site knowledge base. Try asking about the labs, tracks, enrollment, vision, or ethics.";
}

function answerTamil(query) {
  const direct = directAnswer(query, KB_TA);
  if (direct) return direct;
  const context = retrieve(query, KB_TA);
  if (context) return context;
  return "இந்தத் தகவலை தளத்தின் தமிழ் உள்ளடக்கத்தில் கண்டுபிடிக்க முடியவில்லை. ஆங்கிலத்தில் கேளுங்கள் — உள்ளூர் மாதிரி ஆங்கிலத்தில் பதிலளிக்கும்.";
}

toggle.addEventListener("click", () => {
  const open = panel.hidden;
  panel.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));
  if (open) {
    input.focus();
    if (!log.children.length) {
      addMessage("system", locale === "ta" ? "K2Labs தமிழ் உதவி — தளத் தகவல்களில் இருந்து பதில்கள்." : "K2Labs assistant — local model runs in your browser.");
    }
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query || busy) return;
  busy = true;
  addMessage("user", query);
  input.value = "";
  send.disabled = true;
  setStatus(locale === "ta" ? "பதில் தயாராகிறது..." : "Thinking...");
  try {
    const reply = locale === "ta" ? answerTamil(query) : await answerEnglish(query);
    addMessage("assistant", reply);
    setStatus(locale === "ta" ? "தளத் தகவல்களில் இருந்து பதில்." : "Local model · ready.");
  } catch (err) {
    console.error(err);
    addMessage("system", "Something went wrong. Please try again.");
    setStatus("Error.");
  } finally {
    busy = false;
    send.disabled = false;
    input.focus();
  }
});
