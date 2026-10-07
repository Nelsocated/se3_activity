"use strict";

const { join } = require("path");

// =====================================================================
// SE 2123 – Module 4 Activity: CPU PRINT HUB REFACTOR (Part A – JavaScript)
// STARTER FILE — rename to LastNameFirstInitial_PrintHub.js
// Run: node LastNameFirstInitial_PrintHub.js
// Name: Lago, Nelson III & Tingson, Reinwel   Section: BSSE 2
// =====================================================================

// REFLECTION (answer in 1–2 sentences each, right here in the comments)
// Q1: Name one piece of your new code that can now be reused or tested on its
//     own, which was impossible inside the old handlePrintJob.
//     Answer: computeCost can now be used and tested by itself, for example to
//     just check a price without validating or formatting anything. Before, the
//     pricing was stuck inside handlePrintJob together with everything else.

// Q2: Your version creates a NEW job object at each step instead of changing
//     the old one. What does that cost in memory, and who cleans it up in JavaScript?
//     Answer: It costs a bit of extra memory because the old and new objects
//     exist at the same time for a while. JavaScript's garbage collector frees
//     the old objects automatically once nothing refers to them anymore.

// ---------------------------------------------------------------------
// PROVIDED: Prices and print queue – DO NOT EDIT
// ---------------------------------------------------------------------
const RATES = { bw: 2, color: 10 }; // ₱ per page
const BULK_PAGES = 20; // 20 pages or more ...
const BULK_DISCOUNT = 0.1; // ... gets 10% off

const deepFreeze = (obj) => {
  Object.values(obj).forEach(
    (v) => typeof v === "object" && v !== null && deepFreeze(v),
  );
  return Object.freeze(obj);
};

const queue = deepFreeze([
  { id: "P01", student: "Ana", pages: 12, color: false },
  { id: "P02", student: "Ben", pages: 25, color: false },
  { id: "P03", student: "Carlo", pages: 0, color: true },
  { id: "P04", student: "Dana", pages: 5, color: true },
  { id: "P05", student: "Eli", pages: 20, color: true },
]);

// ---------------------------------------------------------------------
// PROVIDED: The OLD code you are replacing – DO NOT EDIT
// One big function that validates, prices, discounts, AND formats,
// and it MUTATES the job it receives. (Try calling it on the frozen queue!)
// ---------------------------------------------------------------------
function handlePrintJob(job) {
  if (job.pages <= 0) {
    job.status = "REJECTED";
    return "REJECTED: " + job.id + " has no pages";
  }
  job.cost = job.pages * (job.color ? 10 : 2);
  if (job.pages >= 20) job.cost = job.cost * 0.9;
  job.status = "READY";
  return `${job.id} | ${job.student} | ${job.pages} pages | ${job.color ? "COLOR" : "B&W"} | ₱${job.cost.toFixed(2)}`;
}

// ---------------------------------------------------------------------
// PROVIDED: Notification service (a black box) – DO NOT EDIT
// You only know its interface: notify(student, message). You don't know
// (or care) whether it sends SMS, email, or push.
// ---------------------------------------------------------------------
const NotificationService = (() => {
  const outbox = [];
  return {
    notify: (student, message) => {
      outbox.push(`[to ${student}] ${message}`);
    },
    sentCount: () => outbox.length,
    last: () => outbox[outbox.length - 1],
  };
})();

// ======================= START OF YOUR CODE =======================
// Rules: no for, while, push, or delete below, and do not call handlePrintJob.
// Every function returns a NEW value — never change the job you receive.
// Use RATES, BULK_PAGES, and BULK_DISCOUNT instead of typing 2, 10, 20, 0.9.

// ---------- LEVEL 1: Small, focused functions (one job each) ----------
// isValidJob :: Job -> Boolean          (true when pages > 0)
const isValidJob = (job) => job.pages > 0; // TODO

// computeCost :: Job -> Job             (new job with cost = pages × rate)
const computeCost = (job) => ({
  ...job,
  cost: job.pages * (job.color ? RATES.color : RATES.bw),
}); // TODO

// applyBulkDiscount :: Job -> Job       (10% off when pages >= BULK_PAGES)
const applyBulkDiscount = (job) =>
  job.pages >= BULK_PAGES
    ? { ...job, cost: job.cost * (1 - BULK_DISCOUNT) }
    : { ...job }; // TODO

// formatReceipt :: Job -> String
//   "P04 | Dana | 5 pages | COLOR | ₱50.00"   (B&W jobs show "B&W")
const formatReceipt = (job) =>
  `${job.id} | ${job.student} | ${job.pages} pages | ${job.color ? "COLOR" : "B&W"} | ₱${job.cost.toFixed(2)}`; // TODO

// formatRejection :: Job -> String
//   "REJECTED: P03 has no pages"
const formatRejection = (job) => `REJECTED: ${job.id} has no pages`; // TODO

// ---------- LEVEL 2: Integration with pipe() ----------
// pipe :: (...Functions) -> a -> b      (Module 3, Example 2.1)
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((result, fn) => fn(result), x); // TODO

// priceJob :: Job -> Job                (pipe of computeCost and applyBulkDiscount)
const priceJob = pipe(computeCost, applyBulkDiscount); // TODO

