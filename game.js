
/* =========================================================
   MODES
   ========================================================= */
const MODES = {
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
const ACTIONS = {

  investigation: [
    /* ---- shared ---- */
    {
      id: 'subpoena', name: '📁 Issue Subpoenas', cost: 12, days: 4,
      desc: 'Compel documents from the executive branch. Slow, unglamorous, decisive.',
      run() {
        const n = rand(8, 12); S.evidence += n;
        return { text: msg`Subpoena compliance produces ${n} new documents. ${OPENERS[rand(0,OPENERS.length-1)]}`, kind: 'good' };
      }
    },
    {
      id: 'hearing', name: '🎙️ Televised Hearing', cost: 16, days: 5,
      desc: 'Put witnesses under oath in prime time. Moves the needle both ways.',
      run() {
        S.evidence += 8; S.support += 7;
        return { text: 'A four-hour hearing airs uninterrupted. The clip of the day is devastating.', kind: 'good' };
      }
    },
    {
      id: 'whistle', name: '🧾 Whistleblower Deposition', cost: 14, days: 6,
      desc: 'Sworn testimony from inside the building. Highest evidentiary value.',
      run() {
        const n = rand(11, 16); S.evidence += n;
        return { text: msg`A career official testifies for six hours. ${n} new evidentiary items entered into the record.`, kind: 'good' };
      }
    },
    {
      id: 'court', name: '⚖️ Litigate the Privilege Claim', cost: 14, days: 8,
      desc: 'Take the administration to court. Cheap in capital, expensive on the calendar.',
      run() {
        if (Math.random() < 0.72) {
          const n = rand(14, 20); S.evidence += n;
          return { text: msg`The judge rejects the blanket privilege claim and orders production. ${n} new items land.`, kind: 'good' };
        }
        S.capital = clamp(S.capital - 6, 0, 120);
        return { text: 'The court kicks it to a slower track. You lose the calendar and six points of capital.', kind: 'bad' };
      }
    },
    {
      id: 'leak', name: '📰 Background to the Times', cost: 6, days: 1,
      desc: 'Trade a detail for a headline. Fast and cheap — but it can compromise the record.',
      run() {
        S.support += 6;
        if (Math.random() < 0.35) {
          S.evidence = clamp(S.evidence - 4, 0, 100);
          return { text: 'The story lands big. Opposing counsel now argues the leak tainted the evidence chain.', kind: 'bad' };
        }
        return { text: 'The story lands big. Cable spends forty-eight hours on a single paragraph.', kind: 'good' };
      }
    },
    {
      id: 'audit', name: '🔍 Forensic Audit of the Books', cost: 10, days: 5,
      desc: 'Accountants, not cameras. Quiet evidence, modest headlines.',
      run() {
        const n = rand(6, 9); S.evidence += n; S.support += 2;
        return { text: msg`The auditors find ${n} irregularities. Nobody tweets about it, but it holds up in court.`, kind: 'good' };
      }
    },
    {
      id: 'deputy', name: '🗂️ Deposition of the Deputy AG', cost: 12, days: 5,
      desc: 'A senior official who would rather not be there. Steady, unspectacular evidence.',
      run() {
        const n = rand(8, 11); S.evidence += n; S.support += 2;
        return { text: msg`The Deputy AG is deposed for five hours. ${n} new items, and one very long silence.`, kind: 'good' };
      }
    },

    /* ---- extended toolkit (4-year mode only) ---- */
    {
      id: 'cos', name: '🏛️ Depose the Chief of Staff', cost: 18, days: 7, extended: true,
      desc: 'The most senior testimony possible. High yield, high risk of a contempt fight.',
      run() {
        const n = rand(13, 18); S.evidence += n;
        if (Math.random() < 0.30) {
          S.support = clamp(S.support - 5, 0, 100);
          return { text: msg`${n} new items secured — but the contempt fight dominates the news and costs you five points.`, kind: 'bad' };
        }
        return { text: msg`The Chief of Staff testifies for seven hours. ${n} new evidentiary items.`, kind: 'good' };
      }
    },
    {
      id: 'counsel2', name: '⚖️ Request a Second Special Counsel', cost: 16, days: 8, extended: true,
      desc: 'A parallel investigation. Enormous upside if it lands, wasted calendar if it does not.',
      run() {
        if (Math.random() < 0.60) {
          const n = rand(18, 24); S.evidence += n;
          return { text: msg`A second counsel is appointed. The ${n} documents that follow are the best of the entire inquiry.`, kind: 'gold' };
        }
        S.capital = clamp(S.capital - 8, 0, 120);
        return { text: 'The appointment stalls in committee. Eight days and eight points of capital, gone.', kind: 'bad' };
      }
    },
    {
      id: 'forensic', name: '🧮 Independent Forensic Accountant', cost: 12, days: 5, extended: true,
      desc: 'Bring in outside expertise to trace the money. Unflashy, unimpeachable.',
      run() {
        const n = rand(9, 13); S.evidence += n;
        return { text: msg`The outside accountant follows the money through three shell entities. ${n} new items.`, kind: 'good' };
      }
    },
    {
      id: 'grandjury', name: '🕳️ Grand Jury Leak', cost: 8, days: 2, extended: true,
      desc: 'Feed the press from the grand jury. Big headlines, real legal exposure.',
      run() {
        S.support += 8;
        if (Math.random() < 0.50) {
          S.evidence = clamp(S.evidence - 6, 0, 100);
          return { text: 'The leak lands everywhere — and the judge opens an inquiry into the source. Six evidentiary items are tainted.', kind: 'bad' };
        }
        return { text: 'The leak dominates three consecutive news cycles. Nobody traces it back to you.', kind: 'good' };
      }
    },
    {
      id: 'intl', name: '🌍 International Records Request', cost: 14, days: 6, extended: true,
      desc: 'Foreign banking records take months but travel well in the record.',      run() {
        const n = rand(10, 15); S.evidence += n; S.support += 3;
        return { text: msg`Two foreign ministries comply. ${n} new items, and a very good photograph of a courier van.`, kind: 'good' };
      }
    },
    {
      id: 'shelter', name: '🛡️ Shelter a Second Whistleblower', cost: 15, days: 5, extended: true,
      desc: 'Protect a source, earn testimony. Also earns you a very angry letter from counsel.',
      run() {
        const n = rand(12, 18); S.evidence += n;
        return { text: msg`A second whistleblower is secured and sequestered. ${n} new items entered under seal.`, kind: 'good' };
      }
    },
    {
      id: 'resolution', name: '📜 Impeachment Inquiry Resolution', cost: 20, days: 9, extended: true,
      desc: 'Formalize the whole enterprise. Expensive in every currency you have.',
      run() {
        S.evidence += 15; S.support += 6;
        return { text: 'The resolution passes. The inquiry now has a name, a budget, and fifteen new evidentiary items.', kind: 'gold' };
      }
    }
  ],

  house: [
    /* ---- shared ---- */
    {
      id: 'markup', name: '📜 Committee Markup', cost: 10, days: 6,
      desc: 'Grind through the articles line by line. Reliable, incremental House votes.',
      run() { S.house += 25; return { text: 'The committee reports four articles to the floor after a nineteen-hour markup.', kind: 'good' }; }
    },
    {
      id: 'whip', name: '🗳️ Whip the Caucus', cost: 12, days: 4,
      desc: 'Work the vote count. Effectiveness scales with public support.',
      run() {
        const n = 15 + Math.floor(S.support / 3); S.house += n;
        return { text: msg`The whip count moves by ${n}. Three members who were "undecided" are no longer undecided.`, kind: 'good' };
      }
    },
    {
      id: 'address', name: '📺 Prime-Time Address', cost: 15, days: 3,
      desc: 'Make the case directly to the country from the Speaker\'s ceremonial office.',
      run() {
        S.support += 10; S.house += 10;
        return { text: 'Thirty-one million people watch. The next morning, the phones in the Capitol do not stop ringing.', kind: 'good' };
      }
    },
    {
      id: 'moderates', name: '🤝 Cut a Deal with Moderates', cost: 14, days: 5,
      desc: 'Narrow the articles to win swing districts. Buys votes, costs evidentiary scope.',
      run() {
        S.house += 30; S.evidence = clamp(S.evidence - 6, 0, 100);
        return { text: 'Two articles are dropped. The moderates sign on. The base calls it a surrender.', kind: 'good' };
      }
    },
    {
      id: 'base', name: '📣 Rally the Base', cost: 8, days: 2,
      desc: 'Fire up the people who already agree with you. Cheap votes, limited reach.',
      run() {
        S.support += 5; S.house += 12;
        return { text: 'The rally fills a stadium. The other side fills one too. Net gain, barely.', kind: 'good' };
      }
    },
    {
      id: 'debate', name: '⏱️ Floor Debate Marathon', cost: 12, days: 4,
      desc: 'Hours of argument on the record. Slow, steady vote movement.',
      run() {
        S.house += 18; S.support += 3;
        return { text: 'Eleven hours of debate, carried live on two networks. Eighteen votes move before midnight.', kind: 'good' };
      }
    },
    {
      id: 'scholars', name: '🎓 Constitutional Scholars Panel', cost: 9, days: 3,
      desc: 'Academics on the record. Modest votes, real legitimacy.',
      run() {
        S.house += 12; S.support += 4;
        return { text: 'Four constitutional scholars testify. The word "bribery" is used eleven times, on the record.', kind: 'good' };
      }
    },

    /* ---- extended toolkit ---- */
    {
      id: 'defwitness', name: '📂 Subpoena Defense Witnesses', cost: 14, days: 5, extended: true,
      desc: 'Force the other side\'s witnesses to testify early. Buys votes, muddies the record.',
      run() {
        S.house += 22; S.evidence = clamp(S.evidence - 5, 0, 100);
        return { text: 'Three defense witnesses are subpoenaed. The cross-examinations yield twenty-two votes.', kind: 'good' };
      }
    },
    {
      id: 'leakwhip', name: '📉 Leak the Whip Count', cost: 7, days: 2, extended: true,
      desc: 'Publish the tally early. Pressure works — until it backfires.',
      run() {
        S.house += 14;
        if (Math.random() < 0.40) {
          S.support = clamp(S.support - 5, 0, 100);
          return { text: 'The leaked tally moves fourteen votes — and five members are furious about being counted.', kind: 'bad' };
        }
        return { text: 'The leaked tally moves fourteen votes. Nobody complains on the record.', kind: 'good' };
      }
    },
    {
      id: 'freshman', name: '🌱 Court the Freshman Class', cost: 11, days: 4, extended: true,
      desc: 'The newest members are the most movable. And the most afraid of a primary.',
      run() {
        S.house += 20;
        return { text: 'A closed-door session with the freshman class. Twenty votes, and one very sincere hug.', kind: 'good' };
      }
    },
    {
      id: 'briefing', name: '🔐 The Closed-Door Briefing', cost: 16, days: 5, extended: true,
      desc: 'Show the holdouts what you actually have. Nothing leaks. That is the point.',
      run() {
        S.house += 26; S.support += 4;
        return { text: 'Ninety minutes, no phones, no staff. Twenty-six votes and not a single leak.', kind: 'good' };
      }
    },
    {
      id: 'retire', name: '🚪 Retire a Ranking Member', cost: 18, days: 6, extended: true,
      desc: 'Remove an obstacle from the committee. Effective, and it will be remembered.',
      run() {
        S.house += 30; S.support = clamp(S.support - 6, 0, 100);
        return { text: 'The ranking member steps down. Thirty votes unlock. Six points of goodwill evaporate.', kind: 'bad' };
      }
    },
    {
      id: 'coalition', name: '🤝 Cross-Party Coalition', cost: 20, days: 7, extended: true,
      desc: 'Bring the other side\'s moderates aboard. Huge vote swing, smaller evidentiary scope.',
      run() {
        S.house += 35; S.evidence = clamp(S.evidence - 4, 0, 100);
        return { text: 'Six members from the other party sign a joint statement. Thirty-five votes move in a day.', kind: 'gold' };
      }
    },
    {
      id: 'rules', name: '📋 Rules Committee End-Run', cost: 15, days: 4, extended: true,
      desc: 'Change the procedure to change the outcome. Sometimes the gavel slips.',
      run() {
        S.house += 24;
        if (Math.random() < 0.25) {
          S.capital = clamp(S.capital - 8, 0, 120);
          return { text: 'The end-run works for twenty-four votes — then a point of order costs you eight capital.', kind: 'bad' };
        }
        return { text: 'The rule passes on a party-line vote. Twenty-four votes follow it through the door.', kind: 'good' };
      }
    }
  ],

  senate: [
    /* ---- shared ---- */
    {
      id: 'swing', name: '🎯 Court the Swing Six', cost: 18, days: 5,
      desc: 'The whole trial comes down to six senators. Work them individually.',
      run() {
        const n = 4 + Math.floor(S.support / 10); S.senate += n;
        return { text: msg`You secure ${n} more votes. One senator asks, twice, whether this is "really worth it."`, kind: 'good' };
      }
    },
    {
      id: 'pressure', name: '📢 Public Pressure Campaign', cost: 12, days: 4,
      desc: 'Constituent calls, op-eds, and hometown town halls. Slow, but it moves the room.',
      run() {
        S.support += 8; S.senate += 5;
        return { text: 'Senate offices report record call volume. Two switchboards go down.', kind: 'good' };
      }
    },
    {
      id: 'backroom', name: '🚬 The Backroom Deal', cost: 22, days: 5,
      desc: 'A committee chairmanship, a bridge, a promise. Effective and slightly nauseating.',
      run() {
        S.senate += 12; S.evidence = clamp(S.evidence - 8, 0, 100);
        return { text: 'A deal is struck in a room with no windows. You get the votes. You will not enjoy it.', kind: 'good' };
      }
    },
    {
      id: 'bombshell', name: '💣 The Late Bombshell', cost: 15, days: 3,
      desc: 'Requires Evidence ≥ 85. The one document nobody has seen yet.',
      requires: () => S.evidence >= 85,
      lockedMsg: 'Requires Evidence ≥ 85',
      run() {
        S.senate += 15; S.support += 10;
        return { text: 'The document is entered into the record at 9:41 PM. The chamber goes silent. Six votes move overnight.', kind: 'gold' };
      }
    },
    {
      id: 'constitution', name: '🏛️ The Constitutional Argument', cost: 10, days: 3,
      desc: 'Remind the Senate what "high crimes and misdemeanors" has always meant.',
      run() {
        S.senate += 6; S.support += 3;
        return { text: 'Your closing argument quotes the 1974 committee report. Two senators take notes.', kind: 'good' };
      }
    },
    {
      id: 'closing', name: '📝 Trial Manager\'s Closing', cost: 13, days: 4,
      desc: 'The last word on the record. Persuasive if the case is already strong.',
      run() {
        S.senate += 7; S.support += 4;
        return { text: 'Ninety minutes, no notes. The chamber is quiet for the first time in six weeks.', kind: 'good' };
      }
    },
    {
      id: 'editorial', name: '📰 Hometown Editorial Blitz', cost: 11, days: 3,
      desc: 'Buy the opinion pages back home. Cheaper than a rally and harder to ignore.',
      run() {
        S.senate += 6; S.support += 5;
        return { text: 'Fourteen editorial boards endorse conviction in a single week. Two senators stop taking questions.', kind: 'good' };
      }
    },

    /* ---- extended toolkit ---- */
    {
      id: 'audit_sen', name: '🔎 Senator-by-Senator Audit', cost: 16, days: 5, extended: true,
      desc: 'A full workup on every undecided vote. Expensive, methodical, effective.',
      run() {
        S.senate += 8; S.support += 3;
        return { text: 'The audit identifies four soft votes and two that will never move. You stop wasting time on the two.', kind: 'good' };
      }
    },
    {
      id: 'recusal', name: '⚖️ The Recusal Motion', cost: 14, days: 4, extended: true,
      desc: 'Move to recuse a presiding officer. All upside if it lands, all cost if it does not.',
      run() {
        if (Math.random() < 0.55) {
          S.senate += 10;
          return { text: 'The motion is granted. Ten votes shift the moment the gavel comes down.', kind: 'gold' };
        }
        S.support = clamp(S.support - 6, 0, 100);
        return { text: 'The motion fails on a party-line vote. Six points of public support go with it.', kind: 'bad' };
      }
    },
    {
      id: 'recall', name: '🎙️ Prime-Time Witness Recall', cost: 18, days: 5, extended: true,
      desc: 'Bring the best witness back for the cameras. The country is watching again.',
      run() {
        S.senate += 11; S.support += 6;
        return { text: 'The witness returns, and this time the networks carry it live. Eleven votes and six points of support.', kind: 'good' };
      }
    },
    {
      id: 'resign', name: '🤐 Negotiate the Resignation', cost: 24, days: 7, extended: true,
      desc: 'Skip the trial. Offer an exit. It works — and the record goes with him.',
      run() {
        S.senate += 14; S.evidence = clamp(S.evidence - 10, 0, 100);
        return { text: 'A resignation is negotiated in principle. Fourteen votes secure. Ten evidentiary items are sealed forever.', kind: 'gold' };
      }
    },
    {
      id: 'nuclear', name: '☢️ The Constitutional Nuclear Option', cost: 20, days: 5, extended: true,
      desc: 'Threaten the institution itself. It moves votes and costs you the moral high ground.',
      run() {
        S.senate += 9; S.support = clamp(S.support - 5, 0, 100);
        return { text: 'The threat is made on the record. Nine votes move. Five points of goodwill do not come back.', kind: 'bad' };
      }
    },
    {
      id: 'packing', name: '🎲 Court-Packing Leverage', cost: 12, days: 4, extended: true,
      desc: 'Remind a few senators what happens if this drags on. Blunt, and it sometimes backfires.',
      run() {
        S.senate += 7;
        if (Math.random() < 0.30) {
          S.capital = clamp(S.capital - 6, 0, 120);
          return { text: 'The leverage works for seven votes — and costs you six capital in favors called in.', kind: 'bad' };
        }
        return { text: 'The leverage works. Seven votes move, and nobody puts it in writing.', kind: 'good' };
      }
    },
    {
      id: 'immunity', name: '🕊️ The Immunity Offer', cost: 19, days: 6, extended: true,
      desc: 'Trade a prosecution for a conviction. The vote count goes up; the record gets thinner.',
      run() {
        S.senate += 12; S.evidence = clamp(S.evidence - 6, 0, 100);
        return { text: 'Immunity is offered and accepted. Twelve votes secure. Six evidentiary items are withdrawn.', kind: 'good' };
      }
    }
  ]
};

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
  { w: 1, tone: 'bad', run() { S.capital = clamp(S.capital - rand(6, 10), 0, 120);
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
   Keep cards stable within a phase so a move never resets
   scroll position or steals keyboard focus during a render.
   No autoplay: players decide when the cards move.
   ========================================================= */
const moveTrack = document.getElementById('actions');
const moveDots = document.getElementById('moveDots');
let movePhaseKey = '';
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

function renderMoves() {
  const actions = availableActions();
  const phaseKey = `${S.mode}:${S.phase}:${language}`;
  if (movePhaseKey !== phaseKey) {
    const hadFocus = moveTrack.contains(document.activeElement);
    movePhaseKey = phaseKey;
    settleCarousel();
    moveTrack.replaceChildren();
    moveDots.replaceChildren();
    moveTrack.dataset.selectedIndex = '0';
    actions.forEach((action, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'action';
      button.dataset.moveId = action.id;
      button.innerHTML = `
        ${action.extended ? `<span class="ext">${t('EXT')}</span>` : ''}
        <span class="name">${t(action.name)}</span>
        <span class="desc"></span>
        <span class="cost">◈ ${tr`Capital: ${action.cost}`} <span class="sep">·</span> <span class="days">⏱ ${tr`Days: ${action.days}`}</span></span>
        <span class="move-status"></span>`;
      button.onclick = () => doAction(action);
      moveTrack.appendChild(button);
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'move-dot';
      dot.setAttribute('aria-label', tr`Show move ${index + 1}: ${action.name}`);
      dot.title = tr`Move ${index + 1}: ${action.name}`;
      dot.setAttribute('aria-controls', 'actions');
      dot.onclick = () => scrollToMove(index);
      moveDots.appendChild(dot);
    });
    moveTrack.scrollTo({ left: 0, behavior: 'instant' });
    if (hadFocus) moveTrack.focus({ preventScroll: true });
  }
  let playable = 0;
  const paused = isCalendarPaused();
  actions.forEach((action, index) => {
    const button = moveTrack.children[index];
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
    button.querySelector('.move-status').textContent = t(status);
    button.setAttribute('aria-label', tr`${action.name}. Move ${index + 1} of ${actions.length}. ${status}. Capital: ${action.cost}. Days: ${action.days}. ${action.desc}`);
  });
  document.getElementById('movesSummary').textContent = tr`Moves: ${actions.length} · Available: ${playable}`;
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

  S.capital -= action.cost;
  S.daysLeft -= action.days;

  const result = action.run();

  S.evidence = clamp(S.evidence, 0, 100);
  S.support  = clamp(S.support, 0, 100);

  log(result.text, result.kind);
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
// separate per-turn blowback roll. Effect sizes remain those of the original.
function rollEvent(tone) {
  const pool = EVENTS.filter(event => event.tone === tone);
  const total = pool.reduce((sum, event) => sum + event.w, 0);
  if (!pool.length || total <= 0) return;
  let roll = Math.random() * total;
  const chosen = pool.find(event => (roll -= event.w) < 0) || pool[pool.length - 1];
  const result = chosen.run();
  S.evidence = clamp(S.evidence, 0, 100);
  S.support = clamp(S.support, 0, 100);
  S.capital = clamp(S.capital, 0, 120);
  const label = tone === 'bad' ? 'BLOWBACK' : 'BREAKTHROUGH';
  log(msg`${label} — ${result.text}`, result.kind);
}

function resolveTurnEvents() {
  if (S.over || !S.mode) return;
  const mode = MODES[S.mode];
  // Exactly one adverse-event chance per completed monthly turn.
  if (Math.random() < mode.blowbackChance) {
    rollEvent('bad');
  } else {
    log('No blowback this turn. The administration fails to land a counterattack.', 'sys');
  }
  // A separate opportunity preserves positive developments.
  if (Math.random() < mode.positiveEventChance) rollEvent('good');
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
  lastVerdict = { won, headline, body };
  S.over = true;
  stopCalendarClock();
  render();

  const overlay = document.getElementById('overlay');
  const vt = document.getElementById('verdictText');
  vt.textContent = t(headline);
  vt.className = 'verdict ' + (won ? 'win' : 'lose');
  document.getElementById('verdictBody').textContent = t(body);
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
  if (m.extendedToolkit) log('Extended Toolkit unlocked: 14 moves per phase instead of 7.', 'gold');
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
  startingSession = true;
  const button = document.getElementById('startButton');
  button.disabled = true;
  button.classList.add('striking');
  document.querySelectorAll('#startScreen [data-mode], #startScreen select').forEach(el => { el.disabled = true; });
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
  if (event.key !== 'Tab') return;
  const dialog = document.querySelector('#startScreen.show, #overlay.show');
  if (!dialog) return;
  const items = [...dialog.querySelectorAll('button:not(:disabled), select:not(:disabled), [tabindex="0"]')];
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
