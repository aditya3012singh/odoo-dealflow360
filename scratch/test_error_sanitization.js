const INTERNAL_DB_PATTERNS = [
  /prisma/i,
  /prismaclient/i,
  /invocation/i,
  /unique constraint/i,
  /foreign key constraint/i,
  /null constraint/i,
  /syntax error/i,
  /syntaxerror/i,
  /prepared statement/i,
  /database/i,
  /postgres/i,
  /econnrefused/i,
  /relation .* does not exist/i,
  /table .* does not exist/i,
  /column .* does not exist/i,
  /\.ts:\d+/i,
  /\.js:\d+/i,
  /stack trace/i,
];

function sanitizeErrorMessage(rawMessage) {
  if (!rawMessage) return 'Internal server error. Please try again later.';
  const str = String(rawMessage);
  const isInternal = INTERNAL_DB_PATTERNS.some((p) => p.test(str));
  return isInternal ? 'Internal server error. Please try again later.' : str;
}

console.log('=== TESTING ERROR SANITIZATION ===');

// Test 1: Prisma invocation error
const prismaError = 'Invalid `prisma.quotation.create()` invocation in quotation.service.ts:32:46. Unique constraint failed on (quotationNumber)';
console.log('Test 1 (Prisma):', sanitizeErrorMessage(prismaError));

// Test 2: Raw Postgres database error
const pgError = 'relation "quotation_items" does not exist at character 45 in database';
console.log('Test 2 (Postgres):', sanitizeErrorMessage(pgError));

// Test 3: Standard user validation error (MUST BE PRESERVED)
const validError = 'Discount percentage cannot exceed 100%';
console.log('Test 3 (Validation):', sanitizeErrorMessage(validError));

// Test 4: Auth error (MUST BE PRESERVED)
const authError = 'Invalid email or password';
console.log('Test 4 (Auth):', sanitizeErrorMessage(authError));

if (
  sanitizeErrorMessage(prismaError) === 'Internal server error. Please try again later.' &&
  sanitizeErrorMessage(pgError) === 'Internal server error. Please try again later.' &&
  sanitizeErrorMessage(validError) === validError &&
  sanitizeErrorMessage(authError) === authError
) {
  console.log('\n[PASS] All error sanitization rules verified successfully!');
} else {
  console.error('\n[FAIL] Sanitization mismatch!');
  process.exit(1);
}
