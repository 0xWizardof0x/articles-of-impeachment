
/* =========================================================
   MODES
   ========================================================= */
const MODES = {
  easy: {
    id: 'easy', name: '2 Years', tag: 'EASY', months: 24, daysPerMonth: 10,
    capitalRegen: [28, 34], supportDecay: 1, fatigueCap: 0, evidenceDecay: 0,
    startCapital: 70, startSupport: 55, startEvidence: 12, evidenceThreshold: 75,
    blowbackChance: 0.35, positiveEventChance: 0.40, extendedToolkit: false,
    successBonus: 10
  },
  hard: {
    id: 'hard', name: '2 Years', tag: 'HARD',
    months: 24,
    daysPerMonth: 10,
    capitalRegen: [20, 26],
    supportDecay: 1,
    fatigueCap: 1,
    evidenceDecay: 0,
    startCapital: 50,
    startSupport: 36,
    startEvidence: 6,
    evidenceThreshold: 75,
    // Independent rolls: adverse events are no longer diluted by good events.
    blowbackChance: 0.65,
    positiveEventChance: 0.25,
    extendedToolkit: false
  },
  harder: {
    id: 'harder', name: '4 Years', tag: 'HARDER',
    months: 48,
    daysPerMonth: 10,
    capitalRegen: [16, 22],
    supportDecay: 2,
    fatigueCap: 2,
    evidenceDecay: 2,
    startCapital: 45,
    startSupport: 34,
    startEvidence: 6,
    evidenceThreshold: 75,
    blowbackChance: 0.80,
    positiveEventChance: 0.30,
    extendedToolkit: true
  }
};

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

/* =========================================================
   STATE
   ========================================================= */
