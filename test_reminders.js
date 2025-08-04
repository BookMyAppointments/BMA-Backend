const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

// Test data
const testReminder = {
  title: 'Test Reminder',
  description: 'This is a test reminder',
  time: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
  frequency: 'DAILY'
};

async function testReminders() {
  try {
    console.log('🧪 Testing Reminder Endpoints...\n');

    // Test 1: Create a reminder
    console.log('1. Testing CREATE reminder...');
    const createResponse = await axios.post(`${BASE_URL}/remainders/create`, testReminder, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✅ Create response:', createResponse.data);
    const reminderId = createResponse.data.id;

    // Test 2: Get all reminders
    console.log('\n2. Testing GET reminders...');
    const getResponse = await axios.get(`${BASE_URL}/remainders/get`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✅ Get response:', getResponse.data);

    // Test 3: Update the reminder
    console.log('\n3. Testing UPDATE reminder...');
    const updateData = {
      title: 'Updated Test Reminder',
      description: 'This is an updated test reminder',
      time: new Date(Date.now() + 120000).toISOString(), // 2 minutes from now
      frequency: 'WEEKLY'
    };
    const updateResponse = await axios.patch(`${BASE_URL}/remainders/update/${reminderId}`, updateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✅ Update response:', updateResponse.data);

    // Test 4: Delete the reminder
    console.log('\n4. Testing DELETE reminder...');
    const deleteResponse = await axios.delete(`${BASE_URL}/remainders/delete/${reminderId}`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✅ Delete response status:', deleteResponse.status);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

testReminders(); 