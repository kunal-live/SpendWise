/**
 * SpendWise — Bill Upload & Automatic Expense Categorization Test Suite
 * Validates all 12 phases, Section 4 (Rule 4), Section 15 (Security),
 * Section 16 (Duplicate Detection), and Section 20 (Learning from Feedback).
 */

import { validateBillFile, generateStorageKey, billStorage } from "../lib/bills/storage/bill-storage";
import { getDocumentExtractor } from "../lib/bills/document-extractor";
import { normalizeBillText, extractDate, extractMerchant, extractCurrency, cleanMerchantName } from "../lib/bills/normalizer";
import { classifyExpenseCategory } from "../lib/bills/classifier/classifier";
import { matchMerchantRule } from "../lib/bills/classifier/merchant-rules";
import { matchItemKeywords } from "../lib/bills/classifier/item-keyword-rules";
import { detectDuplicateBill, computeFileHash } from "../lib/bills/duplicate-detector";
import { billService, memoryBillStore } from "../lib/bills/bill-service";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testId: string, testName: string, failureReason?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testId}: ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testId}: ${testName}${failureReason ? ` -> ${failureReason}` : ""}`);
  }
}

async function runBillTestSuite() {
  console.log("============================================================================");
  console.log("    SPENDWISE BILL UPLOAD & AUTOMATIC CATEGORIZATION TEST SUITE");
  console.log("============================================================================\n");

  // --------------------------------------------------------------------------
  // 1. File Validation & Secure Storage
  // --------------------------------------------------------------------------
  console.log("--- 1. File Validation & Storage Test Cases ---");

  // TC-B01: Empty file rejected
  const emptyBuf = Buffer.alloc(0);
  const emptyVal = validateBillFile(emptyBuf, "image/jpeg", "bill.jpg");
  assert(!emptyVal.valid && Boolean(emptyVal.error?.includes("empty")), "TC-B01", "Empty file rejected with clear error");

  // TC-B02: File over 10 MB limit rejected
  const oversizeBuf = Buffer.alloc(11 * 1024 * 1024);
  const overVal = validateBillFile(oversizeBuf, "image/png", "large.png");
  assert(!overVal.valid && Boolean(overVal.error?.includes("10 MB")), "TC-B02", "File exceeding 10 MB limit rejected");

  // TC-B03: Magic bytes detection for PDF (%PDF-)
  const fakePdf = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
  const pdfVal = validateBillFile(fakePdf, "application/octet-stream", "doc.pdf");
  assert(pdfVal.valid && pdfVal.detectedMimeType === "application/pdf", "TC-B03", "PDF detected via magic bytes (%PDF)");

  // TC-B04: Magic bytes detection for PNG
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
  const pngVal = validateBillFile(pngHeader, "application/octet-stream", "receipt.png");
  assert(pngVal.valid && pngVal.detectedMimeType === "image/png", "TC-B04", "PNG detected via magic bytes (89 50 4E 47)");

  // TC-B05: Magic bytes detection for JPEG (FF D8 FF)
  const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
  const jpgVal = validateBillFile(jpegHeader, "application/octet-stream", "bill.jpg");
  assert(jpgVal.valid && jpgVal.detectedMimeType === "image/jpeg", "TC-B05", "JPEG detected via magic bytes (FF D8 FF)");

  // TC-B06: Unsupported file types rejected (e.g. .exe, .sh, .txt)
  const exeBuf = Buffer.from("MZThisIsNotABillExecutable");
  const exeVal = validateBillFile(exeBuf, "application/x-msdownload", "payload.exe");
  assert(!exeVal.valid && Boolean(exeVal.error?.includes("not supported")), "TC-B06", "Executable / unsupported files rejected");

  // TC-B07: Per-user isolated storage path generated
  const testUserId = "user_abc_123";
  const storageKey = generateStorageKey(testUserId, "bill_999", "invoice.pdf");
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  assert(
    storageKey.startsWith(`bills/users/${testUserId}/${year}/${month}/bill_bill_999.pdf`),
    "TC-B07",
    "Storage key follows per-user isolated prefix structure (bills/users/<user_id>/<year>/<month>/...)"
  );

  // TC-B08: User A cannot read User B's file in storage (Section 15: Security)
  await billStorage.saveBill("user_alice", "bill_secret", "alice_bill.pdf", fakePdf, "application/pdf");
  const aliceKey = generateStorageKey("user_alice", "bill_secret", "alice_bill.pdf");
  const unauthorizedRead = await billStorage.getBill(aliceKey, "user_bob");
  assert(unauthorizedRead === null, "TC-B08", "Cross-tenant file access blocked: User B cannot access User A's bill file");

  // --------------------------------------------------------------------------
  // 2. OCR / Document Extraction Layer
  // --------------------------------------------------------------------------
  console.log("\n--- 2. OCR & Document Extraction Test Cases ---");

  // TC-B09: DocumentExtractor abstraction interface
  const extractor = getDocumentExtractor();
  assert(
    typeof extractor.extract === "function" &&
    typeof extractor.extractFromPdf === "function" &&
    typeof extractor.extractFromImage === "function",
    "TC-B09",
    "DocumentExtractor interface conforms to provider abstraction"
  );

  // TC-B10: Extract text from PDF content stream
  const pdfSampleBuffer = Buffer.from(
    "%PDF-1.4\n" +
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n" +
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n" +
    "3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R >> endobj\n" +
    "4 0 obj << /Length 120 >>\n" +
    "stream\n" +
    "BT\n" +
    "/F1 12 Tf\n" +
    "(AMAZON RETAIL INDIA) Tj\n" +
    "(Invoice No: INV-98765) Tj\n" +
    "(Total: INR 2499.00) Tj\n" +
    "ET\n" +
    "endstream\n" +
    "endobj\n" +
    "trailer << /Root 1 0 R >> %%EOF"
  );
  const pdfExtractResult = await extractor.extract(pdfSampleBuffer, "application/pdf", "amazon.pdf");
  assert(
    pdfExtractResult.raw_text.includes("AMAZON") || pdfExtractResult.raw_text.includes("INV-98765"),
    "TC-B10",
    "PDF text operator streams extracted successfully"
  );

  // --------------------------------------------------------------------------
  // 3. Structured Normalization Layer
  // --------------------------------------------------------------------------
  console.log("\n--- 3. Structured Normalization Test Cases ---");

  const sampleAmazonBill = `
    AMAZON RETAIL INDIA PVT LTD
    Tax Invoice No: INV-12345
    Date: 30 Sep 2026
    
    Items:
    Nike T-Shirt        1       1499.00
    Jeans               1       1000.00
    
    Subtotal            2300.00
    GST (18%)            199.00
    Grand Total         2499.00
    
    Paid via UPI
  `;

  const normalized = normalizeBillText(sampleAmazonBill);

  // TC-B11: Merchant clean normalization
  assert(normalized.merchant === "Amazon", "TC-B11", `Merchant normalized from company name: got '${normalized.merchant}'`);

  // TC-B12: Invoice number extraction
  assert(normalized.invoice_number === "INV-12345", "TC-B12", `Invoice number extracted: got '${normalized.invoice_number}'`);

  // TC-B13: Date normalized to ISO YYYY-MM-DD
  assert(normalized.transaction_date === "2026-09-30", "TC-B13", `Date '30 Sep 2026' parsed to ISO '2026-09-30': got '${normalized.transaction_date}'`);

  // TC-B14: Date parsing across varied formats
  const dateFormats = [
    { input: "Invoice Date: 30/09/2026", expected: "2026-09-30" },
    { input: "Date: 2026-09-30", expected: "2026-09-30" },
    { input: "Billed on Sep 30, 2026", expected: "2026-09-30" },
    { input: "Date: 15-08-2026", expected: "2026-08-15" }
  ];
  let allDatesPass = true;
  for (const df of dateFormats) {
    const extracted = extractDate(df.input);
    if (extracted !== df.expected) allDatesPass = false;
  }
  assert(allDatesPass, "TC-B14", "Date parser correctly normalizes DD/MM/YYYY, ISO, and Month Name dates");

  // TC-B15: Total numeric amount parsed
  assert(normalized.total === 2499, "TC-B15", `Grand total amount extracted as 2499: got '${normalized.total}'`);

  // TC-B16: Subtotal, Tax, Discount separated
  assert(normalized.subtotal === 2300 && normalized.tax === 199, "TC-B16", `Subtotal (2300) and Tax (199) correctly separated`);

  // TC-B17: Line items extracted
  assert(
    normalized.items && normalized.items.length >= 2 && normalized.items.some(i => i.name.toLowerCase().includes("shirt")),
    "TC-B17",
    "Line items parsed with names, quantities, and prices"
  );

  // TC-B18: Payment method identified
  assert(normalized.payment_method === "UPI", "TC-B18", `Payment method identified as UPI: got '${normalized.payment_method}'`);

  // TC-B19: Currency detection
  const inrDetected = extractCurrency("Total: ₹1,500");
  const usdDetected = extractCurrency("Total: $45.00");
  assert(inrDetected === "INR" && usdDetected === "USD", "TC-B19", "Currency detected from symbols (₹ -> INR, $ -> USD)");

  // --------------------------------------------------------------------------
  // 4. Category Classification Engine & Crucial Rule 4
  // --------------------------------------------------------------------------
  console.log("\n--- 4. Category Classification Engine & Rule 4 Test Cases ---");

  // TC-B20: RULE 4: Amazon + Nike Shoes -> Clothing (NOT Shopping!)
  const amazonClothing = classifyExpenseCategory({
    merchant: "Amazon",
    items: [{ name: "Nike Running Shoes" }, { name: "Cotton T-shirt" }],
    billText: "Amazon Invoice Nike Running Shoes Cotton T-shirt Total 2499"
  });
  assert(
    amazonClothing.category === "Clothing" && amazonClothing.confidence >= 0.90,
    "TC-B20",
    `RULE 4: Amazon + Nike shoes classified as Clothing (confidence: ${amazonClothing.confidence * 100}%)`
  );

  // TC-B21: RULE 4: Amazon + Logitech Keyboard -> Electronics (NOT Shopping!)
  const amazonElectronics = classifyExpenseCategory({
    merchant: "Amazon",
    items: [{ name: "Logitech Wireless Keyboard" }, { name: "USB Mouse" }],
    billText: "Amazon Retail Logitech Wireless Keyboard USB Optical Mouse"
  });
  assert(
    amazonElectronics.category === "Electronics" && amazonElectronics.confidence >= 0.90,
    "TC-B21",
    `RULE 4: Amazon + Logitech keyboard classified as Electronics (confidence: ${amazonElectronics.confidence * 100}%)`
  );

  // TC-B22: RULE 4: Amazon + Grocery items -> Groceries (NOT Shopping!)
  const amazonGroceries = classifyExpenseCategory({
    merchant: "Amazon",
    items: [{ name: "Aashirvaad Atta 5kg" }, { name: "Toor Dal 1kg" }, { name: "Sunflower Oil" }],
    billText: "Amazon Fresh Aashirvaad Atta Toor Dal Sunflower Oil"
  });
  assert(
    amazonGroceries.category === "Groceries" && amazonGroceries.confidence >= 0.90,
    "TC-B22",
    `RULE 4: Amazon + Grocery items classified as Groceries (confidence: ${amazonGroceries.confidence * 100}%)`
  );

  // TC-B23: Dedicated merchant: Swiggy -> Food
  const swiggyMatch = classifyExpenseCategory({
    merchant: "Swiggy",
    billText: "Swiggy Order #98124 Paneer Butter Masala Naan"
  });
  assert(swiggyMatch.category === "Food" && swiggyMatch.confidence >= 0.90, "TC-B23", "Dedicated merchant: Swiggy maps to Food");

  // TC-B24: Dedicated merchant: Uber -> Transport
  const uberMatch = classifyExpenseCategory({
    merchant: "Uber",
    billText: "Uber Trip receipt Bengaluru to Airport"
  });
  assert(uberMatch.category === "Transport" && uberMatch.confidence >= 0.90, "TC-B24", "Dedicated merchant: Uber maps to Transport");

  // TC-B25: Dedicated merchant: Netflix -> Subscriptions
  const netflixMatch = classifyExpenseCategory({
    merchant: "Netflix",
    billText: "Netflix Monthly Premium Plan renewal"
  });
  assert(netflixMatch.category === "Subscriptions" && netflixMatch.confidence >= 0.90, "TC-B25", "Dedicated merchant: Netflix maps to Subscriptions");

  // TC-B26: Dedicated merchant: Apollo Pharmacy -> Healthcare
  const pharmacyMatch = classifyExpenseCategory({
    merchant: "Apollo Pharmacy",
    billText: "Apollo Pharmacy Dolo 650 Azithromycin Multivitamin"
  });
  assert(pharmacyMatch.category === "Healthcare" && pharmacyMatch.confidence >= 0.90, "TC-B26", "Dedicated merchant: Apollo Pharmacy maps to Healthcare");

  // TC-B27: Item keyword fallback: pizza -> Food
  const pizzaMatch = classifyExpenseCategory({
    merchant: "Corner Store",
    items: [{ name: "Large Farmhouse Pizza" }, { name: "Garlic Bread" }]
  });
  assert(pizzaMatch.category === "Food", "TC-B27", "Item keyword: pizza/garlic bread maps to Food");

  // TC-B28: Item keyword fallback: flight -> Travel
  const flightMatch = classifyExpenseCategory({
    merchant: "Travel Portal",
    items: [{ name: "Flight DEL to BLR" }]
  });
  assert(flightMatch.category === "Travel", "TC-B28", "Item keyword: flight booking maps to Travel");

  // TC-B29: Ambiguous bill produces lower confidence (< 0.70)
  const unknownBill = classifyExpenseCategory({
    merchant: "ABC Corporation General Services",
    items: [{ name: "Service Item 1" }]
  });
  assert(unknownBill.confidence < 0.70, "TC-B29", `Ambiguous bill flags low confidence (< 0.70): got ${unknownBill.confidence}`);

  // TC-B30: Section 20: Learning from User Corrections (Personalized Feedback)
  const userFeedbackCorrection = [
    {
      merchant: "Corner Cafe",
      itemSummary: "Coffee & Books",
      originalCategory: "Food",
      correctedCategory: "Education"
    }
  ];
  const learnedClassification = classifyExpenseCategory({
    merchant: "Corner Cafe",
    items: [{ name: "Coffee & Books" }],
    userCorrections: userFeedbackCorrection
  });
  assert(
    learnedClassification.category === "Education" &&
    learnedClassification.matchedBy === "user_correction" &&
    learnedClassification.confidence >= 0.95,
    "TC-B30",
    "Section 20: User correction history overrides default classification (Corner Cafe → Education)"
  );

  // --------------------------------------------------------------------------
  // 5. Duplicate Bill Detection
  // --------------------------------------------------------------------------
  console.log("\n--- 5. Duplicate Bill Detection Test Cases ---");

  const existingBills = [
    {
      id: "bill_existing_1",
      file_hash: computeFileHash(Buffer.from("sample bill content 123")),
      merchant: "Amazon",
      total: 2499,
      transaction_date: "2026-09-30",
      invoice_number: "INV-12345"
    }
  ];

  // TC-B31: Exact file hash match detected
  const hashDup = detectDuplicateBill({
    userId: "user_test",
    fileBuffer: Buffer.from("sample bill content 123"),
    merchant: "Amazon",
    total: 2499,
    transactionDate: "2026-09-30",
    existingBills
  });
  assert(hashDup.isDuplicate && hashDup.matchedBy === "file_hash", "TC-B31", "Duplicate detected by identical SHA-256 file hash");

  // TC-B32: Invoice number match detected
  const invDup = detectDuplicateBill({
    userId: "user_test",
    fileBuffer: Buffer.from("different binary file bytes 456"),
    merchant: "Amazon Retail",
    total: 2499,
    transactionDate: "2026-09-30",
    invoiceNumber: "INV-12345",
    existingBills
  });
  assert(invDup.isDuplicate && invDup.matchedBy === "invoice_number", "TC-B32", "Duplicate detected by matching Invoice #INV-12345");

  // TC-B33: Fingerprint match (Merchant + Date + Total)
  const fpDup = detectDuplicateBill({
    userId: "user_test",
    fileBuffer: Buffer.from("different bytes 789"),
    merchant: "Amazon",
    total: 2499,
    transactionDate: "2026-09-30",
    existingBills
  });
  assert(
    fpDup.isDuplicate &&
    fpDup.matchedBy === "fingerprint" &&
    Boolean(fpDup.message?.includes("₹2,499 Amazon bill")),
    "TC-B33",
    "Duplicate detected by composite fingerprint (Merchant + Date + Total) with friendly warning"
  );

  // TC-B34: Unique new bill not flagged as duplicate
  const newBillCheck = detectDuplicateBill({
    userId: "user_test",
    fileBuffer: Buffer.from("completely unique bill 999"),
    merchant: "Zomato",
    total: 450,
    transactionDate: "2026-10-01",
    invoiceNumber: "ZOM-9999",
    existingBills
  });
  assert(!newBillCheck.isDuplicate, "TC-B34", "Unique bill correctly passes without duplicate warning");

  // --------------------------------------------------------------------------
  // 6. End-to-End Bill Service & Confirmation
  // --------------------------------------------------------------------------
  console.log("\n--- 6. End-to-End Bill Service & Confirmation Test Cases ---");

  memoryBillStore.clear();

  // TC-B35: Full upload and process pipeline creates bill with status REVIEW_REQUIRED
  const uploadResult = await billService.processBillUpload({
    userId: "usr_alice_123",
    fileBuffer: Buffer.from("%PDF-1.4\nAMAZON RETAIL INDIA\nINV-554433\nDate: 30 Sep 2026\nNike T-Shirt 1499\nJeans 1000\nTotal 2499\nPaid via UPI\n%%EOF"),
    originalFilename: "amazon_shoes_jeans.pdf",
    mimeType: "application/pdf"
  });

  assert(
    uploadResult.bill.processing_status === "review_required" &&
    uploadResult.extracted.total === 2499 &&
    uploadResult.extracted.suggested_category === "Clothing",
    "TC-B35",
    "End-to-end bill upload pipeline successfully yields REVIEW_REQUIRED with extracted fields"
  );

  // TC-B36: Confirm bill atomically creates expense with source = 'bill_upload'
  const confirmResult = await billService.confirmBill(
    uploadResult.bill.id,
    {
      merchant: "Amazon",
      amount: 2499,
      category: "Clothing",
      transaction_date: "2026-09-30",
      payment_method: "UPI",
      notes: "Shopping on Amazon"
    },
    "usr_alice_123"
  );

  assert(
    confirmResult.expense.id.startsWith("exp_") &&
    confirmResult.expense.source === "bill_upload" &&
    confirmResult.expense.amount === 2499 &&
    confirmResult.bill.processing_status === "confirmed",
    "TC-B36",
    "Confirming bill updates status to CONFIRMED and atomically creates expense with source='bill_upload'"
  );

  // TC-B37: Double confirmation of already confirmed bill is rejected
  let doubleConfirmThrew = false;
  try {
    await billService.confirmBill(
      uploadResult.bill.id,
      {
        merchant: "Amazon",
        amount: 2499,
        category: "Clothing",
        transaction_date: "2026-09-30"
      },
      "usr_alice_123"
    );
  } catch (err: any) {
    if (err.message.includes("already been confirmed")) doubleConfirmThrew = true;
  }
  assert(doubleConfirmThrew, "TC-B37", "Double confirmation of confirmed bill rejected with 409 conflict error");

  // TC-B38: User correction learning recorded in feedback table
  const uploadForCorrection = await billService.processBillUpload({
    userId: "usr_alice_123",
    fileBuffer: Buffer.from("%PDF-1.4\nSuper Coffee Roasters\nCold Brew 350\nTotal 350\n%%EOF"),
    originalFilename: "coffee.pdf",
    mimeType: "application/pdf"
  });

  // User manually changes suggested "Food" to "Personal Expense"
  await billService.confirmBill(
    uploadForCorrection.bill.id,
    {
      merchant: "Super Coffee Roasters",
      amount: 350,
      category: "Personal Expense", // User correction!
      transaction_date: "2026-10-01"
    },
    "usr_alice_123"
  );

  const aliceFeedback = await billService.getUserFeedback("usr_alice_123");
  assert(
    aliceFeedback.some(f => f.corrected_category === "Personal Expense"),
    "TC-B38",
    "User category correction saved to classification_feedback for future adaptive learning"
  );

  // TC-B39: Unauthorized user cannot confirm another user's bill
  let unauthorizedConfirmBlocked = false;
  try {
    await billService.confirmBill(
      uploadForCorrection.bill.id,
      {
        merchant: "Super Coffee Roasters",
        amount: 350,
        category: "Personal Expense",
        transaction_date: "2026-10-01"
      },
      "usr_attacker_666" // Malicious third party
    );
  } catch (err: any) {
    unauthorizedConfirmBlocked = true;
  }
  assert(unauthorizedConfirmBlocked, "TC-B39", "Unauthorized user cannot access or confirm another user's bill");

  // TC-B40: Zero or negative amount rejected during confirmation
  let zeroAmountRejected = false;
  try {
    const uploadZero = await billService.processBillUpload({
      userId: "usr_alice_123",
      fileBuffer: Buffer.from("%PDF-1.4\nZero Bill\nTotal 0\n%%EOF"),
      originalFilename: "zero.pdf",
      mimeType: "application/pdf"
    });
    await billService.confirmBill(
      uploadZero.bill.id,
      {
        merchant: "Zero Bill",
        amount: 0,
        category: "Other",
        transaction_date: "2026-10-01"
      },
      "usr_alice_123"
    );
  } catch (err: any) {
    if (err.message.includes("greater than zero")) zeroAmountRejected = true;
  }
  assert(zeroAmountRejected, "TC-B40", "Zero or negative amounts rejected during expense confirmation");

  // --------------------------------------------------------------------------
  // Summary Scorecard
  // --------------------------------------------------------------------------
  console.log("\n============================================================================");
  console.log("            BILL UPLOAD & CATEGORIZATION TEST SCORECARD");
  console.log("============================================================================");
  console.log(`  TOTAL TESTS EXECUTED: ${totalTests}`);
  console.log(`  TESTS PASSED        : ${passedTests}`);
  console.log(`  TESTS FAILED        : ${failedTests}`);
  console.log(`  FEATURE READINESS   : ${failedTests === 0 ? "100% PRODUCTION READY ✓" : "FAILURES DETECTED ✗"}`);
  console.log("============================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runBillTestSuite().catch(err => {
  console.error("Test execution threw error:", err);
  process.exit(1);
});
