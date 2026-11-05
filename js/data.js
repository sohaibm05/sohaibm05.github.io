/* =====================================================================
   SITE DATA — edit this file to update the site. No other file needs
   to change when you add projects or recommendations.
   ===================================================================== */

window.SITE = {
  name: "Sohaib Muhammad",
  handle: "Sobu",
  email: "thelearnee@gmail.com",
  github: "https://github.com/sohaibm05",
  linkedin: "", // paste your LinkedIn URL here and a link appears in Contact
  location: "Karachi, PK",
};

/* ---------------------------------------------------------------------
   HEADLINE PROJECTS — the big panels in "Major Arcs".
   kanji: one character shown as the project's brush mark.
   --------------------------------------------------------------------- */
window.FEATURED = [
  {
    title: "Naheed Merchandising Agent",
    kanji: "商",
    kanjiMeaning: "commerce",
    role: "Naheed AI Explorers · Team 2",
    summary:
      "An LLM agent that helps one of Pakistan's largest retailers decide what to push, where, and why. It reads live catalogue data out of Magento, scores every product through a multi-layer model, then reasons over those scores to make merchandising calls a human can check.",
    points: [
      "Python pipeline pulls Magento EAV data into PostgreSQL staging tables",
      "Multi-layer product scoring, including an IRT-based scoring module",
      "LLM reasoning layer on top of the scores: agents suggest, humans confirm",
    ],
    stack: ["Python", "PostgreSQL / JSONB", "LLM agents", "Magento"],
    link: "https://github.com/sohaibm05",
  },
  {
    title: "ItemIQ",
    kanji: "試",
    kanjiMeaning: "examination",
    role: "Khidmat project for SIUT · with Ibad & Murtaza",
    summary:
      "A smart MCQ question bank for SIUT. Every question gets a difficulty tag that keeps correcting itself, blended from three signals with dynamic weights: what faculty expect, how students actually perform, and an AI read of the question itself.",
    points: [
      "Faculty estimates as the starting prior",
      "Student data: p-value, discrimination index, distractor efficiency",
      "AI analysis layer, weighted up or down as real data arrives",
    ],
    stack: ["React", "Tailwind", "FastAPI", "PostgreSQL"],
    link: "https://github.com/sohaibm05",
  },
];

/* ---------------------------------------------------------------------
   THE ARMORY — every other project. Add as many as you like.
   tag must be one of: "AI", "Systems", "Hardware"
   status (optional): shows a small label, e.g. "In progress"
   --------------------------------------------------------------------- */
window.PROJECTS = [
  {
    title: "Single-Cycle RISC-V CPU",
    tag: "Hardware",
    blurb: "A single-cycle RISC-V processor written in Verilog and synthesized onto an FPGA.",
    stack: ["Verilog", "Xilinx Vivado", "FPGA"],
    link: "https://github.com/sohaibm05",
  },
  {
    title: "Valorant Coaching Overlay",
    tag: "AI",
    blurb: "Watches the game screen in real time with computer vision and coaches you through an overlay while you play.",
    stack: ["Python", "OpenCV", "PyQt6"],
    link: "https://github.com/sohaibm05",
  },
  {
    title: "UniCore",
    tag: "Systems",
    blurb: "University management suite. Student records live in a red-black tree, with a desktop UI on top.",
    stack: ["C++17", "CMake", "SFML"],
    link: "https://github.com/sohaibm05",
  },
  {
    title: "Idea Intelligence Machine",
    tag: "AI",
    blurb: "Reads the news, pulls out entities and trends, and turns them into ranked product ideas.",
    stack: ["Python", "spaCy", "GPT-3.5", "SQL Server"],
    link: "https://github.com/sohaibm05",
  },
  {
    title: "FitTrack AI",
    tag: "AI",
    status: "In progress",
    blurb: "Gym cameras that log your sets for you, using tag-based identity and pose estimation.",
    stack: ["Computer vision", "Pose estimation"],
    link: "https://github.com/sohaibm05",
  },
  {
    title: "CircuitSpeak",
    tag: "Hardware",
    status: "Prototype",
    blurb: "Makes Verilog and circuits visual, so hardware is easier to learn without a lab.",
    stack: ["Verilog", "Visualization"],
    link: "https://github.com/sohaibm05",
  },
  {
    title: "OOP Quiz Engine",
    tag: "Systems",
    blurb: "A quiz engine built to exercise clean object-oriented design, with a graphical front end.",
    stack: ["C++17", "SFML"],
    link: "https://github.com/sohaibm05",
  },
];

/* ---------------------------------------------------------------------
   SKILLS — grouped. Only list what a project above can back up.
   --------------------------------------------------------------------- */
window.SKILLS = [
  { group: "Languages", items: ["Python", "C++17", "JavaScript", "SQL", "Verilog"] },
  { group: "AI & vision", items: ["LLM agents", "Tool calling", "OpenCV", "spaCy", "Pose estimation"] },
  { group: "Web & data", items: ["React", "Tailwind", "FastAPI", "PostgreSQL", "SQL Server"] },
  { group: "Silicon & systems", items: ["RISC-V", "FPGA / Vivado", "CMake", "SFML", "PyQt6"] },
];

/* ---------------------------------------------------------------------
   RECOMMENDATIONS — real words from real people only.
   Add entries like:
   { quote: "…", name: "Full Name", role: "Title, Organisation" },
   While this list is empty, the section shows a short "being gathered" note.
   --------------------------------------------------------------------- */
window.TESTIMONIALS = [];