const S = {
  mode: null,
  turn: 1,
  maxTurns: 24,
  daysMax: 10,
  daysLeft: 10,
  phase: 'investigation',
  evidence: 8,
  support: 38,
  supportChange: 0,
  capital: 55,
  house: 0,
  senate: 0,
  over: false,
  log: []
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const rand  = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

/* =========================================================
   FEED CONFIG
   ========================================================= */
const FEED_VISIBLE = 6;
const FEED_RETAINED = 8;
const FEED_PIN_THRESHOLD = 6;

/* =========================================================
   FLAVOR
   ========================================================= */
const SCANDALS = [
  'the Marina Bay Contract',
  'the Offshore Ledger',
  'the Pardon-for-Pay Arrangement',
  'the Classified Basement',
  'the Hotel Emoluments Question',
  'the Inaugural Committee Transfers',
  'the Family Foundation Filing',
  'the Midnight Regulatory Rollback'
];

const OPENERS = [
  'The hearing room is standing room only.',
  'Three networks cut away from regular programming.',
  'The press gallery is unusually quiet.',
  'Someone leaks the witness list at 11:58 PM.',
  'A court clerk hands over a sealed envelope.',
  'The ranking member calls it "the paper trail of the century."',
  'A staffer wheels in a cart of bankers boxes.'
];

/* =========================================================
   ACTIONS
   ========================================================= */
const MOVE_DATA = {
  "investigation": [
    {
      "id": "subpoena",
      "name": "📁 Issue Subpoenas",
      "desc": "Compel documents from the executive branch. Slow, unglamorous, decisive.",
      "cost": 12,
      "days": 4,
      "gain": [
        8,
        12
      ],
      "support": [
        0,
        1
      ],
      "chance": 84,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "hearing",
      "name": "🎙️ Televised Hearing",
      "desc": "Put witnesses under oath in prime time. Moves the needle both ways.",
      "cost": 16,
      "days": 5,
      "gain": [
        6,
        10
      ],
      "support": [
        4,
        8
      ],
      "chance": 76,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "whistle",
      "name": "🧾 Whistleblower Deposition",
      "desc": "Sworn testimony from inside the building. Highest evidentiary value.",
      "cost": 14,
      "days": 6,
      "gain": [
        11,
        16
      ],
      "support": [
        0,
        1
      ],
      "chance": 80,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "court",
      "name": "⚖️ Litigate the Privilege Claim",
      "desc": "Take the administration to court. Cheap in capital, expensive on the calendar.",
      "cost": 14,
      "days": 8,
      "gain": [
        14,
        20
      ],
      "support": [
        0,
        1
      ],
      "chance": 72,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "leak",
      "name": "📰 Background to the Times",
      "desc": "Trade a detail for a headline. Fast and cheap — but it can compromise the record.",
      "cost": 6,
      "days": 1,
      "gain": [
        0,
        0
      ],
      "support": [
        4,
        8
      ],
      "chance": 65,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "audit",
      "name": "🔍 Forensic Audit of the Books",
      "desc": "Accountants, not cameras. Quiet evidence, modest headlines.",
      "cost": 10,
      "days": 5,
      "gain": [
        6,
        9
      ],
      "support": [
        1,
        3
      ],
      "chance": 88,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "deputy",
      "name": "🗂️ Deposition of the Deputy AG",
      "desc": "A senior official who would rather not be there. Steady, unspectacular evidence.",
      "cost": 12,
      "days": 5,
      "gain": [
        8,
        11
      ],
      "support": [
        1,
        3
      ],
      "chance": 84,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "investigation_new_0_0",
      "name": "🗃️ Public Records Request",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 9,
      "days": 7,
      "extended": false,
      "profile": "quiet",
      "chance": 91,
      "gain": [
        5,
        9
      ],
      "loss": [
        1,
        2
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "investigation_new_0_1",
      "name": "🔬 Reconstruct the Timeline",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 13,
      "days": 5,
      "extended": false,
      "profile": "research",
      "chance": 75,
      "gain": [
        10,
        17
      ],
      "loss": [
        2,
        5
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "investigation_new_0_2",
      "name": "🤝 Interview the Archivist",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 11,
      "days": 4,
      "extended": false,
      "profile": "balanced",
      "chance": 81,
      "gain": [
        7,
        11
      ],
      "loss": [
        1,
        3
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "investigation_new_0_3",
      "name": "📣 Explain the Paper Trail",
      "desc": "Build public support; progress is secondary.",
      "cost": 8,
      "days": 3,
      "extended": false,
      "profile": "public",
      "chance": 85,
      "gain": [
        1,
        4
      ],
      "loss": [
        0,
        2
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "investigation_new_0_4",
      "name": "⚡ Emergency Document Hold",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 15,
      "days": 4,
      "extended": false,
      "profile": "pressure",
      "chance": 67,
      "gain": [
        11,
        19
      ],
      "loss": [
        3,
        6
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "investigation_new_0_5",
      "name": "🎲 Test the Anonymous Dossier",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 17,
      "days": 5,
      "extended": false,
      "profile": "gamble",
      "chance": 51,
      "gain": [
        17,
        29
      ],
      "loss": [
        5,
        9
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "investigation_new_0_6",
      "name": "⚖️ Negotiate Limited Disclosure",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 13,
      "days": 5,
      "extended": false,
      "profile": "compromise",
      "chance": 85,
      "gain": [
        9,
        15
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "investigation_new_0_7",
      "name": "🗃️ Verify the Visitor Logs",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 10,
      "days": 7,
      "extended": false,
      "profile": "quiet",
      "chance": 88,
      "gain": [
        6,
        10
      ],
      "loss": [
        1,
        2
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "investigation_new_0_8",
      "name": "🔬 Trace the Travel Expenses",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 14,
      "days": 5,
      "extended": false,
      "profile": "research",
      "chance": 72,
      "gain": [
        11,
        18
      ],
      "loss": [
        2,
        5
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "investigation_new_0_9",
      "name": "🤝 Cross-Check the Witnesses",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 12,
      "days": 4,
      "extended": false,
      "profile": "balanced",
      "chance": 78,
      "gain": [
        8,
        12
      ],
      "loss": [
        1,
        3
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "investigation_new_0_10",
      "name": "📣 Publish an Evidence Primer",
      "desc": "Build public support; progress is secondary.",
      "cost": 9,
      "days": 3,
      "extended": false,
      "profile": "public",
      "chance": 82,
      "gain": [
        2,
        5
      ],
      "loss": [
        0,
        2
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "investigation_new_0_11",
      "name": "⚡ Challenge the Redactions",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 16,
      "days": 4,
      "extended": false,
      "profile": "pressure",
      "chance": 64,
      "gain": [
        12,
        20
      ],
      "loss": [
        3,
        6
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "investigation_new_0_12",
      "name": "🎲 Recover the Deleted Emails",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 18,
      "days": 5,
      "extended": false,
      "profile": "gamble",
      "chance": 48,
      "gain": [
        18,
        30
      ],
      "loss": [
        5,
        9
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "investigation_new_0_13",
      "name": "⚖️ Offer a Witness Accommodation",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 14,
      "days": 5,
      "extended": false,
      "profile": "compromise",
      "chance": 82,
      "gain": [
        10,
        16
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "investigation_new_0_14",
      "name": "🗃️ Review the Procurement Files",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 11,
      "days": 8,
      "extended": false,
      "profile": "quiet",
      "chance": 85,
      "gain": [
        7,
        11
      ],
      "loss": [
        1,
        2
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "investigation_new_0_15",
      "name": "🔬 Follow the Shell Company",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 15,
      "days": 6,
      "extended": false,
      "profile": "research",
      "chance": 69,
      "gain": [
        12,
        19
      ],
      "loss": [
        2,
        5
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "investigation_new_0_16",
      "name": "🤝 Interview the Security Detail",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 13,
      "days": 5,
      "extended": false,
      "profile": "balanced",
      "chance": 75,
      "gain": [
        9,
        13
      ],
      "loss": [
        1,
        3
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "investigation_new_0_17",
      "name": "📣 Open a Public Tip Line",
      "desc": "Build public support; progress is secondary.",
      "cost": 10,
      "days": 4,
      "extended": false,
      "profile": "public",
      "chance": 79,
      "gain": [
        3,
        6
      ],
      "loss": [
        0,
        2
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "investigation_new_0_18",
      "name": "⚡ Demand the Original Recording",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 17,
      "days": 5,
      "extended": false,
      "profile": "pressure",
      "chance": 61,
      "gain": [
        13,
        21
      ],
      "loss": [
        3,
        6
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "investigation_new_0_19",
      "name": "🎲 Confront the Missing Witness",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 19,
      "days": 6,
      "extended": false,
      "profile": "gamble",
      "chance": 45,
      "gain": [
        19,
        31
      ],
      "loss": [
        5,
        9
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "investigation_new_0_20",
      "name": "⚖️ Accept a Partial Testimony",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 15,
      "days": 6,
      "extended": false,
      "profile": "compromise",
      "chance": 79,
      "gain": [
        11,
        17
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "cos",
      "name": "🏛️ Depose the Chief of Staff",
      "desc": "The most senior testimony possible. High yield, high risk of a contempt fight.",
      "cost": 18,
      "days": 7,
      "extended": true,
      "gain": [
        13,
        18
      ],
      "support": [
        0,
        2
      ],
      "chance": 70,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "counsel2",
      "name": "⚖️ Request a Second Special Counsel",
      "desc": "A parallel investigation. Enormous upside if it lands, wasted calendar if it does not.",
      "cost": 16,
      "days": 8,
      "extended": true,
      "gain": [
        18,
        24
      ],
      "support": [
        0,
        2
      ],
      "chance": 60,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "forensic",
      "name": "🧮 Independent Forensic Accountant",
      "desc": "Bring in outside expertise to trace the money. Unflashy, unimpeachable.",
      "cost": 12,
      "days": 5,
      "extended": true,
      "gain": [
        9,
        13
      ],
      "support": [
        0,
        1
      ],
      "chance": 82,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "grandjury",
      "name": "🕳️ Grand Jury Leak",
      "desc": "Feed the press from the grand jury. Big headlines, real legal exposure.",
      "cost": 8,
      "days": 2,
      "extended": true,
      "gain": [
        0,
        0
      ],
      "support": [
        6,
        10
      ],
      "chance": 50,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "intl",
      "name": "🌍 International Records Request",
      "desc": "Foreign banking records take months but travel well in the record.",
      "cost": 14,
      "days": 6,
      "extended": true,
      "gain": [
        10,
        15
      ],
      "support": [
        2,
        4
      ],
      "chance": 76,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "shelter",
      "name": "🛡️ Shelter a Second Whistleblower",
      "desc": "Protect a source, earn testimony. Also earns you a very angry letter from counsel.",
      "cost": 15,
      "days": 5,
      "extended": true,
      "gain": [
        12,
        18
      ],
      "support": [
        0,
        1
      ],
      "chance": 82,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "resolution",
      "name": "📜 Impeachment Inquiry Resolution",
      "desc": "Formalize the whole enterprise. Expensive in every currency you have.",
      "cost": 20,
      "days": 9,
      "extended": true,
      "gain": [
        12,
        18
      ],
      "support": [
        4,
        8
      ],
      "chance": 78,
      "profile": "legacy",
      "loss": [
        1,
        4
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "investigation_new_1_0",
      "name": "🗃️ Audit the Chain of Custody",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 9,
      "days": 7,
      "extended": true,
      "profile": "quiet",
      "chance": 91,
      "gain": [
        5,
        9
      ],
      "loss": [
        1,
        2
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "investigation_new_1_1",
      "name": "🔬 Map the Offshore Transfers",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 13,
      "days": 5,
      "extended": true,
      "profile": "research",
      "chance": 75,
      "gain": [
        10,
        17
      ],
      "loss": [
        2,
        5
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "investigation_new_1_2",
      "name": "🤝 Question the Budget Director",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 11,
      "days": 4,
      "extended": true,
      "profile": "balanced",
      "chance": 81,
      "gain": [
        7,
        11
      ],
      "loss": [
        1,
        3
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "investigation_new_1_3",
      "name": "📣 Release a Redacted Report",
      "desc": "Build public support; progress is secondary.",
      "cost": 8,
      "days": 3,
      "extended": true,
      "profile": "public",
      "chance": 85,
      "gain": [
        1,
        4
      ],
      "loss": [
        0,
        2
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "investigation_new_1_4",
      "name": "⚡ Seek a Contempt Citation",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 15,
      "days": 4,
      "extended": true,
      "profile": "pressure",
      "chance": 67,
      "gain": [
        11,
        19
      ],
      "loss": [
        3,
        6
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "investigation_new_1_5",
      "name": "🎲 Decode the Encrypted Archive",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 17,
      "days": 5,
      "extended": true,
      "profile": "gamble",
      "chance": 51,
      "gain": [
        17,
        29
      ],
      "loss": [
        5,
        9
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "investigation_new_1_6",
      "name": "⚖️ Broker an Immunity Interview",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 13,
      "days": 5,
      "extended": true,
      "profile": "compromise",
      "chance": 85,
      "gain": [
        9,
        15
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "investigation_new_1_7",
      "name": "🗃️ Review the Appointment Records",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 10,
      "days": 7,
      "extended": true,
      "profile": "quiet",
      "chance": 88,
      "gain": [
        6,
        10
      ],
      "loss": [
        1,
        2
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "investigation_new_1_8",
      "name": "🔬 Compare the Contract Bids",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 14,
      "days": 5,
      "extended": true,
      "profile": "research",
      "chance": 72,
      "gain": [
        11,
        18
      ],
      "loss": [
        2,
        5
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "investigation_new_1_9",
      "name": "🤝 Depose the Inspector General",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 12,
      "days": 4,
      "extended": true,
      "profile": "balanced",
      "chance": 78,
      "gain": [
        8,
        12
      ],
      "loss": [
        1,
        3
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "investigation_new_1_10",
      "name": "📣 Build a Public Evidence Map",
      "desc": "Build public support; progress is secondary.",
      "cost": 9,
      "days": 3,
      "extended": true,
      "profile": "public",
      "chance": 82,
      "gain": [
        2,
        5
      ],
      "loss": [
        0,
        2
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "investigation_new_1_11",
      "name": "⚡ Request an Expedited Injunction",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 16,
      "days": 4,
      "extended": true,
      "profile": "pressure",
      "chance": 64,
      "gain": [
        12,
        20
      ],
      "loss": [
        3,
        6
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "investigation_new_1_12",
      "name": "🎲 Pursue the Foreign Intermediary",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 18,
      "days": 5,
      "extended": true,
      "profile": "gamble",
      "chance": 48,
      "gain": [
        18,
        30
      ],
      "loss": [
        5,
        9
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "investigation_new_1_13",
      "name": "⚖️ Trade Scope for Cooperation",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 14,
      "days": 5,
      "extended": true,
      "profile": "compromise",
      "chance": 82,
      "gain": [
        10,
        16
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "investigation_new_1_14",
      "name": "🗃️ Authenticate the Signatures",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 11,
      "days": 8,
      "extended": true,
      "profile": "quiet",
      "chance": 85,
      "gain": [
        7,
        11
      ],
      "loss": [
        1,
        2
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "investigation_new_1_15",
      "name": "🔬 Rebuild the Deleted Schedule",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 15,
      "days": 6,
      "extended": true,
      "profile": "research",
      "chance": 69,
      "gain": [
        12,
        19
      ],
      "loss": [
        2,
        5
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "investigation_new_1_16",
      "name": "🤝 Interview the Former Counsel",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 13,
      "days": 5,
      "extended": true,
      "profile": "balanced",
      "chance": 75,
      "gain": [
        9,
        13
      ],
      "loss": [
        1,
        3
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "investigation_new_1_17",
      "name": "📣 Hold a Citizens' Evidence Forum",
      "desc": "Build public support; progress is secondary.",
      "cost": 10,
      "days": 4,
      "extended": true,
      "profile": "public",
      "chance": 79,
      "gain": [
        3,
        6
      ],
      "loss": [
        0,
        2
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "investigation_new_1_18",
      "name": "⚡ Challenge an Emergency Secrecy Order",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 17,
      "days": 5,
      "extended": true,
      "profile": "pressure",
      "chance": 61,
      "gain": [
        13,
        21
      ],
      "loss": [
        3,
        6
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "investigation_new_1_19",
      "name": "🎲 Reopen the Sealed Deposition",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 19,
      "days": 6,
      "extended": true,
      "profile": "gamble",
      "chance": 45,
      "gain": [
        19,
        31
      ],
      "loss": [
        5,
        9
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "investigation_new_1_20",
      "name": "⚖️ Negotiate a Records Escrow",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 15,
      "days": 6,
      "extended": true,
      "profile": "compromise",
      "chance": 79,
      "gain": [
        11,
        17
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    }
  ],
  "house": [
    {
      "id": "markup",
      "name": "📜 Committee Markup",
      "desc": "Grind through the articles line by line. Reliable, incremental House votes.",
      "cost": 10,
      "days": 6,
      "gain": [
        20,
        30
      ],
      "support": [
        0,
        1
      ],
      "chance": 84,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "whip",
      "name": "🗳️ Whip the Caucus",
      "desc": "Work the vote count. Effectiveness scales with public support.",
      "cost": 12,
      "days": 4,
      "gain": [
        20,
        40
      ],
      "support": [
        0,
        1
      ],
      "chance": 78,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "address",
      "name": "📺 Prime-Time Address",
      "desc": "Make the case directly to the country from the Speaker's ceremonial office.",
      "cost": 15,
      "days": 3,
      "gain": [
        8,
        14
      ],
      "support": [
        7,
        12
      ],
      "chance": 82,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "moderates",
      "name": "🤝 Cut a Deal with Moderates",
      "desc": "Narrow the articles to win swing districts. Buys votes, costs evidentiary scope.",
      "cost": 14,
      "days": 5,
      "gain": [
        24,
        36
      ],
      "support": [
        0,
        1
      ],
      "chance": 80,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ],
      "evidenceCost": 6
    },
    {
      "id": "base",
      "name": "📣 Rally the Base",
      "desc": "Fire up the people who already agree with you. Cheap votes, limited reach.",
      "cost": 8,
      "days": 2,
      "gain": [
        9,
        15
      ],
      "support": [
        3,
        7
      ],
      "chance": 84,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "debate",
      "name": "⏱️ Floor Debate Marathon",
      "desc": "Hours of argument on the record. Slow, steady vote movement.",
      "cost": 12,
      "days": 4,
      "gain": [
        14,
        22
      ],
      "support": [
        2,
        4
      ],
      "chance": 82,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "scholars",
      "name": "🎓 Constitutional Scholars Panel",
      "desc": "Academics on the record. Modest votes, real legitimacy.",
      "cost": 9,
      "days": 3,
      "gain": [
        9,
        15
      ],
      "support": [
        3,
        5
      ],
      "chance": 86,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "house_new_0_0",
      "name": "🗃️ District-by-District Canvass",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 9,
      "days": 7,
      "extended": false,
      "profile": "quiet",
      "chance": 91,
      "gain": [
        11,
        19
      ],
      "loss": [
        2,
        5
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "house_new_0_1",
      "name": "🔬 Draft a Narrow Article",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 13,
      "days": 5,
      "extended": false,
      "profile": "research",
      "chance": 75,
      "gain": [
        21,
        31
      ],
      "loss": [
        6,
        12
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "house_new_0_2",
      "name": "🤝 Brief the Committee Chairs",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 11,
      "days": 4,
      "extended": false,
      "profile": "balanced",
      "chance": 81,
      "gain": [
        15,
        23
      ],
      "loss": [
        4,
        8
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "house_new_0_3",
      "name": "📣 Constituent Letter Drive",
      "desc": "Build public support; progress is secondary.",
      "cost": 8,
      "days": 3,
      "extended": false,
      "profile": "public",
      "chance": 85,
      "gain": [
        5,
        11
      ],
      "loss": [
        1,
        4
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "house_new_0_4",
      "name": "⚡ Force a Recorded Vote",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 15,
      "days": 4,
      "extended": false,
      "profile": "pressure",
      "chance": 67,
      "gain": [
        25,
        39
      ],
      "loss": [
        7,
        14
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "house_new_0_5",
      "name": "🎲 Call the Leadership Bluff",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 17,
      "days": 5,
      "extended": false,
      "profile": "gamble",
      "chance": 51,
      "gain": [
        35,
        55
      ],
      "loss": [
        10,
        18
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "house_new_0_6",
      "name": "⚖️ Amend the Contested Article",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 13,
      "days": 5,
      "extended": false,
      "profile": "compromise",
      "chance": 85,
      "gain": [
        23,
        33
      ],
      "loss": [
        4,
        10
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "house_new_0_7",
      "name": "🗃️ Count the Private Commitments",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 10,
      "days": 7,
      "extended": false,
      "profile": "quiet",
      "chance": 88,
      "gain": [
        12,
        20
      ],
      "loss": [
        2,
        5
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "house_new_0_8",
      "name": "🔬 Commission a Legal Brief",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 14,
      "days": 5,
      "extended": false,
      "profile": "research",
      "chance": 72,
      "gain": [
        22,
        32
      ],
      "loss": [
        6,
        12
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "house_new_0_9",
      "name": "🤝 Meet the Regional Delegation",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 12,
      "days": 4,
      "extended": false,
      "profile": "balanced",
      "chance": 78,
      "gain": [
        16,
        24
      ],
      "loss": [
        4,
        8
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "house_new_0_10",
      "name": "📣 Town Hall Tour",
      "desc": "Build public support; progress is secondary.",
      "cost": 9,
      "days": 3,
      "extended": false,
      "profile": "public",
      "chance": 82,
      "gain": [
        6,
        12
      ],
      "loss": [
        1,
        4
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "house_new_0_11",
      "name": "⚡ Set a Floor Deadline",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 16,
      "days": 4,
      "extended": false,
      "profile": "pressure",
      "chance": 64,
      "gain": [
        26,
        40
      ],
      "loss": [
        7,
        14
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "house_new_0_12",
      "name": "🎲 Release the Holdout List",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 18,
      "days": 5,
      "extended": false,
      "profile": "gamble",
      "chance": 48,
      "gain": [
        36,
        56
      ],
      "loss": [
        10,
        18
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "house_new_0_13",
      "name": "⚖️ Offer a Sunset Clause",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 14,
      "days": 5,
      "extended": false,
      "profile": "compromise",
      "chance": 82,
      "gain": [
        24,
        34
      ],
      "loss": [
        4,
        10
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "house_new_0_14",
      "name": "🗃️ Rehearse the Floor Managers",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 11,
      "days": 8,
      "extended": false,
      "profile": "quiet",
      "chance": 85,
      "gain": [
        13,
        21
      ],
      "loss": [
        2,
        5
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "house_new_0_15",
      "name": "🔬 Review Historical Precedents",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 15,
      "days": 6,
      "extended": false,
      "profile": "research",
      "chance": 69,
      "gain": [
        23,
        33
      ],
      "loss": [
        6,
        12
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "house_new_0_16",
      "name": "🤝 Win the Oversight Bloc",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 13,
      "days": 5,
      "extended": false,
      "profile": "balanced",
      "chance": 75,
      "gain": [
        17,
        25
      ],
      "loss": [
        4,
        8
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "house_new_0_17",
      "name": "📣 Invite Civic Observers",
      "desc": "Build public support; progress is secondary.",
      "cost": 10,
      "days": 4,
      "extended": false,
      "profile": "public",
      "chance": 79,
      "gain": [
        7,
        13
      ],
      "loss": [
        1,
        4
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "house_new_0_18",
      "name": "⚡ Demand a Committee Discharge",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 17,
      "days": 5,
      "extended": false,
      "profile": "pressure",
      "chance": 61,
      "gain": [
        27,
        41
      ],
      "loss": [
        7,
        14
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "house_new_0_19",
      "name": "🎲 Schedule a Surprise Session",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 19,
      "days": 6,
      "extended": false,
      "profile": "gamble",
      "chance": 45,
      "gain": [
        37,
        57
      ],
      "loss": [
        10,
        18
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "house_new_0_20",
      "name": "⚖️ Separate the Articles",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 15,
      "days": 6,
      "extended": false,
      "profile": "compromise",
      "chance": 79,
      "gain": [
        25,
        35
      ],
      "loss": [
        4,
        10
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "defwitness",
      "name": "📂 Subpoena Defense Witnesses",
      "desc": "Force the other side's witnesses to testify early. Buys votes, muddies the record.",
      "cost": 14,
      "days": 5,
      "extended": true,
      "gain": [
        18,
        26
      ],
      "support": [
        0,
        1
      ],
      "chance": 78,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ],
      "evidenceCost": 5
    },
    {
      "id": "leakwhip",
      "name": "📉 Leak the Whip Count",
      "desc": "Publish the tally early. Pressure works — until it backfires.",
      "cost": 7,
      "days": 2,
      "extended": true,
      "gain": [
        11,
        17
      ],
      "support": [
        0,
        2
      ],
      "chance": 60,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "freshman",
      "name": "🌱 Court the Freshman Class",
      "desc": "The newest members are the most movable. And the most afraid of a primary.",
      "cost": 11,
      "days": 4,
      "extended": true,
      "gain": [
        16,
        24
      ],
      "support": [
        1,
        3
      ],
      "chance": 82,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "briefing",
      "name": "🔐 The Closed-Door Briefing",
      "desc": "Show the holdouts what you actually have. Nothing leaks. That is the point.",
      "cost": 16,
      "days": 5,
      "extended": true,
      "gain": [
        22,
        30
      ],
      "support": [
        2,
        6
      ],
      "chance": 82,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "retire",
      "name": "🚪 Retire a Ranking Member",
      "desc": "Remove an obstacle from the committee. Effective, and it will be remembered.",
      "cost": 18,
      "days": 6,
      "extended": true,
      "gain": [
        25,
        35
      ],
      "support": [
        -7,
        -4
      ],
      "chance": 80,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "coalition",
      "name": "🤝 Cross-Party Coalition",
      "desc": "Bring the other side's moderates aboard. Huge vote swing, smaller evidentiary scope.",
      "cost": 20,
      "days": 7,
      "extended": true,
      "gain": [
        29,
        41
      ],
      "support": [
        0,
        2
      ],
      "chance": 76,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ],
      "evidenceCost": 4
    },
    {
      "id": "rules",
      "name": "📋 Rules Committee End-Run",
      "desc": "Change the procedure to change the outcome. Sometimes the gavel slips.",
      "cost": 15,
      "days": 4,
      "extended": true,
      "gain": [
        20,
        28
      ],
      "support": [
        0,
        1
      ],
      "chance": 75,
      "profile": "legacy",
      "loss": [
        3,
        8
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "house_new_1_0",
      "name": "🗃️ Consult Retiring Members",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 9,
      "days": 7,
      "extended": true,
      "profile": "quiet",
      "chance": 91,
      "gain": [
        11,
        19
      ],
      "loss": [
        2,
        5
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "house_new_1_1",
      "name": "🔬 Audit Conflicts of Interest",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 13,
      "days": 5,
      "extended": true,
      "profile": "research",
      "chance": 75,
      "gain": [
        21,
        31
      ],
      "loss": [
        6,
        12
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "house_new_1_2",
      "name": "🤝 Build a Procedural Alliance",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 11,
      "days": 4,
      "extended": true,
      "profile": "balanced",
      "chance": 81,
      "gain": [
        15,
        23
      ],
      "loss": [
        4,
        8
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "house_new_1_3",
      "name": "📣 Launch a District Fact Sheet",
      "desc": "Build public support; progress is secondary.",
      "cost": 8,
      "days": 3,
      "extended": true,
      "profile": "public",
      "chance": 85,
      "gain": [
        5,
        11
      ],
      "loss": [
        1,
        4
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "house_new_1_4",
      "name": "⚡ Challenge the Speaker's Schedule",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 15,
      "days": 4,
      "extended": true,
      "profile": "pressure",
      "chance": 67,
      "gain": [
        25,
        39
      ],
      "loss": [
        7,
        14
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "house_new_1_5",
      "name": "🎲 Risk a Discharge Petition",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 17,
      "days": 5,
      "extended": true,
      "profile": "gamble",
      "chance": 51,
      "gain": [
        35,
        55
      ],
      "loss": [
        10,
        18
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "house_new_1_6",
      "name": "⚖️ Trade a Hearing for a Vote",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 13,
      "days": 5,
      "extended": true,
      "profile": "compromise",
      "chance": 85,
      "gain": [
        23,
        33
      ],
      "loss": [
        4,
        10
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "house_new_1_7",
      "name": "🗃️ Verify Every Pledge",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 10,
      "days": 7,
      "extended": true,
      "profile": "quiet",
      "chance": 88,
      "gain": [
        12,
        20
      ],
      "loss": [
        2,
        5
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "house_new_1_8",
      "name": "🔬 Prepare the Minority Report",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 14,
      "days": 5,
      "extended": true,
      "profile": "research",
      "chance": 72,
      "gain": [
        22,
        32
      ],
      "loss": [
        6,
        12
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "house_new_1_9",
      "name": "🤝 Court the Committee Veterans",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 12,
      "days": 4,
      "extended": true,
      "profile": "balanced",
      "chance": 78,
      "gain": [
        16,
        24
      ],
      "loss": [
        4,
        8
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "house_new_1_10",
      "name": "📣 Bipartisan Press Conference",
      "desc": "Build public support; progress is secondary.",
      "cost": 9,
      "days": 3,
      "extended": true,
      "profile": "public",
      "chance": 82,
      "gain": [
        6,
        12
      ],
      "loss": [
        1,
        4
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "house_new_1_11",
      "name": "⚡ Demand an Open Rule",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 16,
      "days": 4,
      "extended": true,
      "profile": "pressure",
      "chance": 64,
      "gain": [
        26,
        40
      ],
      "loss": [
        7,
        14
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "house_new_1_12",
      "name": "🎲 Challenge a Party Leader",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 18,
      "days": 5,
      "extended": true,
      "profile": "gamble",
      "chance": 48,
      "gain": [
        36,
        56
      ],
      "loss": [
        10,
        18
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "house_new_1_13",
      "name": "⚖️ Narrow the Remedy",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 14,
      "days": 5,
      "extended": true,
      "profile": "compromise",
      "chance": 82,
      "gain": [
        24,
        34
      ],
      "loss": [
        4,
        10
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "house_new_1_14",
      "name": "🗃️ Reconcile Competing Drafts",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 11,
      "days": 8,
      "extended": true,
      "profile": "quiet",
      "chance": 85,
      "gain": [
        13,
        21
      ],
      "loss": [
        2,
        5
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "house_new_1_15",
      "name": "🔬 Test the Constitutional Language",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 15,
      "days": 6,
      "extended": true,
      "profile": "research",
      "chance": 69,
      "gain": [
        23,
        33
      ],
      "loss": [
        6,
        12
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "house_new_1_16",
      "name": "🤝 Convene a Cross-Regional Caucus",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 13,
      "days": 5,
      "extended": true,
      "profile": "balanced",
      "chance": 75,
      "gain": [
        17,
        25
      ],
      "loss": [
        4,
        8
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "house_new_1_17",
      "name": "📣 Publish a Plain-Language Case",
      "desc": "Build public support; progress is secondary.",
      "cost": 10,
      "days": 4,
      "extended": true,
      "profile": "public",
      "chance": 79,
      "gain": [
        7,
        13
      ],
      "loss": [
        1,
        4
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "house_new_1_18",
      "name": "⚡ Keep the Chamber in Session",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 17,
      "days": 5,
      "extended": true,
      "profile": "pressure",
      "chance": 61,
      "gain": [
        27,
        41
      ],
      "loss": [
        7,
        14
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "house_new_1_19",
      "name": "🎲 Move for an Immediate Vote",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 19,
      "days": 6,
      "extended": true,
      "profile": "gamble",
      "chance": 45,
      "gain": [
        37,
        57
      ],
      "loss": [
        10,
        18
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "house_new_1_20",
      "name": "⚖️ Accept a Procedural Concession",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 15,
      "days": 6,
      "extended": true,
      "profile": "compromise",
      "chance": 79,
      "gain": [
        25,
        35
      ],
      "loss": [
        4,
        10
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    }
  ],
  "senate": [
    {
      "id": "swing",
      "name": "🎯 Court the Swing Six",
      "desc": "The whole trial comes down to six senators. Work them individually.",
      "cost": 18,
      "days": 5,
      "gain": [
        6,
        12
      ],
      "support": [
        0,
        1
      ],
      "chance": 78,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "pressure",
      "name": "📢 Public Pressure Campaign",
      "desc": "Constituent calls, op-eds, and hometown town halls. Slow, but it moves the room.",
      "cost": 12,
      "days": 4,
      "gain": [
        3,
        7
      ],
      "support": [
        6,
        10
      ],
      "chance": 82,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "backroom",
      "name": "🚬 The Backroom Deal",
      "desc": "A committee chairmanship, a bridge, a promise. Effective and slightly nauseating.",
      "cost": 22,
      "days": 5,
      "gain": [
        9,
        15
      ],
      "support": [
        0,
        1
      ],
      "chance": 78,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ],
      "evidenceCost": 8
    },
    {
      "id": "bombshell",
      "name": "💣 The Late Bombshell",
      "desc": "Requires Evidence ≥ 85. The one document nobody has seen yet.",
      "cost": 15,
      "days": 3,
      "lockedMsg": "Requires Evidence ≥ 85",
      "gain": [
        12,
        18
      ],
      "support": [
        7,
        12
      ],
      "chance": 70,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "constitution",
      "name": "🏛️ The Constitutional Argument",
      "desc": "Remind the Senate what \"high crimes and misdemeanors\" has always meant.",
      "cost": 10,
      "days": 3,
      "gain": [
        4,
        8
      ],
      "support": [
        2,
        4
      ],
      "chance": 84,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "closing",
      "name": "📝 Trial Manager's Closing",
      "desc": "The last word on the record. Persuasive if the case is already strong.",
      "cost": 13,
      "days": 4,
      "gain": [
        5,
        9
      ],
      "support": [
        2,
        6
      ],
      "chance": 82,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "editorial",
      "name": "📰 Hometown Editorial Blitz",
      "desc": "Buy the opinion pages back home. Cheaper than a rally and harder to ignore.",
      "cost": 11,
      "days": 3,
      "gain": [
        4,
        8
      ],
      "support": [
        3,
        7
      ],
      "chance": 80,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "senate_new_0_0",
      "name": "🗃️ One-on-One Senate Briefings",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 9,
      "days": 7,
      "extended": false,
      "profile": "quiet",
      "chance": 91,
      "gain": [
        3,
        5
      ],
      "loss": [
        0,
        1
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "senate_new_0_1",
      "name": "🔬 Prepare the Trial Record",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 13,
      "days": 5,
      "extended": false,
      "profile": "research",
      "chance": 75,
      "gain": [
        6,
        10
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "senate_new_0_2",
      "name": "🤝 Consult Former Senators",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 11,
      "days": 4,
      "extended": false,
      "profile": "balanced",
      "chance": 81,
      "gain": [
        4,
        7
      ],
      "loss": [
        1,
        2
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "senate_new_0_3",
      "name": "📣 Home-State Listening Tour",
      "desc": "Build public support; progress is secondary.",
      "cost": 8,
      "days": 3,
      "extended": false,
      "profile": "public",
      "chance": 85,
      "gain": [
        1,
        3
      ],
      "loss": [
        0,
        1
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "senate_new_0_4",
      "name": "⚡ Demand Witness Testimony",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 15,
      "days": 4,
      "extended": false,
      "profile": "pressure",
      "chance": 67,
      "gain": [
        7,
        11
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "senate_new_0_5",
      "name": "🎲 Spring the Contradictory Tape",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 17,
      "days": 5,
      "extended": false,
      "profile": "gamble",
      "chance": 51,
      "gain": [
        11,
        19
      ],
      "loss": [
        3,
        6
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "senate_new_0_6",
      "name": "⚖️ Agree to a Limited Witness List",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 13,
      "days": 5,
      "extended": false,
      "profile": "compromise",
      "chance": 85,
      "gain": [
        7,
        11
      ],
      "loss": [
        1,
        3
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "senate_new_0_7",
      "name": "🗃️ Verify the Senate Count",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 10,
      "days": 7,
      "extended": false,
      "profile": "quiet",
      "chance": 88,
      "gain": [
        4,
        6
      ],
      "loss": [
        0,
        1
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "senate_new_0_8",
      "name": "🔬 Analyze the Defense Brief",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 14,
      "days": 5,
      "extended": false,
      "profile": "research",
      "chance": 72,
      "gain": [
        7,
        11
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "senate_new_0_9",
      "name": "🤝 Meet the Institutionalists",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 12,
      "days": 4,
      "extended": false,
      "profile": "balanced",
      "chance": 78,
      "gain": [
        5,
        8
      ],
      "loss": [
        1,
        2
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "senate_new_0_10",
      "name": "📣 Broadcast the Trial Summary",
      "desc": "Build public support; progress is secondary.",
      "cost": 9,
      "days": 3,
      "extended": false,
      "profile": "public",
      "chance": 82,
      "gain": [
        2,
        4
      ],
      "loss": [
        0,
        1
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "senate_new_0_11",
      "name": "⚡ Force Answers Under Oath",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 16,
      "days": 4,
      "extended": false,
      "profile": "pressure",
      "chance": 64,
      "gain": [
        8,
        12
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "senate_new_0_12",
      "name": "🎲 Challenge the Defense in Public",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 18,
      "days": 5,
      "extended": false,
      "profile": "gamble",
      "chance": 48,
      "gain": [
        12,
        20
      ],
      "loss": [
        3,
        6
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "senate_new_0_13",
      "name": "⚖️ Negotiate Trial Time Limits",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 14,
      "days": 5,
      "extended": false,
      "profile": "compromise",
      "chance": 82,
      "gain": [
        8,
        12
      ],
      "loss": [
        1,
        3
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "senate_new_0_14",
      "name": "🗃️ Rehearse Witness Questions",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 11,
      "days": 8,
      "extended": false,
      "profile": "quiet",
      "chance": 85,
      "gain": [
        5,
        7
      ],
      "loss": [
        0,
        1
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "senate_new_0_15",
      "name": "🔬 Audit the Defense Timeline",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 15,
      "days": 6,
      "extended": false,
      "profile": "research",
      "chance": 69,
      "gain": [
        8,
        12
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "senate_new_0_16",
      "name": "🤝 Build a Removal Coalition",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 13,
      "days": 5,
      "extended": false,
      "profile": "balanced",
      "chance": 75,
      "gain": [
        6,
        9
      ],
      "loss": [
        1,
        2
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "senate_new_0_17",
      "name": "📣 Organize a Civic Vigil",
      "desc": "Build public support; progress is secondary.",
      "cost": 10,
      "days": 4,
      "extended": false,
      "profile": "public",
      "chance": 79,
      "gain": [
        3,
        5
      ],
      "loss": [
        0,
        1
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "senate_new_0_18",
      "name": "⚡ Demand a Public Explanation",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 17,
      "days": 5,
      "extended": false,
      "profile": "pressure",
      "chance": 61,
      "gain": [
        9,
        13
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "senate_new_0_19",
      "name": "🎲 Call for an Early Verdict",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 19,
      "days": 6,
      "extended": false,
      "profile": "gamble",
      "chance": 45,
      "gain": [
        13,
        21
      ],
      "loss": [
        3,
        6
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "senate_new_0_20",
      "name": "⚖️ Accept a Narrow Conviction Case",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 15,
      "days": 6,
      "extended": false,
      "profile": "compromise",
      "chance": 79,
      "gain": [
        9,
        13
      ],
      "loss": [
        1,
        3
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "audit_sen",
      "name": "🔎 Senator-by-Senator Audit",
      "desc": "A full workup on every undecided vote. Expensive, methodical, effective.",
      "cost": 16,
      "days": 5,
      "extended": true,
      "gain": [
        6,
        10
      ],
      "support": [
        2,
        4
      ],
      "chance": 82,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "recusal",
      "name": "⚖️ The Recusal Motion",
      "desc": "Move to recuse a presiding officer. All upside if it lands, all cost if it does not.",
      "cost": 14,
      "days": 4,
      "extended": true,
      "gain": [
        8,
        12
      ],
      "support": [
        0,
        2
      ],
      "chance": 55,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "recall",
      "name": "🎙️ Prime-Time Witness Recall",
      "desc": "Bring the best witness back for the cameras. The country is watching again.",
      "cost": 18,
      "days": 5,
      "extended": true,
      "gain": [
        8,
        14
      ],
      "support": [
        4,
        8
      ],
      "chance": 78,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "resign",
      "name": "🤐 Negotiate the Resignation",
      "desc": "Skip the trial. Offer an exit. It works — and the record goes with him.",
      "cost": 24,
      "days": 7,
      "extended": true,
      "gain": [
        11,
        17
      ],
      "support": [
        0,
        1
      ],
      "chance": 76,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ],
      "evidenceCost": 10
    },
    {
      "id": "nuclear",
      "name": "☢️ The Constitutional Nuclear Option",
      "desc": "Threaten the institution itself. It moves votes and costs you the moral high ground.",
      "cost": 20,
      "days": 5,
      "extended": true,
      "gain": [
        7,
        11
      ],
      "support": [
        -6,
        -3
      ],
      "chance": 72,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "packing",
      "name": "🎲 Court-Packing Leverage",
      "desc": "Remind a few senators what happens if this drags on. Blunt, and it sometimes backfires.",
      "cost": 12,
      "days": 4,
      "extended": true,
      "gain": [
        5,
        9
      ],
      "support": [
        0,
        1
      ],
      "chance": 70,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "immunity",
      "name": "🕊️ The Immunity Offer",
      "desc": "Trade a prosecution for a conviction. The vote count goes up; the record gets thinner.",
      "cost": 19,
      "days": 6,
      "extended": true,
      "gain": [
        9,
        15
      ],
      "support": [
        0,
        1
      ],
      "chance": 78,
      "profile": "legacy",
      "loss": [
        1,
        3
      ],
      "supportLoss": [
        2,
        5
      ],
      "evidenceCost": 6
    },
    {
      "id": "senate_new_1_0",
      "name": "🗃️ Consult the Senate Historian",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 9,
      "days": 7,
      "extended": true,
      "profile": "quiet",
      "chance": 91,
      "gain": [
        3,
        5
      ],
      "loss": [
        0,
        1
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "senate_new_1_1",
      "name": "🔬 Compare Prior Trial Standards",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 13,
      "days": 5,
      "extended": true,
      "profile": "research",
      "chance": 75,
      "gain": [
        6,
        10
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "senate_new_1_2",
      "name": "🤝 Court Retiring Senators",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 11,
      "days": 4,
      "extended": true,
      "profile": "balanced",
      "chance": 81,
      "gain": [
        4,
        7
      ],
      "loss": [
        1,
        2
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "senate_new_1_3",
      "name": "📣 Secure a Joint Editorial",
      "desc": "Build public support; progress is secondary.",
      "cost": 8,
      "days": 3,
      "extended": true,
      "profile": "public",
      "chance": 85,
      "gain": [
        1,
        3
      ],
      "loss": [
        0,
        1
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "senate_new_1_4",
      "name": "⚡ Challenge a Private Trial Rule",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 15,
      "days": 4,
      "extended": true,
      "profile": "pressure",
      "chance": 67,
      "gain": [
        7,
        11
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "senate_new_1_5",
      "name": "🎲 Reopen the Evidence Window",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 17,
      "days": 5,
      "extended": true,
      "profile": "gamble",
      "chance": 51,
      "gain": [
        11,
        19
      ],
      "loss": [
        3,
        6
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "senate_new_1_6",
      "name": "⚖️ Offer a Censure Fallback",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 13,
      "days": 5,
      "extended": true,
      "profile": "compromise",
      "chance": 85,
      "gain": [
        7,
        11
      ],
      "loss": [
        1,
        3
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "senate_new_1_7",
      "name": "🗃️ Verify the Final Commitments",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 10,
      "days": 7,
      "extended": true,
      "profile": "quiet",
      "chance": 88,
      "gain": [
        4,
        6
      ],
      "loss": [
        0,
        1
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "senate_new_1_8",
      "name": "🔬 Rebut the Executive Defense",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 14,
      "days": 5,
      "extended": true,
      "profile": "research",
      "chance": 72,
      "gain": [
        7,
        11
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "senate_new_1_9",
      "name": "🤝 Convene a Senior Senators' Dinner",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 12,
      "days": 4,
      "extended": true,
      "profile": "balanced",
      "chance": 78,
      "gain": [
        5,
        8
      ],
      "loss": [
        1,
        2
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "senate_new_1_10",
      "name": "📣 Hold a Constitutional Teach-In",
      "desc": "Build public support; progress is secondary.",
      "cost": 9,
      "days": 3,
      "extended": true,
      "profile": "public",
      "chance": 82,
      "gain": [
        2,
        4
      ],
      "loss": [
        0,
        1
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "senate_new_1_11",
      "name": "⚡ Demand the Missing Exhibits",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 16,
      "days": 4,
      "extended": true,
      "profile": "pressure",
      "chance": 64,
      "gain": [
        8,
        12
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "senate_new_1_12",
      "name": "🎲 Expose the Secret Side Agreement",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 18,
      "days": 5,
      "extended": true,
      "profile": "gamble",
      "chance": 48,
      "gain": [
        12,
        20
      ],
      "loss": [
        3,
        6
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "senate_new_1_13",
      "name": "⚖️ Limit the Cross-Examination",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 14,
      "days": 5,
      "extended": true,
      "profile": "compromise",
      "chance": 82,
      "gain": [
        8,
        12
      ],
      "loss": [
        1,
        3
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "senate_new_1_14",
      "name": "🗃️ Review the Jury Oaths",
      "desc": "Methodical work. Better odds, slower progress.",
      "cost": 11,
      "days": 8,
      "extended": true,
      "profile": "quiet",
      "chance": 85,
      "gain": [
        5,
        7
      ],
      "loss": [
        0,
        1
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        1,
        3
      ]
    },
    {
      "id": "senate_new_1_15",
      "name": "🔬 Authenticate the Final Exhibit",
      "desc": "Deep research. Strong gains, costly setbacks.",
      "cost": 15,
      "days": 6,
      "extended": true,
      "profile": "research",
      "chance": 69,
      "gain": [
        8,
        12
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        0,
        2
      ],
      "supportLoss": [
        2,
        5
      ]
    },
    {
      "id": "senate_new_1_16",
      "name": "🤝 Build a Legacy Argument",
      "desc": "Steady coalition work with a moderate payoff.",
      "cost": 13,
      "days": 5,
      "extended": true,
      "profile": "balanced",
      "chance": 75,
      "gain": [
        6,
        9
      ],
      "loss": [
        1,
        2
      ],
      "support": [
        1,
        3
      ],
      "supportLoss": [
        2,
        4
      ]
    },
    {
      "id": "senate_new_1_17",
      "name": "📣 Give the Final Public Briefing",
      "desc": "Build public support; progress is secondary.",
      "cost": 10,
      "days": 4,
      "extended": true,
      "profile": "public",
      "chance": 79,
      "gain": [
        3,
        5
      ],
      "loss": [
        0,
        1
      ],
      "support": [
        5,
        9
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "senate_new_1_18",
      "name": "⚡ Hold the Chamber Overnight",
      "desc": "Apply pressure for a larger but less reliable gain.",
      "cost": 17,
      "days": 5,
      "extended": true,
      "profile": "pressure",
      "chance": 61,
      "gain": [
        9,
        13
      ],
      "loss": [
        2,
        4
      ],
      "support": [
        2,
        5
      ],
      "supportLoss": [
        3,
        6
      ]
    },
    {
      "id": "senate_new_1_19",
      "name": "🎲 Force the Deciding Roll Call",
      "desc": "A high-risk play with a large upside and downside.",
      "cost": 19,
      "days": 6,
      "extended": true,
      "profile": "gamble",
      "chance": 45,
      "gain": [
        13,
        21
      ],
      "loss": [
        3,
        6
      ],
      "support": [
        1,
        6
      ],
      "supportLoss": [
        4,
        8
      ]
    },
    {
      "id": "senate_new_1_20",
      "name": "⚖️ Broker the Last Compromise",
      "desc": "Trade public goodwill for a better chance of progress.",
      "cost": 15,
      "days": 6,
      "extended": true,
      "profile": "compromise",
      "chance": 79,
      "gain": [
        9,
        13
      ],
      "loss": [
        1,
        3
      ],
      "support": [
        -4,
        -1
      ],
      "supportLoss": [
        2,
        5
      ]
    }
  ]
};
const PHASE_METRICS = { investigation: 'evidence', house: 'house', senate: 'senate' };
const METRIC_LABELS = { evidence: 'Evidence', house: 'House Votes', senate: 'Senate Votes' };
const signed = n => n > 0 ? `+${n}` : String(n);
function moveChance(action) {
  const publicMood = clamp(Math.round((S.support - 40) / 10), -6, 6);
  return clamp(action.chance + publicMood + (MODES[S.mode]?.successBonus || 0) - (S.mode === 'harder' ? 8 : 0), 25, 94);
}
function resolveMove(action, phase) {
  const metric = PHASE_METRICS[phase];
  const before = S[metric], previousSupport = S.support;
  const succeeded = Math.random() < moveChance(action) / 100;
  const change = succeeded ? rand(...action.gain) : -rand(...action.loss);
  S[metric] = clamp(S[metric] + change, 0, metric === 'house' ? 435 : 100);
  S.support = clamp(S.support + (succeeded ? rand(...action.support) : -rand(...action.supportLoss)), 0, 100);
  if (succeeded && action.evidenceCost) S.evidence = clamp(S.evidence - action.evidenceCost, 0, 100);
  return {
    text: msg`${action.name}: ${succeeded ? 'Succeeded' : 'Setback'}. ${METRIC_LABELS[metric]} ${signed(S[metric] - before)}; support ${signed(S.support - previousSupport)}.`,
    kind: succeeded ? 'good' : 'bad', succeeded
  };
}
const ACTIONS = Object.fromEntries(Object.entries(MOVE_DATA).map(([phase, moves]) => [phase, moves.map(data => {
  const action = { ...data, run() { return resolveMove(action, phase); } };
  if (action.id === 'bombshell') action.requires = () => S.evidence >= 85;
  return action;
})]));

// Opinion reacts to every active day and every move, independently of the
// move result. No polling runs while paused, in the briefing, or hidden.
function shiftPublicOpinion(source, previousSupport = S.support) {
  const magnitude = source === 'day' ? (S.mode === 'harder' ? rand(1, 2) : 1) : rand(1, S.mode === 'harder' ? 4 : 3);
  const shift = Math.random() < 0.5 ? -magnitude : magnitude;
  S.support = clamp(S.support + shift, 0, 100);
  S.supportChange = S.support - previousSupport;
  log(msg`PUBLIC OPINION — Support ${previousSupport}% → ${S.support}%.`, S.supportChange < 0 ? 'bad' : 'good');
}

/* =========================================================
   RANDOM EVENTS
   ========================================================= */
const EVENTS = [
  { w: 1, tone: 'good', run() { S.evidence += rand(8, 13);
      return { text: 'A second whistleblower comes forward with corroborating documents.', kind: 'good' }; } },
  { w: 1, tone: 'bad', run() { S.evidence = clamp(S.evidence - rand(6, 10), 0, 100);
      return { text: 'A key witness recants under pressure. Two months of work evaporate.', kind: 'bad' }; } },
  { w: 1, tone: 'good', run() { S.support += rand(4, 8);
      return { text: 'A viral town hall clip changes the conversation for a week.', kind: 'good' }; } },
  { w: 1, tone: 'bad', run() { S.support = clamp(S.support - rand(3, 7), 0, 100);
      return { text: "The administration's counter-programming dominates the news cycle.", kind: 'bad' }; } },
  { w: 1, tone: 'bad', run() { S.support = clamp(S.support - rand(1, 3), 0, 100);
      return { text: 'A procedural floor fight burns a week of the calendar and a lot of goodwill.', kind: 'bad' }; } },
  { w: 1, tone: 'good', run() { S.capital = clamp(S.capital + rand(8, 14), 0, 120);
      return { text: 'A leadership reshuffle hands you a friendlier Rules Committee.', kind: 'good' }; } },
  { w: 1, tone: 'good', run() {
      if (S.phase === 'senate') { S.senate += 3; return { text: 'A swing senator tells a reporter, on the record, "I\'m listening."', kind: 'good' }; }
      S.support += 4; return { text: 'A late-night monologue puts the scandal back on the front page.', kind: 'good' }; } },
  { w: 1, tone: 'bad', run() { S.support = clamp(S.support - 3, 0, 100); S.evidence = clamp(S.evidence - 4, 0, 100);
      return { text: 'A committee gaffe hands the defense a week of free messaging.', kind: 'bad' }; } }
];

/* =========================================================
   CALENDAR HELPERS
   ========================================================= */
function currentDate() {
  const i = S.turn - 1;
  return { year: 2025 + Math.floor(i / 12), month: i % 12, yearOfTerm: Math.floor(i / 12) + 1 };
}

function termEndString() {
  const i = S.maxTurns - 1;
  return dateMessage(2025 + Math.floor(i / 12), i % 12);
}

function nextMonthString() {
  const i = S.turn;
  return dateMessage(2025 + Math.floor(i / 12), i % 12);
}

function fatigueNow() {
  const m = MODES[S.mode];
  return Math.min(Math.floor((S.turn - 1) / 12), m.fatigueCap);
}

function decayNow() {
  return MODES[S.mode].supportDecay + fatigueNow();
}

function availableActions() {
  return ACTIONS[S.phase].filter(a => !a.extended || MODES[S.mode].extendedToolkit);
}

function isMoveReady(action) {
  return (!action.requires || action.requires()) && S.capital >= action.cost && S.daysLeft >= action.days;
}

function orderedActions() {
  // Pausing disables play without discarding the current deck.
  return availableActions().filter(isMoveReady);
}

/* =========================================================
   FEED
   ========================================================= */
const feedEl = document.getElementById('feed');

function renderFeed() {
  const fromBottom = feedEl.scrollHeight - feedEl.scrollTop - feedEl.clientHeight;
  const pinned = fromBottom < FEED_PIN_THRESHOLD;

  const visible = S.log.slice(-FEED_RETAINED);
  feedEl.replaceChildren(...visible.map(e => {
    const line = document.createElement('p');
    line.className = e.kind || '';
    line.textContent = t(e.text);
    line.title = line.textContent;
    return line;
  }));

  feedEl.scrollTop = pinned
    ? feedEl.scrollHeight
    : Math.max(0, feedEl.scrollHeight - feedEl.clientHeight - fromBottom);

  const hint = document.getElementById('feedHint');
  const shown = Math.min(FEED_RETAINED, S.log.length);
  hint.textContent = S.log.length === 0
    ? t('No dispatches yet')
    : tr`Dispatches: ${shown} of ${S.log.length} · scroll for more`;
}

/* =========================================================
   RENDER
   ========================================================= */
function renderCalendar() {
  if (!S.mode) return;
  const m = MODES[S.mode];
  const d = currentDate();
  const years = m.months / 12;

  document.getElementById('calMonth').textContent = t(dateMessage(d.year, d.month));
  document.getElementById('calYear').textContent = tr`Year ${d.yearOfTerm} of ${years}`;

  const pips = [];
  for (let i = 0; i < S.daysMax; i++) {
    pips.push(`<span class="pip${i < S.daysLeft ? ' on' : ''}"></span>`);
  }
  document.getElementById('dayPips').innerHTML = pips.join('');
  document.getElementById('calDaysText').textContent = `${S.daysLeft} / ${S.daysMax}`;

  const monthProgress = (S.daysMax - S.daysLeft) / S.daysMax;
  document.getElementById('termFill').style.width = clamp((S.turn - 1 + monthProgress) / m.months * 100, 0, 100) + '%';

  let ticks = '';
  for (let y = 0; y < years; y++) {
    ticks += `<span class="tick" style="left:${(y / years) * 100}%">${tr`Year ${y + 1}`}</span>`;
  }
  document.getElementById('termTicks').innerHTML = ticks;

  const rem = m.months - (S.turn - 1);
  document.getElementById('calRemaining').textContent = tr`Months remaining: ${rem}`;

  const rot = m.evidenceDecay && S.phase !== 'investigation' ? msg` · evidence decay −${m.evidenceDecay}/month` : '';
  document.getElementById('calFatigue').textContent = tr`Public fatigue: −${decayNow()} support / month${rot}`;
  document.getElementById('calEnd').textContent = tr`Term ends ${termEndString()}`;
  document.getElementById('blowbackRisk').textContent = tr`Blowback risk: ${Math.round(m.blowbackChance * 100)}% / turn`;
}

function renderEndTurnSub() {
  if (!S.mode) return;
  const sub = document.getElementById('endTurnSub');
  if (S.turn >= S.maxTurns) { sub.textContent = t('→ The term ends. This is the final month.'); return; }
  sub.textContent = tr`→ ${nextMonthString()} · public fatigue −${decayNow()} support · ${Math.round(MODES[S.mode].blowbackChance * 100)}% blowback risk`;
}

function render() {
  if (!S.mode) return;

  document.getElementById('vEvidence').textContent = Math.round(S.evidence);
  document.getElementById('bEvidence').style.width = clamp(S.evidence, 0, 100) + '%';

  document.getElementById('vSupport').textContent = Math.round(S.support) + '%';
  document.getElementById('supportPulse').textContent = tr`Last shift: ${signed(S.supportChange)}`;
  document.getElementById('supportPulse').className = S.supportChange < 0 ? 'support-down' : 'support-up';
  document.getElementById('bSupport').style.width = clamp(S.support, 0, 100) + '%';

  document.getElementById('vCapital').textContent = Math.round(S.capital);
  document.getElementById('bCapital').style.width = clamp(S.capital / 120 * 100, 0, 100) + '%';

  document.getElementById('vHouse').textContent = Math.min(Math.round(S.house), 218) + ' / 218';
  document.getElementById('bHouse').style.width = clamp(S.house / 218 * 100, 0, 100) + '%';

  document.getElementById('vSenate').textContent = Math.min(Math.round(S.senate), 67) + ' / 67';
  document.getElementById('bSenate').style.width = clamp(S.senate / 67 * 100, 0, 100) + '%';

  const names = {
    investigation: 'Phase I — Oversight & Evidence',
    house: 'Phase II — The House Floor',
    senate: 'Phase III — The Senate Trial'
  };
  const objectives = {
    investigation: msg`Objective: reach ${MODES[S.mode].evidenceThreshold} Evidence to report articles out of committee.`,
    house: 'Objective: reach 218 House votes to impeach.',
    senate: 'Objective: reach 67 Senate votes to convict and remove.'
  };
  document.getElementById('phaseName').textContent = t(names[S.phase]);
  document.getElementById('objective').textContent = t(objectives[S.phase]);

  renderMoves();

  document.getElementById('endTurn').disabled = S.over || isCalendarPaused();

  renderCalendar();
  renderEndTurnSub();
  renderFeed();
  renderCalendarClock();
}


/* =========================================================
   MOVE CAROUSEL
   Reuse cards within a phase, with ready moves before unavailable
   moves. Keep focus and the current card when their order changes.
   No autoplay: players decide when the cards move.
   ========================================================= */
const moveTrack = document.getElementById('actions');
const moveDots = document.getElementById('moveDots');
let movePhaseKey = '';
let deckCards = new Map(), deckDots = new Map();
let deckResetRequested = false;
let carouselFrame = null;
let carouselTarget = null;
let carouselSettleTimer = null;

function settleCarousel() {
  clearTimeout(carouselSettleTimer);
  carouselSettleTimer = null;
  carouselTarget = null;
  scheduleCarouselUpdate();
}

function carouselIsRTL() { return document.documentElement.dir === 'rtl'; }
function carouselPosition() { return Math.abs(moveTrack.scrollLeft); }
function cardStart(card) {
  return carouselIsRTL() ? moveTrack.clientWidth - card.offsetLeft - card.offsetWidth : card.offsetLeft;
}
function moveDestination(card) {
  return Math.max(0, Math.min(cardStart(card), moveTrack.scrollWidth - moveTrack.clientWidth));
}

// Keep the feed immediately after the campaign-stat dashboard.
document.getElementById('dashboard').insertAdjacentElement(
  'afterend', document.getElementById('feedPanel')
);

function scheduleCarouselUpdate() {
  if (carouselFrame !== null) return;
  carouselFrame = requestAnimationFrame(() => {
    carouselFrame = null;
    updateCarouselControls();
  });
}

function updateCarouselControls() {
  const cards = Array.from(moveTrack.children);
  const left = carouselPosition();
  const right = left + moveTrack.clientWidth;
  const max = Math.max(0, moveTrack.scrollWidth - moveTrack.clientWidth);
  const visible = cards.map((card, index) => ({ card, index })).filter(({ card }) =>
    cardStart(card) + card.offsetWidth > left + 3 && cardStart(card) < right - 3
  );
  const navigationLeft = carouselTarget?.left ?? left;
  document.getElementById('movesPrev').disabled = navigationLeft <= 2;
  document.getElementById('movesNext').disabled = navigationLeft >= max - 2 || !cards.length;
  document.getElementById('movesRange').textContent = visible.length
    ? `${visible[0].index + 1}–${visible[visible.length - 1].index + 1} / ${cards.length}`
    : `0 / ${cards.length}`;
  // Several final cards share a clamped destination. Mark the requested
  // dot when it is still on screen; otherwise mark the first visible card.
  let selected = carouselTarget?.index ?? Number(moveTrack.dataset.selectedIndex || 0);
  if (!carouselTarget && !visible.some(({ index }) => index === selected)) selected = visible[0]?.index ?? 0;
  moveTrack.dataset.selectedIndex = String(selected);
  cards.forEach((card, index) => {
    card.classList.toggle('is-current', index === selected);
    card.setAttribute('aria-current', index === selected ? 'true' : 'false');
  });
  Array.from(moveDots.children).forEach((dot, index) => {
    dot.setAttribute('aria-current', index === selected ? 'true' : 'false');
  });
}

function scrollToMove(index) {
  const cards = Array.from(moveTrack.children);
  if (!cards.length) return;
  index = clamp(index, 0, cards.length - 1);
  clearTimeout(carouselSettleTimer);
  carouselTarget = { index, left: moveDestination(cards[index]) };
  moveTrack.dataset.selectedIndex = String(index);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  moveTrack.scrollTo({
    left: (carouselIsRTL() ? -1 : 1) * carouselTarget.left,
    behavior: reduceMotion ? 'instant' : 'smooth'
  });
  // Also settle when the destination is already in view and no scroll event fires.
  carouselSettleTimer = setTimeout(settleCarousel, 180);
  scheduleCarouselUpdate();
}

function scrollMoves(direction) {
  const cards = Array.from(moveTrack.children);
  if (!cards.length) return;
  // Rapid clicks continue from the requested destination, not an in-flight frame.
  const left = carouselTarget?.left ?? carouselPosition();
  let index;
  if (direction > 0) {
    index = cards.findIndex(card => moveDestination(card) > left + 3);
    if (index < 0) index = cards.length - 1;
  } else {
    index = cards.length - 1;
    while (index > 0 && moveDestination(cards[index]) >= left - 3) index--;
  }
  scrollToMove(index);
}

function animateDeckExit(card) {
  if (typeof card.animate !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = card.getBoundingClientRect(), track = moveTrack.getBoundingClientRect();
  if (rect.right <= track.left || rect.left >= track.right) return;
  const layer = document.getElementById('deckExits'), origin = layer.getBoundingClientRect();
  const ghost = card.cloneNode(true);
  ghost.disabled = true;
  ghost.tabIndex = -1;
  ghost.classList.add('deck-exit');
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {left: `${rect.left-origin.left}px`, top: `${rect.top-origin.top}px`, width: `${rect.width}px`, height: `${rect.height}px`});
  layer.appendChild(ghost);
  const animation = ghost.animate([
    {opacity: 0.8, transform: 'translateY(0) scale(1)', filter: 'blur(0px)'},
    {opacity: 0, transform: 'translateY(-14px) scale(.88)', filter: 'blur(3px)'}
  ], {duration: 220, easing: 'ease-in', fill: 'forwards'});
  animation.onfinish = () => ghost.remove();
  animation.oncancel = () => ghost.remove();
}

function renderMoves() {
  const actions = orderedActions();
  const phaseKey = `${S.mode}:${S.phase}:${language}`;
  const phaseChanged = movePhaseKey !== phaseKey;
  const previousCards = Array.from(moveTrack.children);
  const previousOffsets = new Map(previousCards.map(card => [card.dataset.moveId, card.offsetLeft]));
  const focusedElement = document.activeElement;
  const hadDeckFocus = moveTrack.contains(focusedElement) || moveDots.contains(focusedElement);
  const selectedId = previousCards[carouselTarget?.index ?? Number(moveTrack.dataset.selectedIndex || 0)]?.dataset.moveId;
  if (phaseChanged) {
    movePhaseKey = phaseKey;
    deckCards = new Map(); deckDots = new Map();
    document.getElementById('deckExits').replaceChildren();
    availableActions().forEach(action => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'action'; button.dataset.moveId = action.id;
      button.innerHTML = `
        ${action.extended ? `<span class="ext">${t('EXT')}</span>` : ''}
        <span class="name">${t(action.name)}</span><span class="desc"></span>
        <span class="move-odds"></span><span class="move-payoff"></span>
        <span class="cost">◈ ${tr`Capital: ${action.cost}`} <span class="sep">·</span> <span class="days">⏱ ${tr`Days: ${action.days}`}</span></span>
        <span class="move-status"></span>`;
      button.onclick = () => doAction(action);
      deckCards.set(action.id, button);
      const dot = document.createElement('button');
      dot.type = 'button'; dot.className = 'move-dot'; dot.dataset.moveId = action.id;
      dot.setAttribute('aria-controls', 'actions'); deckDots.set(action.id, dot);
    });
  }
  const changed = phaseChanged || actions.length !== previousCards.length || actions.some((action, i) => action.id !== previousCards[i]?.dataset.moveId);
  const shouldReset = phaseChanged || deckResetRequested || (changed && !actions.some(a => a.id === selectedId));
  if (changed) {
    settleCarousel();
    if (!phaseChanged) previousCards.filter(card => !actions.some(a => a.id === card.dataset.moveId)).forEach(animateDeckExit);
    moveTrack.replaceChildren(...actions.map(action => deckCards.get(action.id)));
    moveDots.replaceChildren(...actions.map(action => deckDots.get(action.id)));
    if (!phaseChanged && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      Array.from(moveTrack.children).forEach(card => {
        if (typeof card.animate !== 'function') return;
        card.getAnimations().forEach(animation => animation.cancel());
        const oldLeft = previousOffsets.get(card.dataset.moveId);
        const delta = oldLeft === undefined ? 0 : oldLeft - card.offsetLeft;
        card.animate(oldLeft === undefined
          ? [{opacity: 0, transform: 'translateY(12px)'}, {opacity: 1, transform: 'translateY(0)'}]
          : [{transform: `translateX(${delta}px)`}, {transform: 'translateX(0)'}],
          {duration: 320, easing: 'cubic-bezier(.2,.75,.25,1)'});
      });
    }
    if (hadDeckFocus) {
      (moveTrack.contains(focusedElement) || moveDots.contains(focusedElement) ? focusedElement : moveTrack).focus({preventScroll:true});
    }
  }
  let playable = 0;
  const paused = isCalendarPaused();
  actions.forEach((action, index) => {
    const button = moveTrack.children[index];
    const dot = moveDots.children[index];
    dot.setAttribute('aria-label', tr`Show move ${index + 1}: ${action.name}`);
    dot.title = tr`Move ${index + 1}: ${action.name}`;
    dot.onclick = () => scrollToMove(index);
    const locked = Boolean(action.requires && !action.requires());
    const affordable = S.capital >= action.cost && S.daysLeft >= action.days;
    const disabled = S.over || paused || locked || !affordable;
    // Preserve a sensible focus target when the selected move becomes disabled.
    if (disabled && document.activeElement === button) moveTrack.focus({ preventScroll: true });
    button.disabled = disabled;
    let status = 'Ready to play';
    if (S.over) status = 'Campaign ended';
    else if (paused) status = 'Paused — resume the clock to play';
    else if (locked) status = action.lockedMsg;
    else if (!affordable) {
      const needs = [];
      if (S.capital < action.cost) needs.push(tr`More capital needed: ${action.cost - S.capital}`);
      if (S.daysLeft < action.days) needs.push(tr`More session days needed: ${action.days - S.daysLeft}`);
      status = needs.join(' · ');
    } else playable++;
    button.querySelector('.desc').textContent = t(action.desc);
    const metric = METRIC_LABELS[PHASE_METRICS[S.phase]];
    const odds = tr`Success: ${moveChance(action)}% · ${metric} +${action.gain[0]}–${action.gain[1]}`;
    const support = tr`Support on success: ${signed(action.support[0])} to ${signed(action.support[1])}`;
    const failure = tr`On failure: ${metric} −${action.loss[0]}–${action.loss[1]}; support −${action.supportLoss[0]}–${action.supportLoss[1]}.`;
    const evidenceCost = action.evidenceCost ? tr`Evidence cost on success: ${action.evidenceCost}.` : '';
    button.querySelector('.move-odds').textContent = odds;
    button.querySelector('.move-payoff').textContent = `${support}. ${failure} ${evidenceCost}`.trim();
    button.querySelector('.move-status').textContent = t(status);
    button.setAttribute('aria-label', tr`${action.name}. Move ${index + 1} of ${actions.length}. ${status}. Capital: ${action.cost}. Days: ${action.days}. ${action.desc}` + ` ${odds}. ${support}. ${failure} ${evidenceCost}`);
  });
  if (shouldReset) {
    settleCarousel(); moveTrack.dataset.selectedIndex = '0';
    carouselTarget = actions.length ? {index: 0, left: 0} : null;
    const instant = phaseChanged || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    moveTrack.scrollTo({left: 0, behavior: instant ? 'instant' : 'smooth'});
    carouselSettleTimer = setTimeout(settleCarousel, 180);
    if (hadDeckFocus) moveTrack.focus({preventScroll:true});
  } else if (changed) {
    moveTrack.dataset.selectedIndex = String(Math.max(0, actions.findIndex(a => a.id === selectedId)));
  }
  deckResetRequested = false;
  document.getElementById('movesSummary').textContent = tr`Deck: ${actions.length} / ${availableActions().length} cards available`;
  const empty = document.getElementById('deckEmpty');
  empty.hidden = actions.length > 0;
  empty.textContent = t('No affordable moves. Adjourn to rebuild capital; blowback can halve the recovery.');
  scheduleCarouselUpdate();
}

document.getElementById('movesPrev').addEventListener('click', () => scrollMoves(-1));
document.getElementById('movesNext').addEventListener('click', () => scrollMoves(1));
moveTrack.addEventListener('scroll', () => {
  clearTimeout(carouselSettleTimer);
  carouselSettleTimer = setTimeout(settleCarousel, 180);
  scheduleCarouselUpdate();
}, { passive: true });
moveTrack.addEventListener('scrollend', () => {
  if (!carouselTarget || Math.abs(carouselPosition() - carouselTarget.left) <= 2) settleCarousel();
});
// Hand control back immediately when the player swipes or scrolls directly.
for (const eventName of ['pointerdown', 'touchstart', 'wheel']) {
  moveTrack.addEventListener(eventName, () => {
    delete moveTrack.dataset.selectedIndex;
    settleCarousel();
  }, { passive: true });
}
moveTrack.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    scrollMoves((event.key === 'ArrowRight' ? 1 : -1) * (carouselIsRTL() ? -1 : 1));
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    scrollToMove(event.key === 'Home' ? 0 : moveTrack.children.length - 1);
  }
});
window.addEventListener('resize', settleCarousel);
if ('ResizeObserver' in window) new ResizeObserver(scheduleCarouselUpdate).observe(moveTrack);

function log(text, kind = '') { S.log.push({ text, kind }); }

/* =========================================================
   ACTIVE-PLAY CALENDAR — 12 seconds = 1 remaining session day
   - performance.now() prevents wall-clock adjustments affecting play.
   - Only one interval exists; starting a new game always clears it.
   - Hidden tabs, explicit pause and open dialogs preserve the fraction
     of the current day, without accruing background catch-up time.
   - Moves keep their existing day costs; a move never resets the clock.
   ========================================================= */
const DAY_DURATION_MS = 12_000;
const CALENDAR_CLOCK = {
  elapsedMs: 0,
  lastNow: null,
  interval: null,
  manuallyPaused: false
};

function hasOpenCampaignDialog() {
  return document.getElementById('startScreen').classList.contains('show') ||
    document.getElementById('overlay').classList.contains('show') ||
    Array.from(document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]'))
      .some(dialog => !dialog.hidden && dialog.getClientRects().length > 0);
}

function isCalendarPaused() {
  return !S.mode || S.over || CALENDAR_CLOCK.manuallyPaused ||
    document.hidden || hasOpenCampaignDialog();
}

function renderCalendarClock() {
  const seconds = Math.max(0, Math.ceil((DAY_DURATION_MS - CALENDAR_CLOCK.elapsedMs) / 1000));
  const countdown = document.getElementById('dayCountdown');
  countdown.textContent = S.over ? '—' : `00:${String(seconds).padStart(2, '0')}`;
  countdown.classList.toggle('urgent', !S.over && !isCalendarPaused() && seconds <= 5);
  document.getElementById('clockFill').style.width = S.over ? '0%' :
    `${clamp(100 * (1 - CALENDAR_CLOCK.elapsedMs / DAY_DURATION_MS), 0, 100)}%`;
  const pause = document.getElementById('clockPause');
  pause.disabled = !S.mode || S.over;
  pause.textContent = t(CALENDAR_CLOCK.manuallyPaused ? 'Resume' : 'Pause');
  pause.setAttribute('aria-pressed', String(CALENDAR_CLOCK.manuallyPaused));
  let message = '12 seconds = 1 session day';
  if (S.over) message = 'Campaign ended · clock stopped';
  else if (!S.mode) message = 'The clock starts when you press Start the Session';
  else if (CALENDAR_CLOCK.manuallyPaused) message = 'Paused · no calendar time lost';
  else if (document.hidden) message = 'Paused while this tab is hidden';
  else if (hasOpenCampaignDialog()) message = 'Paused while a dialog is open';
  const status = document.getElementById('clockStatus');
  // Avoid announcing the same message on each 100ms clock sample.
  if (status.textContent !== t(message)) status.textContent = t(message);
}

function stopCalendarClock() {
  if (CALENDAR_CLOCK.interval !== null) clearInterval(CALENDAR_CLOCK.interval);
  CALENDAR_CLOCK.interval = null;
  CALENDAR_CLOCK.lastNow = null;
}

function resetCalendarClock() {
  stopCalendarClock();
  CALENDAR_CLOCK.elapsedMs = 0;
  CALENDAR_CLOCK.manuallyPaused = false;
}

function startCalendarClock() {
  stopCalendarClock();
  if (!S.mode || S.over) return;
  CALENDAR_CLOCK.lastNow = isCalendarPaused() ? null : performance.now();
  CALENDAR_CLOCK.interval = setInterval(syncCalendarClock, 100);
  renderCalendarClock();
}

// Isolated elapsed-time consumer for deterministic testing. No date or score
// is accepted from an external client; this file is a local practice preview.
function consumeActiveCalendarTime(elapsedMs) {
  if (isCalendarPaused() || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return;
  CALENDAR_CLOCK.elapsedMs += elapsedMs;
  while (CALENDAR_CLOCK.elapsedMs >= DAY_DURATION_MS && !S.over) {
    CALENDAR_CLOCK.elapsedMs -= DAY_DURATION_MS;
    S.daysLeft = Math.max(0, S.daysLeft - 1);
    log(msg`CLOCK — A session day expires. Days remaining this month: ${S.daysLeft}.`, 'sys');
    shiftPublicOpinion('day');
    if (S.daysLeft === 0) endTurn('clock');
    else render();
  }
  renderCalendarClock();
}

function syncCalendarClock() {
  const now = performance.now();
  if (isCalendarPaused()) {
    CALENDAR_CLOCK.lastNow = null;
    renderCalendarClock();
    return;
  }
  const previous = CALENDAR_CLOCK.lastNow;
  CALENDAR_CLOCK.lastNow = now;
  if (previous !== null) consumeActiveCalendarTime(Math.max(0, now - previous));
  renderCalendarClock();
}

function toggleCalendarPause() {
  if (!S.mode || S.over) return;
  if (!CALENDAR_CLOCK.manuallyPaused) syncCalendarClock();
  if (S.over) return;
  CALENDAR_CLOCK.manuallyPaused = !CALENDAR_CLOCK.manuallyPaused;
  CALENDAR_CLOCK.lastNow = isCalendarPaused() ? null : performance.now();
  render();
}

// Reset only the timestamp, NOT elapsedMs, on visibility/dialog transitions.
// Thus a player returning after an hour keeps exactly their partial day.
function refreshCalendarPauseState() {
  CALENDAR_CLOCK.lastNow = isCalendarPaused() ? null : performance.now();
  if (S.mode) render();
  else renderCalendarClock();
}

document.getElementById('clockPause').addEventListener('click', toggleCalendarPause);
document.addEventListener('visibilitychange', refreshCalendarPauseState);
window.addEventListener('pagehide', () => { CALENDAR_CLOCK.lastNow = null; });
window.addEventListener('pageshow', refreshCalendarPauseState);
const campaignDialogObserver = new MutationObserver(refreshCalendarPauseState);
for (const id of ['startScreen', 'overlay']) {
  campaignDialogObserver.observe(document.getElementById(id), { attributes: true, attributeFilter: ['class', 'hidden'] });
}
// Native dialogs notify the clock at open/close. The interval is an additional
// guard for a custom dialog; connect its show/hide handler to the same helper.
document.addEventListener('toggle', event => {
  if (event.target instanceof HTMLDialogElement) refreshCalendarPauseState();
}, true);
renderCalendarClock();

/* =========================================================
   GAME FLOW
   ========================================================= */
function doAction(action) {
  if (isCalendarPaused()) return;
  const previousTurn = S.turn;
  const previousPhase = S.phase;
  // Settle the clock before accepting a click, so an expired day cannot be spent.
  syncCalendarClock();
  if (S.over || S.turn !== previousTurn || S.phase !== previousPhase) return;
  if (!availableActions().includes(action)) return;
  if (action.requires && !action.requires()) return;
  if (S.capital < action.cost || S.daysLeft < action.days) return;

  deckResetRequested = true;
  S.capital -= action.cost;
  S.daysLeft -= action.days;

  const supportBefore = S.support;
  const result = action.run();

  S.evidence = clamp(S.evidence, 0, 100);
  S.support  = clamp(S.support, 0, 100);

  log(result.text, result.kind);
  shiftPublicOpinion('move', supportBefore);
  checkPhase();
  if (!S.over && S.daysLeft === 0) endTurn('move');
  else render();
}

function checkPhase() {
  if (S.over) return;
  const threshold = MODES[S.mode].evidenceThreshold;

  if (S.phase === 'investigation' && S.evidence >= threshold) {
    S.phase = 'house';
    S.house = Math.floor(S.support / 4);
    log(msg`🏛️ Evidence threshold of ${threshold} met. Articles reported to the floor. You begin with ${S.house} committed votes.`, 'gold');
  }

  if (S.phase === 'house' && S.house >= 218) {
    S.phase = 'senate';
    S.senate = Math.floor(S.support / 8);
    log(msg`⚖️ The House votes to impeach. The Senate trial begins. You begin with ${S.senate} votes in the chamber.`, 'gold');
  }

  if (S.phase === 'senate' && S.senate >= 67) {
    finish(true, 'CONVICTED',
      'The Senate votes to convict. The Chief Justice administers the oath of removal. You did not change anyone\'s mind in a single afternoon — you built a record, one document at a time, until the record became impossible to ignore.');
  }
}

// Roll within a single event type; a positive event cannot replace the
// separate per-turn blowback roll. Every adverse event halves capital.
function rollEvent(tone) {
  const pool = EVENTS.filter(event => event.tone === tone);
  const total = pool.reduce((sum, event) => sum + event.w, 0);
  if (!pool.length || total <= 0) return;
  let roll = Math.random() * total;
  const chosen = pool.find(event => (roll -= event.w) < 0) || pool[pool.length - 1];
  const capitalBefore = S.capital;
  const result = chosen.run();
  if (tone === 'bad') S.capital = Math.floor(capitalBefore / 2);
  S.evidence = clamp(S.evidence, 0, 100);
  S.support = clamp(S.support, 0, 100);
  S.capital = clamp(S.capital, 0, 120);
  const label = tone === 'bad' ? 'BLOWBACK' : 'BREAKTHROUGH';
  log(msg`${label} — ${result.text}`, result.kind);
  if (tone === 'bad') log(msg`BLOWBACK — Political capital halved: ${capitalBefore} → ${S.capital} (rounded down).`, 'bad');
}

function resolveTurnEvents() {
  if (S.over || !S.mode) return;
  const mode = MODES[S.mode];
  // Resolve good news first: a later breakthrough cannot immediately undo
  // this month's halving. Recovery is credited before monthly event rolls.
  if (Math.random() < mode.positiveEventChance) rollEvent('good');
  // Exactly one adverse-event chance per completed monthly turn.
  if (Math.random() < mode.blowbackChance) {
    rollEvent('bad');
  } else {
    log('No blowback this turn. The administration fails to land a counterattack.', 'sys');
  }

}

function endTurn(source = 'manual') {
  if (S.over || !S.mode) return;
  if (source === 'manual') {
    if (isCalendarPaused()) return;
    const previousTurn = S.turn;
    syncCalendarClock();
    // A clock rollover during this click must not advance two months.
    if (S.over || S.turn !== previousTurn) return;
    // Adjourn deliberately skips the current month's unused time.
    CALENDAR_CLOCK.elapsedMs = 0;
    CALENDAR_CLOCK.lastNow = performance.now();
  }

  // Finish in the final month instead of displaying a phantom extra month.
  // No regeneration, post-deadline events or extra clock ticks after this.
  if (S.turn >= S.maxTurns) {
    S.daysLeft = 0;
    const why = S.phase === 'investigation'
      ? 'You never assembled enough evidence to report articles out of committee. The term ended with the boxes still unopened.'
      : S.phase === 'house'
        ? 'The vote count stalled short of 218. The articles die on the calendar.'
        : 'The Senate never reaches 67. The President is acquitted, declares victory, and fundraises off it.';
    finish(false, 'THE TERM ENDS', why);
    return;
  }

  const m = MODES[S.mode];
  const supportBeforeMonth = S.support;
  S.support = clamp(S.support - decayNow(), 0, 100);
  if (m.evidenceDecay && S.phase !== 'investigation') {
    S.evidence = clamp(S.evidence - m.evidenceDecay, 0, 100);
  }
  S.turn++;
  S.daysLeft = S.daysMax;
  S.capital = clamp(S.capital + rand(m.capitalRegen[0], m.capitalRegen[1]), 0, 120);
  log(msg`CALENDAR — ${dateMessage(currentDate().year, currentDate().month)}. New session days: ${S.daysMax}.`, 'sys');

  // One per-turn risk roll, regardless of whether clock, move or Adjourn
  // caused the rollover. Individual clock days do NOT stack extra blowback.
  resolveTurnEvents();
  S.supportChange = S.support - supportBeforeMonth;
  checkPhase();
  if (!S.over && S.support < 12) {
    finish(false, 'THE CASE COLLAPSES',
      'Public support falls below the floor. Members start avoiding the cameras. The articles are tabled indefinitely, and the whole thing becomes a cautionary tale told at staff retreats.');
    return;
  }
  render();
}

let lastVerdict = null;
function finish(won, headline, body) {
  if (S.over) return;
  lastVerdict = { won, headline, body };
  S.over = true;
  stopCalendarClock();
  render();

  const overlay = document.getElementById('overlay');
  const vt = document.getElementById('verdictText');
  vt.textContent = t(headline);
  vt.className = 'verdict ' + (won ? 'win' : 'lose');
  document.getElementById('verdictBody').textContent = t(body);
  window.Leaderboards?.onFinish(S, won);
  overlay.classList.add('show');
  document.getElementById('app').inert = true;
  overlay.querySelector('button').focus();
}

/* =========================================================
   START
   ========================================================= */
function startGame(modeId) {
  const m = MODES[modeId];
  if (!m) return;
  resetCalendarClock();

  S.mode = modeId;
  S.turn = 1;
  S.maxTurns = m.months;
  S.daysMax = m.daysPerMonth;
  S.daysLeft = m.daysPerMonth;
  S.phase = 'investigation';
  S.evidence = m.startEvidence;
  S.support = m.startSupport;
  S.supportChange = 0;
  S.capital = m.startCapital;
  S.house = 0;
  S.senate = 0;
  S.over = false;
  S.log = [];
  movePhaseKey = '';

  document.getElementById('startScreen').classList.remove('show');
  document.getElementById('app').inert = false;
  document.getElementById('overlay').classList.remove('show');

  const scandal = SCANDALS[rand(0, SCANDALS.length - 1)];
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'sys');
  log(msg`MODE: ${m.name} — ${m.tag}. The matter before the House: ${scandal}.`, 'sys');
  log(msg`The term ends ${termEndString()}. ${m.months} months, ${m.daysPerMonth} session days a month.`, 'sys');
  if (m.extendedToolkit) log('Extended Toolkit unlocked: 56 moves per phase instead of 28.', 'gold');
  log(msg`Blowback is checked after each monthly turn: ${Math.round(m.blowbackChance * 100)}% risk. Breakthroughs roll separately.`, 'sys');
  log('The calendar is live: 12 seconds of active play costs one session day. Moves also spend their listed days.', 'sys');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'sys');

  render();
  startCalendarClock();
  document.getElementById('clockPause').focus();
}


/* Mode selection is a briefing step; only the gavel starts gameplay. */
let selectedMode = null;
let startingSession = false;
function renderStartHint() {
  document.getElementById('startHint').textContent = startingSession
    ? t('The House will come to order…')
    : selectedMode ? tr`Selected: ${MODES[selectedMode].name}. The clock is stopped until you start.`
    : t('Select a mode above to enable Start. The clock is stopped.');
}
function selectMode(modeId) {
  if (startingSession || S.mode || !MODES[modeId]) return;
  selectedMode = modeId;
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === modeId));
  });
  document.getElementById('startButton').disabled = false;
  renderStartHint();
}
function beginSession() {
  if (!selectedMode || startingSession || S.mode) return;
  if (window.Leaderboards && !window.Leaderboards.prepareProfile()) return;
  startingSession = true;
  const button = document.getElementById('startButton');
  button.disabled = true;
  button.classList.add('striking');
  document.querySelectorAll('#startScreen [data-mode], #startScreen select, #startScreen input').forEach(el => { el.disabled = true; });
  renderStartHint();
  const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 740;
  setTimeout(() => startGame(selectedMode), delay);
}
document.getElementById('startButton').addEventListener('click', beginSession);
document.addEventListener('languagechange', () => {
  // Treat translation as a pause boundary, preserving the partial day.
  CALENDAR_CLOCK.lastNow = null;
  settleCarousel();
  if (S.mode) render();
  else renderCalendarClock();
  if (lastVerdict) {
    document.getElementById('verdictText').textContent = t(lastVerdict.headline);
    document.getElementById('verdictBody').textContent = t(lastVerdict.body);
  }
  renderStartHint();
});
// Both modal flows keep keyboard focus inside the active dialog.
document.addEventListener('keydown', event => {
  if (event.key !== 'Tab' || document.getElementById('leaderboardDialog')?.open) return;
  const dialog = document.querySelector('#startScreen.show, #overlay.show');
  if (!dialog) return;
  const items = [...dialog.querySelectorAll('button:not(:disabled), select:not(:disabled), input:not(:disabled), [tabindex="0"]')];
  if (!items.length) { event.preventDefault(); return; }
  const first = items[0], last = items[items.length - 1];
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
    event.preventDefault(); first.focus();
  }
});
renderStartHint();
document.querySelector('#startScreen select').focus();
