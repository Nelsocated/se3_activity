// =====================================================================
// SE 2123 – Module 3 Activity: CANTEEN PRE-ORDER CHECKER
// STARTER FILE — rename to LastNameFirstInitial_CanteenFP.js
// Run: node LastNameFirstInitial_CanteenFP.js
// Name: ______________________   Section: ________
// =====================================================================

// REFLECTION (answer in 1–2 sentences each, right here in the comments)
// Q1: Why does lookupPrice go into the pipeline with chain(), while addTotal
//     is applied with map()? What would go wrong if you used map() for lookupPrice?
//     Answer:
// Q2: Why do the validation steps return Either instead of Maybe?
//     Answer:

// ---------------------------------------------------------------------
// PROVIDED: Containers from Module 3 (Examples 1.3 and 1.5) – DO NOT EDIT
// ---------------------------------------------------------------------
const Just = (value) => ({
  map: (fn) => Maybe(fn(value)),
  chain: (fn) => fn(value),
  fold: (onNothing, onJust) => onJust(value),
});
const Nothing = {
  map: () => Nothing,
  chain: () => Nothing,
  fold: (onNothing) => onNothing(),
};
const Maybe = (value) =>
  value === null || value === undefined ? Nothing : Just(value);

const Left = (error) => ({
  map: () => Left(error),
  chain: () => Left(error),
  fold: (onLeft) => onLeft(error),
});
const Right = (value) => ({
  map: (fn) => Right(fn(value)),
  chain: (fn) => fn(value),
  fold: (onLeft, onRight) => onRight(value),
});

// ---------------------------------------------------------------------
// PROVIDED: Data – DO NOT EDIT
// ---------------------------------------------------------------------
const MENU = {
  adobo: 75,
  sinigang: 85,
  pancit: 60,
  lumpia: 40,
  "halo-halo": 55,
};
const MAX_QTY = 10;

const rawOrders = [
  { id: "A01", student: "Ana", item: "adobo", qty: "2" },
  { id: "A02", student: "Ben", item: "Sinigang ", qty: "1" },
  { id: "A03", student: "Carlo", item: "pizza", qty: "1" },
  { id: "A04", student: "Dana", qty: "3" },
  { id: "A05", student: "Eli", item: "pancit", qty: "abc" },
  { id: "A06", student: "Faye", item: "lumpia", qty: "12" },
  { id: "A07", student: "Gio", item: "halo-halo", qty: "3" },
  { id: "A08", student: "Hana", item: "  LUMPIA", qty: "4" },
];

// ======================= START OF YOUR CODE =======================
// Rules: no if, try/catch, for, or while below. Use map / chain / fold,
// the ternary operator ( ? : ), and the spread operator ( {...order} ).
// Never modify the original order objects — always return a new one.

// ---------- LEVEL 1: Maybe (Just / Nothing) ----------
// getItemName :: Order -> Maybe String
// Wrap order.item in Maybe, then use map() to trim and lowercase it.
const getItemName = (order) =>
  Maybe(order.item).map((item) => item.trim().toLowerCase()); // TODO

// requireItem :: Order -> Either String Order
// fold the Maybe from getItemName:
//   Nothing -> Left("<id>: Missing item")
//   Just    -> Right(new order with the cleaned item name)
const requireItem = (order) =>
  getItemName(order).fold(
    () => Left(`${order.id}: Missing item`),
    (item) => Right({ ...order, item }),
  ); // TODO

// ---------- LEVEL 2: Either (Right / Left) ----------
// lookupPrice :: Order -> Either String Order
//   item not in MENU -> Left('<id>: "<item>" is not on the menu')
//   otherwise        -> Right(new order with a price field)
const lookupPrice = (order) =>
  Object.prototype.hasOwnProperty.call(MENU, order.item)
    ? Right({ ...order, price: MENU[order.item] })
    : Left(`${order.id}: "${order.item}" is not on the menu`); // TODO

// parseQty :: Order -> Either String Order
//   qty is not a whole number >= 1 -> Left("<id>: Invalid quantity")
//   otherwise -> Right(new order where qty is a Number)
const parseQty = (order) =>
  Number.isInteger(Number(order.qty)) && Number(order.qty) >= 1
    ? Right({ ...order, qty: Number(order.qty) })
    : Left(`${order.id}: Invalid quantity`); // TODO

// checkLimit :: Order -> Either String Order
//   qty > MAX_QTY -> Left("<id>: Max 10 per order")
const checkLimit = (order) =>
  Number(order.qty) > MAX_QTY
    ? Left(`${order.id}: Max 10 per order`)
    : Right(order); // TODO

// addTotal :: Order -> Order   (plain function — NOT a container)
//   returns a new order with total = price * qty
const addTotal = (order) => ({ ...order, total: order.price * order.qty }); // TODO

// ---------- LEVEL 3: pipeK + map vs. chain ----------
// pipeK :: (...(a -> Either e b)) -> a -> Either e b
// Same idea as Module 3 Example 2.3, but start the reduce with Right(input).
const pipeK =
  (...fns) =>
  (input) =>
    fns.reduce((acc, fn) => acc.chain(fn), Right(input)); // TODO

// validateOrder :: Order -> Either String Order
// Glue the four checks together with pipeK (order matters!).
const validateOrder = pipeK(requireItem, lookupPrice, parseQty, checkLimit); // TODO

// processOrder :: Order -> Either String Order
// validateOrder, then add the total. chain() or map()? You decide.
const processOrder = (order) => validateOrder(order).map(addTotal); // TODO

