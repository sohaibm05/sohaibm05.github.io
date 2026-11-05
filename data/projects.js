/*
  PROJECTS — the only file you edit to add work to the site.

  Order = rank. The first entry becomes "1st.", the next "2nd.", and so on,
  alternating left and right of the ink spine automatically.

  Fields
    title     required  Project name
    summary   required  One or two plain sentences: what it is, what it does
    stack     required  Array of tools/languages
    featured  optional  true = big treatment (screenshot + red stat panel)
    type      optional  Short label shown in the red panel (featured only)
    hard      optional  "The hard part", shown in the red panel (featured only)
    image     optional  Path to a screenshot, e.g. "images/naheed.png"
    alt       optional  Describe the screenshot for screen readers
    link      optional  URL to the repo or live demo
*/
window.PROJECTS = [
  {
    title: "Naheed Merchandising Agent",
    featured: true,
    type: "LLM agent",
    stack: ["Python", "PostgreSQL", "JSONB"],
    hard: "Multi-layer product scoring",
    summary: "A merchandising agent for a Pakistani retailer. It scores and recommends products through a layered model sitting on a Postgres + JSONB schema I designed.",
    image: "",
    alt: "",
    link: ""
  },
  {
    title: "ItemIQ",
    featured: true,
    type: "Full stack · built for SIUT",
    stack: ["React", "FastAPI", "PostgreSQL"],
    hard: "Weighting three signals",
    summary: "An MCQ bank that tags each question's difficulty from faculty estimates, real student performance, and AI analysis, with the weights shifting as data comes in.",
    image: "",
    alt: "",
    link: ""
  },
  {
    title: "UniCore",
    stack: ["C++17", "SFML", "CMake"],
    summary: "University management suite running on a red-black tree.",
    link: ""
  },
  {
    title: "Valorant Overlay",
    stack: ["Python", "OpenCV", "PyQt6"],
    summary: "Real-time computer-vision coaching on top of the game.",
    link: ""
  },
  {
    title: "RISC-V on FPGA",
    stack: ["Verilog", "Xilinx Vivado"],
    summary: "A single-cycle RISC-V CPU, written in Verilog and run on an FPGA.",
    link: ""
  },
  {
    title: "Idea Intelligence Machine",
    stack: ["Python", "spaCy", "GPT-3.5", "SQL Server"],
    summary: "A pipeline that reads the news and turns it into product ideas.",
    link: ""
  }
];
