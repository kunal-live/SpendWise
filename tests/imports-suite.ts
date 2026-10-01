/**
 * SpendWise — Payment History & Bank Statement Import Test Suite
 * Validates Feature 2 (Sections 31–67 of prompt):
 * Parsers (CSV, Bank Statements, Payment Apps, PDF), Transaction Type Engine,
 * Merchant Normalization, Layered Categorization, Deduplication, Review Queue,
 * Atomic Confirmation, Expense Sources, and Reversible Undo Import.
 */

import { parseDelimitedText, findHeaderRowIndex } from "../lib/imports/parsers/csv-parser";
import { paymentAppParser } from "../lib/imports/parsers/payment-app-parser";
import { bankStatementParser } from "../lib/imports/parsers/bank-statement-parser";
import { pdfStatementParser } from "../lib/imports/parsers/pdf-statement-parser";
import { detectTransactionType } from "../lib/imports/type-detector";
import { normalizeMerchant } from "../lib/imports/merchant-normalizer";
import { evaluateTransactionDeduplication, isWithinDateTolerance } from "../lib/imports/deduplicator";
import { normalizeDateToIso, normalizeImportedTransaction } from "../lib/imports/normalizer";
import { importService, memoryImportStore } from "../lib/imports/import-service";
import { billService, memoryBillStore } from "../lib/bills/bill-service";
import { Expense } from "../lib/types";

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