// processJob :: Job -> String           (pipe of priceJob and formatReceipt)
const processJob = pipe(priceJob, formatReceipt); // TODO

// processQueue :: [Job] -> [String]
//   valid jobs -> processJob, invalid jobs -> formatRejection
const processQueue = (jobs) =>
  jobs.map((job) => (isValidJob(job) ? processJob(job) : formatRejection(job))); // TODO

// ---------- LEVEL 3: The top layer (system integration) ----------
// runPrintHub :: [Job] -> { receipts: [String], totalSales: Number }
//   1. receipts   = processQueue(jobs)
//   2. notify each student with their receipt line using
//      NotificationService.notify(student, message)
//   3. totalSales = sum of the prices of VALID jobs (filter + map + reduce)
const runPrintHub = (jobs) => {
  const receipts = processQueue(jobs);

  jobs.forEach((job, index) =>
    NotificationService.notify(job.student, receipts[index]),
  );

  const totalSales = jobs
    .filter(isValidJob)
    .map(priceJob)
    .map((job) => job.cost)
    .reduce((sum, cost) => sum + cost, 0);

  return { receipts, totalSales };
}; // TODO

// ======================== END OF YOUR CODE ========================

// ---------------------------------------------------------------------
// PROVIDED: Report + self-check – DO NOT EDIT
// ---------------------------------------------------------------------
function printReport() {
  const before = JSON.stringify(queue);
  const sentBefore = NotificationService.sentCount();
  const { receipts, totalSales } = runPrintHub(queue);
  console.log("=== CPU PRINT HUB REPORT ===");
  receipts.forEach((line) => console.log("  " + line));
  console.log(`TOTAL SALES: ₱${Number(totalSales).toFixed(2)}`);
  console.log(
    `NOTIFICATIONS SENT: ${NotificationService.sentCount() - sentBefore}`,
  );
  console.log(
    `QUEUE UNCHANGED: ${JSON.stringify(queue) === before ? "YES" : "NO"}`,
  );
}

function selfCheck() {
  const fs = require("fs");
  const copy = (x) => JSON.parse(JSON.stringify(x));
  const legacy = queue.map((job) => handlePrintJob(copy(job)));
  const fz = (o) => Object.freeze({ ...o });
  const levels = [
    [
      "Level 1 - Small functions",
      [
        () => isValidJob(queue[0]) === true && isValidJob(queue[2]) === false,
        () =>
          computeCost(fz(queue[0])).cost === 24 &&
          computeCost(fz(queue[3])).cost === 50,
        () => {
          const j = fz(queue[0]);
          const r = computeCost(j);
          return r !== j && j.cost === undefined;
        },
        () => applyBulkDiscount(fz({ ...queue[1], cost: 50 })).cost === 45,
        () => applyBulkDiscount(fz({ ...queue[0], cost: 24 })).cost === 24,
        () =>
          formatReceipt({ ...queue[3], cost: 50 }) ===
          "P04 | Dana | 5 pages | COLOR | ₱50.00",
        () => formatRejection(queue[2]) === "REJECTED: P03 has no pages",
      ],
    ],
    [
      "Level 2 - pipe() integration",
      [
        () =>
          pipe(
            (x) => x + 1,
            (x) => x * 2,
          )(3) === 8,
        () => priceJob(queue[4]).cost === 180,
        () => processJob(queue[1]) === legacy[1],
        () => JSON.stringify(processQueue(queue)) === JSON.stringify(legacy),
      ],
    ],
    [
      "Level 3 - Top layer",
      [
        () => runPrintHub(queue).receipts.length === 5,
        () => Math.abs(runPrintHub(queue).totalSales - 299) < 1e-9,
        () => {
          const n = NotificationService.sentCount();
          runPrintHub(queue);
          return NotificationService.sentCount() - n === 5;
        },
        () => {
          runPrintHub(queue);
          return NotificationService.last() === `[to Eli] ${legacy[4]}`;
        },
      ],
    ],
  ];

  console.log("\n=== SELF-CHECK ===");
  let passed = 0,
    total = 0;
  levels.forEach(([name, tests]) => {
    const ok = tests.filter((t) => {
      try {
        return t() === true;
      } catch (e) {
        return false;
      }
    }).length;
    passed += ok;
    total += tests.length;
    console.log(
      `${ok === tests.length ? "PASS" : "FAIL"}  ${name} (${ok}/${tests.length})`,
    );
  });
  const yours = fs
    .readFileSync(__filename, "utf8")
    .split("START OF YOUR CODE")[1]
    .split("END OF YOUR CODE")[0]
    .replace(/\/\/.*$/gm, "");
  const rule =
    !/\bfor\s*\(|\bwhile\s*\(|\.push\s*\(|\bhandlePrintJob\b|\bdelete\s/.test(
      yours,
    );
  console.log(
    `${rule ? "PASS" : "FAIL"}  Rule: no for / while / push / delete, and no calls to handlePrintJob`,
  );
  console.log(
    `SCORE: ${passed}/${total} checks${rule ? "" : "  (rule violated)"}`,
  );
}

try {
  printReport();
} catch (e) {
  console.log("Report could not run yet:", e.message);
}
selfCheck();
