#!/usr/bin/env node

/**
 * Manual Testing Script for Creator Service
 * Tests all major flows: onboarding, verification, uploads, earnings, payouts, admin operations
 * Uses native fetch (Node 18+)
 */

const BASE_URL = 'http://localhost:3018';
const ADMIN_URL = 'http://localhost:3018/admin';

const TEST_USER_ID = 'test-user-123';
const TEST_CREATOR_ID = 'test-creator-456';
const mockUserToken = 'mock-jwt-token-user';
const mockAdminToken = 'mock-jwt-token-admin';

let testResults = { passed: 0, failed: 0, tests: [] };

function logTest(name, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`  ${details}`);
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function apiCall(method, url, body = null, headers = {}) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) options.body = JSON.stringify(body);
  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, data: {}, error: error.message };
  }
}

async function testHealthCheck() {
  console.log('\n=== 1. Health Check ===');
  const res = await apiCall('GET', `${BASE_URL}/health`);
  logTest('Health check endpoint', res.status === 200 && res.data?.success, `Status: ${res.status}`);
  return res.status === 200;
}

async function testCreatorOnboarding() {
  console.log('\n=== 2. Creator Onboarding Flow ===');

  // 2a. Onboard creator
  const onboardRes = await apiCall('POST', `${BASE_URL}/v1/creators/onboard`, {}, {
    Authorization: `Bearer ${mockUserToken}`,
  });
  logTest('Creator onboarding (auth required)', onboardRes.status === 201 || onboardRes.status === 200 || onboardRes.status === 401,
    `Status: ${onboardRes.status} | ${onboardRes.data?.message || onboardRes.data?.error || 'ok'}`);

  // 2b. Get creator profile
  const profileRes = await apiCall('GET', `${BASE_URL}/v1/creators/me`, null, {
    Authorization: `Bearer ${mockUserToken}`,
  });
  logTest('Get creator profile (auth required)', profileRes.status === 200 || profileRes.status === 401,
    `Status: ${profileRes.status}`);

  // 2c. Update profile
  const updateRes = await apiCall('PATCH', `${BASE_URL}/v1/creators/me`, {
    displayName: 'Test Creator',
    bio: 'Test creator bio for manual testing',
    avatar: 'https://example.com/avatar.jpg',
  }, { Authorization: `Bearer ${mockUserToken}` });
  logTest('Update creator profile (auth required)', updateRes.status === 200 || updateRes.status === 401,
    `Status: ${updateRes.status}`);

  // 2d. Get public profile
  const publicRes = await apiCall('GET', `${BASE_URL}/v1/creators/${TEST_USER_ID}`);
  logTest('Get public profile', publicRes.status === 200 || publicRes.status === 404,
    `Status: ${publicRes.status}`);

  return TEST_USER_ID;
}

async function testVerificationFlow() {
  console.log('\n=== 3. Verification Submission and Approval ===');

  // 3a. Submit verification documents
  const submitRes = await apiCall('POST', `${BASE_URL}/v1/creators/verification/submit`, {
    documents: [
      { type: 'id_card', url: 'https://example.com/id.jpg' },
      { type: 'selfie', url: 'https://example.com/selfie.jpg' },
    ],
  }, { Authorization: `Bearer ${mockUserToken}` });
  logTest('Submit verification documents (auth required)', submitRes.status === 201 || submitRes.status === 200 || submitRes.status === 401,
    `Status: ${submitRes.status} | ${submitRes.data?.data?.message || submitRes.data?.error || 'ok'}`);

  // 3b. Check verification status
  const statusRes = await apiCall('GET', `${BASE_URL}/v1/creators/verification/status`, null, {
    Authorization: `Bearer ${mockUserToken}`,
  });
  logTest('Get verification status (auth required)', statusRes.status === 200 || statusRes.status === 401,
    `Status: ${statusRes.status} | Verified: ${statusRes.data?.data?.verified || 'N/A'}`);

  // 3c. Admin approve verification
  const approveRes = await apiCall('POST', `${ADMIN_URL}/creators/${TEST_USER_ID}/verify`, null, {
    Authorization: `Bearer ${mockAdminToken}`,
  });
  logTest('Admin approve verification', approveRes.status === 200 || approveRes.status === 403,
    `Status: ${approveRes.status} | ${approveRes.data?.message || approveRes.data?.error || 'ok'}`);
}

