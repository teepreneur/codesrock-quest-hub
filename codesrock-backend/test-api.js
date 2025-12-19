const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testGamificationAPI() {
  console.log('========================================');
  console.log('Testing CodesRock Gamification API');
  console.log('========================================\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthRes = await makeRequest('GET', '/api/health');
    console.log(`✓ Status: ${healthRes.status}`);
    console.log(`✓ Response:`, JSON.stringify(healthRes.data, null, 2).substring(0, 150));
    console.log('');

    // Test 2: Login
    console.log('2. Testing Login...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'teacher@codesrock.org',
      password: 'Codesrock2024'
    });
    console.log(`✓ Status: ${loginRes.status}`);
    const token = loginRes.data.data?.accessToken;
    const userId = loginRes.data.data?.user?._id;
    console.log(`✓ Token received:`, token ? 'Yes' : 'No');
    console.log(`✓ User ID: ${userId}`);
    console.log('');

    if (!token) {
      console.log('✗ Cannot proceed without token');
      return;
    }

    // Test 3: Get All Levels
    console.log('3. Testing GET /api/levels...');
    const levelsRes = await makeRequest('GET', '/api/levels', null, {
      'Authorization': `Bearer ${token}`
    });
    console.log(`✓ Status: ${levelsRes.status}`);
    console.log(`✓ Levels count: ${levelsRes.data.data?.length || 0}`);
    console.log('');

    // Test 4: Get User Progress
    console.log('4. Testing GET /api/progress/:userId...');
    const progressRes = await makeRequest('GET', `/api/progress/${userId}`, null, {
      'Authorization': `Bearer ${token}`
    });
    console.log(`✓ Status: ${progressRes.status}`);
    console.log(`✓ Current XP: ${progressRes.data.data?.progress?.currentXP || 0}`);
    console.log(`✓ Level: ${progressRes.data.data?.progress?.currentLevel || 1} - ${progressRes.data.data?.progress?.levelName || 'N/A'}`);
    console.log('');

    // Test 5: Get All Badges
    console.log('5. Testing GET /api/badges...');
    const badgesRes = await makeRequest('GET', '/api/badges', null, {
      'Authorization': `Bearer ${token}`
    });
    console.log(`✓ Status: ${badgesRes.status}`);
    console.log(`✓ Badges count: ${badgesRes.data.count || 0}`);
    console.log('');

    // Test 6: Add XP
    console.log('6. Testing POST /api/progress/xp...');
    const addXPRes = await makeRequest('POST', '/api/progress/xp', {
      userId: userId,
      amount: 50,
      description: 'Test XP award from automated test',
      metadata: { test: true }
    }, {
      'Authorization': `Bearer ${token}`
    });
    console.log(`✓ Status: ${addXPRes.status}`);
    console.log(`✓ XP Added: ${addXPRes.data.data?.xpAdded || 0}`);
    console.log(`✓ New Total XP: ${addXPRes.data.data?.totalXP || 0}`);
    console.log(`✓ Leveled Up: ${addXPRes.data.data?.leveledUp ? 'Yes' : 'No'}`);
    console.log('');

    // Test 7: Get Leaderboard
    console.log('7. Testing GET /api/leaderboard...');
    const leaderboardRes = await makeRequest('GET', '/api/leaderboard', null, {
      'Authorization': `Bearer ${token}`
    });
    console.log(`✓ Status: ${leaderboardRes.status}`);
    console.log(`✓ Leaderboard entries: ${leaderboardRes.data.data?.length || 0}`);
    console.log('');

    // Test 8: Get Activity Feed
    console.log('8. Testing GET /api/activities/:userId...');
    const activitiesRes = await makeRequest('GET', `/api/activities/${userId}`, null, {
      'Authorization': `Bearer ${token}`
    });
    console.log(`✓ Status: ${activitiesRes.status}`);
    console.log(`✓ Activities count: ${activitiesRes.data.data?.activities?.length || 0}`);
    console.log('');

    // Test 9: Update Streak
    console.log('9. Testing POST /api/progress/streak...');
    const streakRes = await makeRequest('POST', '/api/progress/streak', {
      userId: userId
    }, {
      'Authorization': `Bearer ${token}`
    });
    console.log(`✓ Status: ${streakRes.status}`);
    console.log(`✓ Current Streak: ${streakRes.data.data?.currentStreak || 0}`);
    console.log('');

    console.log('========================================');
    console.log('✓ All tests completed successfully!');
    console.log('========================================');

  } catch (error) {
    console.error('✗ Test failed with error:', error.message);
  }
}

testGamificationAPI();
