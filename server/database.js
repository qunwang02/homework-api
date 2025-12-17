const { MongoClient, ServerApiVersion } = require('mongodb');

class HomeworkDatabase {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.connecting = false;
  }

  async connect() {
    if (this.isConnected) {
      console.log('✅ 已连接到功课数据库');
      return this.db;
    }
    
    if (this.connecting) {
      console.log('🔄 正在连接功课数据库，请稍候...');
      return new Promise(resolve => {
        const checkConnection = () => {
          if (this.isConnected) {
            resolve(this.db);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }
    
    this.connecting = true;
    
    try {
      // 功课系统使用 homework_db
      const uri = process.env.MONGODB_URI || 'mongodb+srv://nanmo009:Wwx731217@cluster-fosheng.r3b5crc.mongodb.net/?retryWrites=true&w=majority&appName=cluster-fosheng';
      const dbName = process.env.DATABASE_NAME || 'homework_db'; // 功课数据库
      
      console.log(`🔗 正在连接到功课数据库: ${dbName}`);
      
      this.client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        connectTimeoutMS: 10000,
        socketTimeoutMS: 30000,
      });
      
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;
      this.connecting = false;
      
      await this.db.command({ ping: 1 });
      
      console.log('✅ 功课数据库连接成功');
      console.log(`📁 数据库: ${dbName}`);
      
      return this.db;
    } catch (error) {
      this.connecting = false;
      console.error('❌ 功课数据库连接失败:', error.message);
      throw error;
    }
  }

  // 初始化功课集合
  async initHomeworkCollections() {
    const collections = await this.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('homework_records')) {
      await this.db.createCollection('homework_records');
      console.log('✅ 创建homework_records集合');
    }
    
    if (!collectionNames.includes('homework_logs')) {
      await this.db.createCollection('homework_logs');
      console.log('✅ 创建homework_logs集合');
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        console.log('✅ 功课数据库连接已关闭');
      }
    } catch (error) {
      console.error('❌ 关闭功课数据库连接失败:', error.message);
    }
  }

  getCollection(name) {
    if (!this.db) {
      throw new Error('功课数据库未连接，请先调用connect()方法');
    }
    return this.db.collection(name);
  }

  // 功课记录集合
  homeworkRecords() {
    return this.getCollection('homework_records');
  }

  // 功课日志集合
  homeworkLogs() {
    return this.getCollection('homework_logs');
  }
}

const homeworkDatabase = new HomeworkDatabase();

// 自动重连
setInterval(async () => {
  if (!homeworkDatabase.isConnected && !homeworkDatabase.connecting) {
    try {
      console.log('🔄 尝试自动重新连接功课数据库...');
      await homeworkDatabase.connect();
    } catch (error) {
      console.log('自动重连失败，稍后重试...');
    }
  }
}, 60000);

module.exports = homeworkDatabase;