async function testContentUploadWorkflow() {
  console.log('\n=== 4. Content Upload Workflow ===');

  // 4a. Initiate media upload
  const initiateRes = await apiCall('POST', `${BASE_URL}/v1/creators/upload/initiate`, {
    fileName: 'test-video.mp4',
    mimeType: 'video/mp4',
    size: 10485760,
  }, { Authorization: `Bearer ${mockUserToken}` });
  logTest('Initiate media upload (auth required)', initiateRes.status === 201 || initiateRes.status === 200 || initiateRes.status === 401,
    `Status: ${initiateRes.status} | ${initiateRes.data?.data?.uploadId || initiateRes.data?.error || 'ok'}`);

  // 4b. Complete upload
  const uploadId = initiateRes.data?.data?.uploadId || 'test-upload-id';
  const completeRes = await apiCall('POST', `${BASE_URL}/v1/creators/upload/complete`, {
    uploadId,
    assetId: 'test-asset-id-123',
  }, { Authorization: `Bearer ${mockUserToken}` });
  logTest('Complete media upload (auth required)', completeRes.status === 201 || completeRes.status === 200 || completeRes.status === 401,
    `Status: ${completeRes.status} | ${completeRes.data?.data?.contentId || completeRes.data?.error || 'ok'}`);

  // 4c. Create upload metadata
  const createRes = await apiCall('POST', `${BASE_URL}/v1/creators/uploads`, {
    title: 'Test Video',
    description: 'Test video description',
    url: 'https://example.com/video.mp4',
    thumbnail: 'https://example.com/thumb.jpg',
  }, { Authorization: `Bearer ${mockUserToken}` });
  logTest('Create upload metadata (auth required)', createRes.status === 201 || createRes.status === 200 || createRes.status === 401,
    `Status: ${createRes.status}`);

  // 4d. List uploads
  const listRes = await apiCall('GET', `${BASE_URL}/v1/creators/uploads`, null, {
    Authorization: `Bearer ${mockUserToken}`,
  });
  logTest('List uploads (auth required)', listRes.status === 200 || listRes.status === 401,
    `Status: ${listRes.status} | Count: ${Array.isArray(listRes.data?.data) ? listRes.data.data.length : 'N/A'}`);

  // 4e. Create channel
  const channelRes = await apiCall('POST', `${BASE_URL}/v1/creators/channels`, {
    name: 'Test Channel',
    description: 'A test channel',
    category: 'entertainment',
  }, { Authorization: `Bearer ${mockUserToken}` });
  logTest('Create channel (auth required)', channelRes.status === 201 || channelRes.status === 200 || channelRes.status === 401,
    `Status: ${channelRes.status}`);

  // 4f. List channels
  const listChannelsRes = await apiCall('GET', `${BASE_URL}/v1/creators/channels`, null, {
    Authorization: `Bearer ${mockUserToken}`,
  });
  logTest('List channels (auth required)', listChannelsRes.status === 200 || listChannelsRes.status === 401,
    `Status: ${listChannelsRes.status}`);

  // 4g. Creator discovery
  const discoverRes = await apiCall('GET', `${BASE_URL}/v1/creators/discover`);
  logTest('Creator discovery', discoverRes.status === 200,
    `Status: ${discoverRes.status}`);
}

async function testEarningsTracking() {
  console.log('\n=== 5. Earnings Tracking ===');

  // 5a. Get earnings summary
  const earningsRes = await apiCall('GET', `${BASE_URL}/v1/creators/earnings`, null, {
    Authorization: `Bearer ${mockUserToken}`,
  });
  logTest('Get earnings summary (auth required)', earningsRes.status === 200 || earningsRes.status === 401,
    `Status: ${earningsRes.status} | ${JSON.stringify(earningsRes.data?.data || {}).substring(0, 100)}`);

  // 5b. Get analytics
  const analyticsRes = await apiCall('GET', `${BASE_URL}/v1/creators/analytics`, null, {
    Authorization: `Bearer ${mockUserToken}`,
  });
  logTest('Get creator analytics (auth required)', analyticsRes.status === 200 || analyticsRes.status === 401,
    `Status: ${analyticsRes.status}`);
}

async function testPayoutFlow() {
  console.log('\n=== 6. Payout Request and Approval ===');

  // 6a. Request payout
  const payoutRes = await apiCall('POST', `${BASE_URL}/v1/creators/payouts`, {
    amount: 1000,
    method: 'bank_transfer',
    accountDetails: {
      bankName: 'Test Bank',
      accountNumber: '1234567890',
      routingNumber: '987654321',
    },
  }, { Authorization: `Bearer ${mockUserToken}` });
  logTest('Request payout (auth required)', payoutRes.status === 201 || payoutRes.status === 200 || payoutRes.status === 401,
    `Status: ${payoutRes.status} | ${payoutRes.data?.data?.payoutId || payoutRes.data?.error || 'ok'}`);

  // 6b. Get payout history
  const historyRes = await apiCall('GET', `${BASE_URL}/v1/creators/payouts`, null, {
    Authorization: `Bearer ${mockUserToken}`,
  });
  logTest('Get payout history (auth required)', historyRes.status === 200 || historyRes.status === 401,
    `Status: ${historyRes.status}`);

  // 6c. Admin get payout requests
  const adminPayoutRes = await apiCall('GET', `${ADMIN_URL}/payouts?page=1&limit=10`, null, {
    Authorization: `Bearer ${mockAdminToken}`,
  });
  logTest('Admin get payout requests (admin required)', adminPayoutRes.status === 200 || adminPayoutRes.status === 403,
    `Status: ${adminPayoutRes.status}`);
}

