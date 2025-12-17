const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const database = require('./database');

const app = express();

// 基础中间件
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  keyGenerator: (req, res) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.ip;
    return clientIp;
  }
});

// 调试：记录所有请求路径
app.use((req, res, next) => {
  console.log(`📥 请求: ${req.method} ${req.originalUrl}`);
  next();
});

// 加载API路由
try {
  const routes = require('./routes');
  app.use('/api', routes);
  console.log('✅ API路由已加载');
} catch (error) {
  console.error('❌ 加载API路由失败:', error);
}

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 主页和管理页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/manage', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// 添加一个简单的API测试路由（作为后备）
app.get('/api/backup-test', (req, res) => {
  res.json({ 
    success: true, 
    message: '这是备用测试路由',
    path: req.path 
  });
});

// 404处理
app.use((req, res) => {
  console.log(`❌ 404: 路径 ${req.path} 不存在`);
  res.status(404).json({ 
    success: false, 
    error: '请求的资源不存在',
    path: req.path,
    method: req.method
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 服务器正在端口 ${PORT} 上运行`);
  console.log(`📡 访问地址: http://localhost:${PORT}`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 管理页面: http://localhost:${PORT}/manage`);
  
  // 测试API端点
  console.log(`🔍 API测试端点: http://localhost:${PORT}/api/health`);
  console.log(`🔍 API测试端点: http://localhost:${PORT}/api/test`);
  
  // 延迟连接数据库
  setTimeout(async () => {
    try {
      await database.connect();
      console.log('✅ 数据库连接成功');
    } catch (error) {
      console.error('⚠️ 数据库连接失败，但服务器继续运行:', error.message);
    }
  }, 3000);
});
