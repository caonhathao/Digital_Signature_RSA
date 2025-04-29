const _express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const cors = require('cors');
const {WebSocketServer} = require('ws');
const {networkInterfaces} = require("os");
const db = require('./models/_index');
const http = require('http');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const {StoreKey} = require('./models/_index');

require('dotenv').config();


const app = _express();

//middleware
app.use(_express.json());
app.use(cors({origin: '*'}));

//dotenv
const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

app.set('trust proxy', true);

const httpServer = http.createServer(app);
const wss = new WebSocketServer({server: httpServer, clientTracking: true});

ipToSocket = new Map();

wss.on('connection', (ws, req) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`IP của client kết nối: ${clientIp}`);
    ws.on('message', async (message) => {
        const msg = JSON.parse(message);
        if (msg.type === 'register') {
            ipToSocket.set(clientIp, ws);
            console.log(`🟢 Một máy kết nối mới có IP: ${clientIp}`);

            const isExisted = await StoreKey.findOne({
                where: {
                    userIp: clientIp.toString(),
                }
            })
            console.log('isExisted: ',isExisted);
            if (!isExisted) {
                const store = await StoreKey.create({
                    userIp: clientIp.toString(),
                });
                if (!store) {
                    console.log('Error when init storing key for: ', clientIp);
                } else
                    console.log('Khởi tạo dữ liệu thành công, sẵn sàng lưu trữ khóa');

            } else {
                console.log('Người gửi không tồn tại, khởi tạo dữ liệu mới!');
            }


        }
    });
    ws.on('close', () => {
        for (const [ip, socket] of ipToSocket.entries()) {
            if (socket === ws) ipToSocket.delete(ip);
        }
    });
});

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {recursive: true});
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({storage});
app.use(morgan('dev'));

//Routes
const routersPath = path.join(__dirname, 'routers');
fs.readdirSync(routersPath).forEach((file) => {
    if (file.endsWith('.js')) {
        const router = require(path.join(routersPath, file));
        app.use(router);
    }
});

db.sequelize.sync({force: false}).then(() => {
    const port = parseInt(process.env.SERVER_PORT) || 3000;

    httpServer.listen(port, '0.0.0.0', () => {
        const interfaces = networkInterfaces();
        Object.keys(interfaces).forEach((ifaceName) => {
            interfaces[ifaceName].forEach((iface) => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    console.log(`🚀 Server đang chạy tại: http://${iface.address}:${port}`);
                }
            });
        });
    });
}).catch((err) => {
    console.log("Failed to connect to the database!: ", err.message);
    process.exitCode = 1;
})