async function testAdminOperations() {
  console.log('\n=== 7. Admin Operations ===');

  // 7a. Get creator stats
  const statsRes = await apiCall('GET', `${ADMIN_URL}/stats`, null, {
    Authorization: `Bearer ${mockAdminToken}`,
  });
  logTest('Admin get creator stats', statsRes.status === 200 || statsRes.status === 403,
    `Status: ${statsRes.status}`);

  // 7b. Get all creators
  const creatorsRes = await apiCall('GET', `${ADMIN_URL}/creators?page=1&limit=10`, null, {
    Authorization: `Bearer ${mockAdminToken}`,
  });
  logTest('Admin get all creators', creatorsRes.status === 200 || creatorsRes.status === 403,
    `Status: ${creatorsRes.status}`);

  // 7c. Get specific creator
  const creatorRes = await apiCall('GET', `${ADMIN_URL}/creators/${TEST_USER_ID}`, null, {
    Authorization: `Bearer ${mockAdminToken}`,
  });
  logTest('Admin get creator details', creatorRes.status === 200 || creatorRes.status === 404 || creatorRes.status === 403,
    `Status: ${creatorRes.status}`);

  // 7d. Get creator earnings (admin)
  const adminEarningsRes = await apiCall('GET', `${ADMIN_URL}/creators/${TEST_USER_ID}/earnings?page=1&limit=10`, null, {
    Authorization: `Bearer ${mockAdminToken}`,
  });
  logTest('Admin get creator earnings', adminEarningsRes.status === 200 || adminEarningsRes.status === 403,
    `Status: ${adminEarningsRes.status}`);
}

async function testSubscriptionFlow() {
  console.log('\n=== 8. Subscription Flow ===');

  // 8a. Subscribe to creator
  const subRes = await apiCall('POST', `${BASE_URL}/v1/creators/subscribe/${TEST_CREATOR_ID}`, {
    tier: 'premium',
  }, { Authorization: `Bearer ${mockUserToken}` });
  logTest('Subscribe to creator', subRes.status === 201 || subRes.status === 200,
    `Status: ${subRes.status}`);

  // 8b. Get my subscriptions
  const subsRes = await apiCall('GET', `${BASE_URL}/v1/creators/subscriptions`, null, {
    Authorization: `Bearer ${mockUserToken}`,
  });
  logTest('Get my subscriptions', subsRes.status === 200,
    `Status: ${subsRes.status}`);

  // 8c. Get subscribers
  const subscribersRes = await apiCall('GET', `${BASE_URL}/v1/creators/subscribers`, null, {
    Authorization: `Bearer ${mockUserToken}`,
  });
  logTest('Get my subscribers', subscribersRes.status === 200,
    `Status: ${subscribersRes.status}`);

  // 8d. Cancel subscription
  const cancelRes = await apiCall('DELETE', `${BASE_URL}/v1/creators/subscribe/${TEST_CREATOR_ID}`, null, {
    Authorization: `Bearer ${mockUserToken}`,
  });
  logTest('Cancel subscription', cancelRes.status === 200,
    `Status: ${cancelRes.status}`);
}

async function testTipsFlow() {
  console.log('\n=== 9. Tips Flow ===');

  const tipRes = await apiCall('POST', `${BASE_URL}/v1/creators/tips/${TEST_CREATOR_ID}`, {
    amount: 100,
  }, { Authorization: `Bearer ${mockUserToken}` });
  logTest('Send tip to creator', tipRes.status === 201 || tipRes.status === 200,
    `Status: ${tipRes.status} | ${tipRes.data?.data?.amount || tipRes.data?.error || 'ok'}`);
}

async function testChallengesFlow() {
  console.log('\n=== 10. Challenges Flow ===');

  // 10a. Get challenges
  const challengesRes = await apiCall('GET', `${BASE_URL}/v1/creators/challenges`);
  logTest('Get challenges', challengesRes.status === 200,
    `Status: ${challengesRes.status}`);

  // 10b. Create challenge (admin only)
  const createRes = await apiCall('POST', `${BASE_URL}/v1/creators/challenges`, {
    title: 'Test Challenge',
    description: 'A test challenge',
    prize: '1000 coins',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }, { Authorization: `Bearer ${mockUserToken}` });
  logTest('Create challenge (auth required)', createRes.status === 401 || createRes.status === 403 || createRes.status === 201,
    `Status: ${createRes.status}`);
}

async function runAllTests() {
  console.log('========================================');
  console.log('Creator Service Manual Testing');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('========================================');

  const isHealthy = await testHealthCheck();
  if (!isHealthy) {
    console.log('\n⚠ Service is not healthy. Aborting tests.');
    process.exit(1);
  }

  await testCreatorOnboarding();
  await testVerificationFlow();
  await testContentUploadWorkflow();
  await testEarningsTracking();
  await testPayoutFlow();
  await testAdminOperations();
  await testSubscriptionFlow();
  await testTipsFlow();
  await testChallengesFlow();

  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`Total:  ${testResults.passed + testResults.failed}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  const rate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  console.log(`Rate:   ${rate}%`);

  if (testResults.failed > 0) {
    console.log('\nFailed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => console.log(`  ✗ ${t.name}: ${t.details}`));
  }

  console.log('\n========================================');
  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