// ---------- LEVEL 4: Batch report with map / filter / reduce ----------
// buildReport :: [Order] -> { valid: [String], rejected: [String], totalSales: Number }
//   valid    -> "A01 Ana: 2 x adobo = ₱150"   (one string per valid order)
//   rejected -> "A03: \"pizza\" is not on the menu" (the Left message)
//   totalSales -> sum of all valid totals (use reduce + fold)
// Hint: r.fold(() => false, () => true) tells you if r is a Right.
const isRight = (r) =>
  r.fold(
    () => false,
    () => true,
  );

const buildReport = (orders) => {
  const results = orders.map(processOrder);
  const goods = results.filter(isRight);
  const bads = results.filter((r) => !isRight(r));
  return {
    valid: goods.map((r) =>
      r.fold(
        () => "",
        (o) => `${o.id} ${o.student}: ${o.qty} x ${o.item} = ₱${o.total}`,
      ),
    ),
    rejected: bads.map((r) =>
      r.fold(
        (err) => err,
        () => "",
      ),
    ),
    totalSales: goods.reduce(
      (sum, r) =>
        sum +
        r.fold(
          () => 0,
          (o) => o.total,
        ),
      0,
    ),
  };
};

// ======================== END OF YOUR CODE ========================

// ---------------------------------------------------------------------
// PROVIDED: Report printer + self-check – DO NOT EDIT
// ---------------------------------------------------------------------
function printReport(report) {
  console.log("=== CPU CANTEEN PRE-ORDER REPORT ===");
  console.log(`VALID ORDERS (${report.valid.length})`);
  report.valid.forEach((line) => console.log("  " + line));
  console.log(`REJECTED ORDERS (${report.rejected.length})`);
  report.rejected.forEach((line) => console.log("  " + line));
  console.log(`TOTAL SALES: ₱${report.totalSales}`);
}

function selfCheck() {
  const fs = require("fs");
  const show = (c) =>
    c.fold(
      (e) => `Left(${e})`,
      (v) => `Right(${JSON.stringify(v)})`,
    );
  const showMaybe = (m) =>
    m.fold(
      () => "Nothing",
      (v) => `Just(${v})`,
    );
  const levels = [
    [
      "Level 1 - Maybe",
      [
        () => showMaybe(getItemName({ item: "  Adobo " })) === "Just(adobo)",
        () => showMaybe(getItemName({ id: "X" })) === "Nothing",
        () =>
          requireItem({ id: "X", item: " Pancit" }).fold(
            () => false,
            (o) => o.item === "pancit",
          ),
        () => show(requireItem({ id: "X" })) === "Left(X: Missing item)",
      ],
    ],
    [
      "Level 2 - Either",
      [
        () =>
          lookupPrice({ id: "X", item: "adobo" }).fold(
            () => false,
            (o) => o.price === 75,
          ),
        () =>
          show(lookupPrice({ id: "X", item: "pizza" })) ===
          'Left(X: "pizza" is not on the menu)',
        () =>
          parseQty({ id: "X", qty: "3" }).fold(
            () => false,
            (o) => o.qty === 3,
          ),
        () =>
          ["abc", "0", "2.5", undefined].every(
            (q) =>
              show(parseQty({ id: "X", qty: q })) ===
              "Left(X: Invalid quantity)",
          ),
        () =>
          show(checkLimit({ id: "X", qty: 11 })) ===
          "Left(X: Max 10 per order)",
        () =>
          checkLimit({ id: "X", qty: 10 }).fold(
            () => false,
            () => true,
          ),
        () => {
          const o = { price: 75, qty: 2 };
          const r = addTotal(o);
          return r.total === 150 && o.total === undefined;
        },
      ],
    ],
    [
      "Level 3 - pipeK",
      [
        () =>
          show(
            pipeK(
              (n) => Right(n + 1),
              (n) => Right(n * 2),
            )(3),
          ) === "Right(8)",
        () =>
          show(
            pipeK(
              (n) => Left("stop"),
              (n) => Right(n * 2),
            )(3),
          ) === "Left(stop)",
        () =>
          processOrder(rawOrders[0]).fold(
            () => false,
            (o) => o.total === 150,
          ),
        () =>
          processOrder(rawOrders[7]).fold(
            () => false,
            (o) => o.item === "lumpia" && o.total === 160,
          ),
        () =>
          show(processOrder(rawOrders[5])) === "Left(A06: Max 10 per order)",
      ],
    ],
    [
      "Level 4 - Report",
      [
        () => buildReport(rawOrders).valid.length === 4,
        () => buildReport(rawOrders).rejected.length === 4,
        () => buildReport(rawOrders).totalSales === 560,
        () => rawOrders[1].item === "Sinigang " && rawOrders[5].qty === "12", // original data untouched
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

  const src = fs.readFileSync(__filename, "utf8");
  const yours = src
    .split("START OF YOUR CODE")[1]
    .split("END OF YOUR CODE")[0]
    .replace(/\/\/.*$/gm, "");
  const rule = !/\bif\s*\(|\btry\s*\{|\bfor\s*\(|\bwhile\s*\(/.test(yours);
  console.log(
    `${rule ? "PASS" : "FAIL"}  Rule: no if / try-catch / for / while in your code`,
  );
  console.log(
    `SCORE: ${passed}/${total} checks${rule ? "" : "  (rule violated)"}`,
  );
}

try {
  printReport(buildReport(rawOrders));
} catch (e) {
  console.log("Report could not run yet:", e.message);
}
selfCheck();