async function runImportsTestSuite() {
  console.log("============================================================================");
  console.log("  SPENDWISE PAYMENT HISTORY & BANK STATEMENT IMPORT TEST SUITE (FEATURE 2)");
  console.log("============================================================================\n");

  // --------------------------------------------------------------------------
  // 1. File Parsers: Payment Apps & Bank Statements (Sections 32, 33, 50, 51, 52)
  // --------------------------------------------------------------------------
  console.log("--- 1. File Parsers & Extractors ---");

  // TC-I01: Google Pay CSV Export
  const gpayCsv = `Date,Description,Amount,Status,Transaction ID
28/09/2026,Swiggy,542.00,Completed,UPI123456789
29/09/2026,Uber India,280.00,Completed,UPI987654321
30/09/2026,Self Transfer to HDFC,5000.00,Completed,UPI555444333`;

  const gpayResult = paymentAppParser.parse("google_pay_sep2026.csv", gpayCsv);
  assert(
    gpayResult.transactions.length === 3 &&
    gpayResult.transactions[0].description === "Swiggy" &&
    gpayResult.transactions[0].amount === 542,
    "TC-I01",
    "Google Pay CSV parsed with 3 transactions and correct amounts"
  );

  // TC-I02: PhonePe CSV Export
  const phonePeCsv = `Date,Transaction Details,Type,Amount,UTR
2026-09-25,Zomato Food Order,DEBIT,450.00,UTR11223344
2026-09-26,Salary Credit,CREDIT,50000.00,UTR99887766`;

  const phonePeResult = paymentAppParser.parse("phonepe_statement.csv", phonePeCsv);
  assert(
    phonePeResult.transactions.length === 2 &&
    phonePeResult.transactions[0].debit === 450 &&
    phonePeResult.transactions[1].credit === 50000,
    "TC-I02",
    "PhonePe CSV parsed with DEBIT and CREDIT separation"
  );

  // TC-I03: HDFC Bank Statement CSV (with top metadata rows)
  const hdfcCsv = `HDFC BANK STATEMENT
Account No: XXXXXXXX1234
Customer: Kunal Jha
Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
01/09/2026,UPI-SWIGGY-12345,REF001,01/09/2026,542.00,,24580.00
02/09/2026,AMAZON PAY INDIA,REF002,02/09/2026,2499.00,,22081.00
03/09/2026,NEFT-SALARY-ABC PVT LTD,REF003,03/09/2026,,50000.00,72081.00
04/09/2026,ATM-WDL HDFC ATM KORAMANGALA,REF004,04/09/2026,2000.00,,70081.00`;

  const hdfcResult = bankStatementParser.parse("hdfc_sep.csv", hdfcCsv);
  assert(
    hdfcResult.transactions.length === 4 &&
    hdfcResult.accountIdentifier === "XXXX1234" &&
    hdfcResult.transactions[0].debit === 542 &&
    hdfcResult.transactions[2].credit === 50000,
    "TC-I03",
    "HDFC CSV parsed skipping header metadata, extracting masked account XXXX1234"
  );

  // TC-I04: ICICI Bank Statement CSV
  const iciciCsv = `Transaction Date,Value Date,Transaction Remarks,Withdrawal Amount (INR ),Deposit Amount (INR ),Balance (INR )
10/09/2026,10/09/2026,NETFLIX ENTERTAINMENT,649.00,,45000.00
12/09/2026,12/09/2026,UPI-REFUND-AMAZON,,499.00,45499.00`;

  const iciciResult = bankStatementParser.parse("icici_stmt.csv", iciciCsv);
  assert(
    iciciResult.transactions.length === 2 &&
    iciciResult.transactions[0].debit === 649 &&
    iciciResult.transactions[1].credit === 499,
    "TC-I04",
    "ICICI CSV parsed with withdrawal and deposit separation"
  );

  // TC-I05: Bank Statement PDF simulation (Text stream parsing)
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Length 200 >>
stream
BT
/F1 10 Tf
(01/09/2026 UPI-SWIGGY-12345 542.00 24580.00) Tj
(02/09/2026 AMAZON 2499.00 22081.00) Tj
(03/09/2026 SALARY CREDIT 50000.00 72081.00) Tj
ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;

  const pdfBuf = Buffer.from(pdfContent);
  const pdfResult = await pdfStatementParser.parse("bank_statement.pdf", pdfBuf);
  assert(
    pdfResult.transactions.length >= 2,
    "TC-I05",
    "Bank PDF statement parsed table rows via text extraction stream"
  );

  // --------------------------------------------------------------------------
  // 2. Transaction Type Detection & Debit vs Credit Rules (Sections 34, 35, 36, 58)
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Transaction Type Detection (Debit vs Credit Rules) ---");

  // TC-I06: Salary is Income, NOT an expense
  const tSalary = detectTransactionType("NEFT-SALARY-TECH CORP", "credit");
  assert(tSalary.type === "income" && tSalary.confidence >= 0.90, "TC-I06", "Salary credit detected as 'income'");

  // TC-I07: Refund is Refund, NOT income or expense
  const tRefund = detectTransactionType("UPI-REFUND-AMAZON REVERSAL", "credit");
  assert(tRefund.type === "refund" && tRefund.confidence >= 0.90, "TC-I07", "Amazon refund credit detected as 'refund'");

  // TC-I08: Self Transfer is Transfer, NOT an expense
  const tTransfer = detectTransactionType("UPI-SELF TRANSFER TO ICICI", "debit");
  assert(tTransfer.type === "transfer" && tTransfer.confidence >= 0.90, "TC-I08", "Self-transfer debit detected as 'transfer'");

  // TC-I09: ATM Cash Withdrawal is cash_withdrawal
  const tAtm = detectTransactionType("ATM-WDL INDIRANAGAR BANGALORE", "debit");
  assert(tAtm.type === "cash_withdrawal" && tAtm.confidence >= 0.95, "TC-I09", "ATM withdrawal detected as 'cash_withdrawal'");

  // TC-I10: Credit card bill payment is card_payment
  const tCred = detectTransactionType("CRED/CC PAYMENT/HDFC CARD", "debit");
  assert(tCred.type === "card_payment" && tCred.confidence >= 0.90, "TC-I10", "CRED payment detected as 'card_payment'");

  // TC-I11: Bank fees and service charges detected as fee
  const tFee = detectTransactionType("CONSOLIDATED CHARGES + GST", "debit");
  assert(tFee.type === "fee" && tFee.confidence >= 0.90, "TC-I11", "Consolidated charges detected as 'fee'");

  // TC-I12: Mutual Fund SIP / Investment
  const tInvest = detectTransactionType("ZERODHA BROKING LTD ACH", "debit");
  assert(tInvest.type === "investment" && tInvest.confidence >= 0.90, "TC-I12", "Zerodha debit detected as 'investment'");

  // TC-I13: Standard Merchant Debit is expense
  const tSwiggy = detectTransactionType("UPI-SWIGGY-BANGALORE", "debit");
  assert(tSwiggy.type === "expense" && tSwiggy.confidence >= 0.85, "TC-I13", "Swiggy food debit detected as 'expense'");

  // --------------------------------------------------------------------------
  // 3. Merchant Normalization (Section 37)
  // --------------------------------------------------------------------------
  console.log("\n--- 3. Merchant Normalization Engine ---");

  // TC-I14: "SWIGGY PVT LTD" -> "Swiggy"
  const m1 = normalizeMerchant("POS SWIGGY PVT LTD BANGALORE IN");
  assert(m1.merchant === "Swiggy" && m1.isKnownMerchant, "TC-I14", "SWIGGY PVT LTD normalized to canonical 'Swiggy'");

  // TC-I15: "ZOMATO ONLINE" -> "Zomato"
  const m2 = normalizeMerchant("UPI/ZOMATO ONLINE/paytm-123@paytm/Order");
  assert(m2.merchant === "Zomato" && m2.isKnownMerchant, "TC-I15", "ZOMATO ONLINE normalized to canonical 'Zomato'");

  // TC-I16: "UBER INDIA TECHNOLOGY" -> "Uber"
  const m3 = normalizeMerchant("UBER INDIA TECHNOLOGY PVT LTD");
  assert(m3.merchant === "Uber" && m3.isKnownMerchant, "TC-I16", "UBER INDIA normalized to canonical 'Uber'");

  // TC-I17: "AMAZON PAY INDIA" -> "Amazon"
  const m4 = normalizeMerchant("AMAZON PAY INDIA MUMBAI");
  assert(m4.merchant === "Amazon" && m4.isKnownMerchant, "TC-I17", "AMAZON PAY INDIA normalized to 'Amazon'");

  // TC-I18: "KIRANAKART TECH ZEPTO" -> "Zepto"
  const m5 = normalizeMerchant("KIRANAKART TECHNOLOGIES ZEPTO");
  assert(m5.merchant === "Zepto" && m5.suggestedCategory === "Groceries", "TC-I18", "Kiranakart Zepto mapped to 'Zepto' (Groceries)");

  // --------------------------------------------------------------------------
  // 4. Date Normalization (Section 7 & 34)
  // --------------------------------------------------------------------------
  console.log("\n--- 4. Date Normalization ---");

  // TC-I19: DD/MM/YYYY to ISO
  assert(normalizeDateToIso("30/09/2026") === "2026-09-30", "TC-I19", "DD/MM/YYYY converted to 2026-09-30");

  // TC-I20: DD-Mon-YYYY to ISO
  assert(normalizeDateToIso("05-Sep-2026") === "2026-09-05", "TC-I20", "DD-Mon-YYYY converted to 2026-09-05");

  // TC-I21: DD.MM.YYYY to ISO
  assert(normalizeDateToIso("15.08.2026") === "2026-08-15", "TC-I21", "DD.MM.YYYY converted to 2026-08-15");

  // --------------------------------------------------------------------------
  // 5. Cross-Source Deduplication (Section 44)
  // --------------------------------------------------------------------------
  console.log("\n--- 5. Deduplication Engine (UTR Priority + Composite Tolerance) ---");

  const existingExpensesList: Expense[] = [
    {
      id: "exp_existing_1",
      title: "Swiggy",
      merchant: "Swiggy",
      category: "Food",
      amount: 542,
      date: "2026-09-28",
      payment_method: "UPI",
      invoice_number: "UPI123456789"
    }
  ];

  // TC-I22: Exact match via reference ID (UTR)
  const dedupeExact = evaluateTransactionDeduplication(
    {
      userId: "test_user_1",
      referenceId: "UPI123456789",
      merchant: "Swiggy",
      amount: 542,
      date: "2026-09-28",
      direction: "debit"
    },
    existingExpensesList
  );
  assert(
    dedupeExact.status === "exact_duplicate" && dedupeExact.matchedExpenseId === "exp_existing_1",
    "TC-I22",
    "Exact duplicate detected via reference ID (UPI123456789)"
  );

  // TC-I23: Composite match within ±1 day tolerance
  const dedupeFuzzy = evaluateTransactionDeduplication(
    {
      userId: "test_user_1",
      merchant: "Swiggy",
      amount: 542,
      date: "2026-09-29", // 1 day after posting
      direction: "debit"
    },
    existingExpensesList
  );
  assert(
    dedupeFuzzy.status === "possible_duplicate" && Boolean(dedupeFuzzy.reason?.includes("±1 day")),
    "TC-I23",
    "Possible duplicate detected within ±1 day date window for ₹542 at Swiggy"
  );

  // TC-I24: Unique transaction
  const dedupeUnique = evaluateTransactionDeduplication(
    {
      userId: "test_user_1",
      merchant: "Uber",
      amount: 280,
      date: "2026-09-30",
      direction: "debit"
    },
    existingExpensesList
  );
  assert(dedupeUnique.status === "unique", "TC-I24", "Distinct transaction flagged as 'unique'");

  // --------------------------------------------------------------------------
  // 6. End-to-End Import Pipeline (Upload -> Stage -> Review -> Confirm)
  // --------------------------------------------------------------------------
  console.log("\n--- 6. End-to-End Import Service Pipeline ---");

  memoryImportStore.clear();
  memoryBillStore.clear();

  const testUserId = `usr_${crypto.randomUUID()}`;
  const statementCsvContent = `Date,Description,Withdrawal,Deposit,Ref No
01/09/2026,UPI-SWIGGY-ORDER,542.00,,UPI_SWIGGY_001
02/09/2026,AMAZON PAY INDIA,2499.00,,AMZN_002
03/09/2026,NEFT-SALARY-TECH CORP,,50000.00,SAL_003
04/09/2026,IMPS-SELF TRANSFER TO SBI,5000.00,,TRF_004
05/09/2026,NETFLIX SUBSCRIPTION,649.00,,NETFLIX_005
06/09/2026,ATM-WDL CASH WITHDRAWAL,2000.00,,ATM_006`;

  const uploadResult = await importService.processImportUpload({
    userId: testUserId,
    fileBuffer: Buffer.from(statementCsvContent),
    originalFilename: "hdfc_statement_september.csv",
    preferredSource: "HDFC Bank"
  });

  const batch = uploadResult.batch;
  const txns = uploadResult.transactions;

  // TC-I25: Batch staged successfully
  assert(
    batch.status === "review_required" && txns.length === 6,
    "TC-I25",
    "Upload processed and staged 6 transactions in status 'review_required'"
  );

  // TC-I26: Summary counts
  const summary = batch.summary;
  assert(
    summary.expensesDetected === 3 && // Swiggy (542), Amazon (2499), Netflix (649)
    summary.incomeDetected === 1 &&   // Salary (50000)
    summary.transfersDetected === 1 &&// Self Transfer (5000)
    summary.withdrawalsDetected === 1,// ATM WDL (2000)
    "TC-I26",
    `Summary correctly distinguished: 3 expenses, 1 income, 1 transfer, 1 withdrawal (Total: ${summary.totalTransactions})`
  );

  // TC-I27: Spending total excludes transfers and income
  const expectedSpend = 542 + 2499 + 649; // 3690
  assert(
    summary.totalExpenseAmount === expectedSpend,
    "TC-I27",
    `Detected spending ₹${summary.totalExpenseAmount} excludes ₹50,000 income and ₹5,000 transfer`
  );

  // TC-I28: Category assignments
  const swiggyTxn = txns.find(t => t.merchant === "Swiggy");
  const netflixTxn = txns.find(t => t.merchant === "Netflix");
  assert(
    swiggyTxn?.suggested_category === "Food" &&
    netflixTxn?.suggested_category === "Subscriptions",
    "TC-I28",
    "Swiggy mapped to Food and Netflix mapped to Subscriptions"
  );

  // --------------------------------------------------------------------------
  // 7. Review Queue & Bulk Actions (Section 40)
  // --------------------------------------------------------------------------
  console.log("\n--- 7. Review Queue & Bulk Actions ---");

  // TC-I29: Single transaction category edit
  const updatedTxn = await importService.updateTransaction(
    batch.id,
    swiggyTxn!.id,
    { selected_category: "Groceries" },
    testUserId
  );
  assert(
    updatedTxn?.selected_category === "Groceries" && updatedTxn.review_status === "edited",
    "TC-I29",
    "Single transaction category successfully edited to 'Groceries'"
  );

  // TC-I30: Bulk Assign Category
  const amazonTxn = txns.find(t => t.merchant === "Amazon");
  const modifiedCount = await importService.bulkUpdateTransactions(
    batch.id,
    [amazonTxn!.id],
    { selected_category: "Clothing" },
    testUserId
  );
  assert(modifiedCount === 1, "TC-I30", "Bulk update changed Amazon category to 'Clothing'");

  // TC-I31: Bulk Mark as Transfer
  const bulkTrfCount = await importService.bulkUpdateTransactions(
    batch.id,
    [amazonTxn!.id],
    { transaction_type: "transfer" },
    testUserId
  );
  const reloadedTxns = await importService.getBatchTransactions(batch.id, testUserId);
  const reloadedAmazon = reloadedTxns.find(t => t.id === amazonTxn!.id);
  assert(
    reloadedAmazon?.transaction_type === "transfer",
    "TC-I31",
    "Bulk Mark as Transfer changed Amazon to 'transfer', excluding it from spending"
  );

  // Revert Amazon back to expense for confirmation test
  await importService.updateTransaction(
    batch.id,
    amazonTxn!.id,
    { transaction_type: "expense", selected_category: "Shopping" },
    testUserId
  );

  // --------------------------------------------------------------------------
  // 8. Confirmation & Atomic Expense Creation (Sections 48, 49, 54)
  // --------------------------------------------------------------------------
  console.log("\n--- 8. Import Confirmation & Expense Sources ---");

  const confirmRes = await importService.confirmImport(batch.id, undefined, testUserId);

  // TC-I32: Only expenses are imported
  assert(
    confirmRes.importedCount === 3 && // Swiggy, Amazon, Netflix
    confirmRes.skippedCount === 3,    // Salary, Self Transfer, ATM Cash
    "TC-I32",
    "Confirmation created exactly 3 expenses, skipping 3 non-expenses (income/transfers/ATM)"
  );

  // TC-I33: Canonical expenses stored in expenses table with source='import'
  const createdExpenses = await billService.getUserExpenses(testUserId);
  assert(
    createdExpenses.length === 3 &&
    createdExpenses.every(e => e.source === "import"),
    "TC-I33",
    "3 expenses created in canonical expenses table with source='import'"
  );

  // TC-I34: Expense Sources audit trail created (Section 54)
  const sources = await importService.getUserExpenseSources(testUserId);
  assert(
    sources.length === 3 &&
    sources.every(s => s.import_batch_id === batch.id && s.source_name === "HDFC Bank"),
    "TC-I34",
    "3 reconciliation links created in expense_sources audit table with batch ID"
  );

  // TC-I35: Batch status updated to 'imported'
  const updatedBatch = await importService.getBatch(batch.id, testUserId);
  assert(
    updatedBatch?.status === "imported" && updatedBatch.created_expenses === 3,
    "TC-I35",
    "Batch status updated to 'imported' with created_expenses=3"
  );

  // --------------------------------------------------------------------------
  // 9. Import Reversibility ("Undo Import" - Section 55)
  // --------------------------------------------------------------------------
  console.log("\n--- 9. Import Reversibility (Undo Import) ---");

  // Add a manual expense that should NOT be deleted
  const manualExpense: Expense = {
    id: "manual_expense_keep_me",
    user_id: testUserId,
    title: "Manual Coffee",
    amount: 150,
    category: "Food",
    date: "2026-09-15",
    payment_method: "Cash",
    source: "manual"
  };
  await billService.createExpense(manualExpense);

  const beforeUndoExpenses = await billService.getUserExpenses(testUserId);
  assert(beforeUndoExpenses.length === 4, "TC-I36", "4 total expenses (3 imported + 1 manual) before undo");

  // Execute Reversible Undo Import
  const undoResult = await importService.undoImport(batch.id, testUserId);

  // TC-I37: 3 imported expenses removed
  assert(undoResult.undoneCount === 3, "TC-I37", "Undo import removed exactly 3 expenses");

  // TC-I38: Manual expense preserved!
  const afterUndoExpenses = await billService.getUserExpenses(testUserId);
  assert(
    afterUndoExpenses.length === 1 && afterUndoExpenses[0].id === "manual_expense_keep_me",
    "TC-I38",
    "Manual expense was preserved, only imported batch expenses were removed"
  );

  // TC-I39: Batch marked 'cancelled'
  const cancelledBatch = await importService.getBatch(batch.id, testUserId);
  assert(
    cancelledBatch?.status === "cancelled" && cancelledBatch.created_expenses === 0,
    "TC-I39",
    "Batch status transitioned to 'cancelled' with created_expenses=0"
  );

  // --------------------------------------------------------------------------
  // 10. User Isolation & Security (Section 56)
  // --------------------------------------------------------------------------
  console.log("\n--- 10. User Isolation & Security ---");

  const otherUserBatch = await importService.getBatch(batch.id, "unauthorized_other_user");
  assert(otherUserBatch === null, "TC-I40", "User B cannot access or view User A's import batch");

  // Summary
  console.log("\n============================================================================");
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log("============================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runImportsTestSuite().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
