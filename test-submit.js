const axios = require('axios');

async function testSubmit() {
  try {
    const baseUrl = 'https://homework-collection-system-1.onrender.com';
    
    const testData = {
      date: '2024-01-15',
      name: '测试用户',
      nineWord: 108,
      buddhaWorship: 3,
      quietZen: 30,
      activeZen: 20,
      diamond: 1,
      amitabha: 2,
      guanyin: 1,
      puxian: 0,
      dizang: 0,
      remark: '这是测试数据',
      deviceId: 'test-script'
    };
    
    console.log('🚀 开始测试提交...');
    console.log('📤 发送数据:', testData);
    
    const response = await axios.post(`${baseUrl}/api/submit`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 提交成功:', response.data);
    
  } catch (error) {
    console.error('❌ 提交失败:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

testSubmit();
