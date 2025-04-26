const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const cors = require('cors');
const {WebSocketServer} = require('ws');
const {networkInterfaces} = require("os");
require('dotenv').config();
const {KJUR, KEYUTIL, hextob64u, b64utohex} = require('jsrsasign'); // ✅ Import jsrsasign
const app = express();
app.use(cors({origin: '*'}));
app.set('trust proxy', true);
const PORT = 3000;
const http = require('http');
const httpServer = http.createServer(app);
const wss = new WebSocketServer({server: httpServer, clientTracking: true});
let ipToSocket = new Map();
wss.on('connection', (ws, req) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`IP của client kết nối: ${clientIp}`);
    ws.on('message', (message) => {
        const msg = JSON.parse(message);
        if (msg.type === 'register') {
            ipToSocket.set(clientIp, ws);
            console.log(`🟢 Đã đăng ký máy nhận với IP: ${clientIp}`);
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
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({success: false, message: 'Không có file được gửi'});
        }
        const {ip} = req.body;
        const file = req.file;
        const publicKeyPem = req.body.publicKeyPem;
        const signatureBase64 = req.body.signature;
        const fileContentBase64 = req.body.fileContentBase64; // Lấy dữ liệu Base64

        const logData = {
            ip: ip || req.ip,
            filename: file.originalname,
            savedAs: file.filename,
            uploadedAt: new Date().toISOString(),
        };

        fs.appendFileSync('./logs/upload.log', JSON.stringify(logData) + '\n');

        //starting verify content
        let isVerified = false;
        try {
            //get public key from .pem file
            const publicKey = KEYUTIL.getKey(publicKeyPem);

            const verifier = new KJUR.crypto.Signature({"alg": "SHA256withRSA"});
            verifier.init(publicKey);
            verifier.updateString(fileContentBase64); // ✅ Update with binary file content
            isVerified = verifier.verify(signatureBase64);
            console.log(isVerified);
            // ✅ Verify with hex signature
        } catch (e) {
            console.error('❌ Lỗi xác minh chữ ký:', e);
        }

        if (isVerified) {
            const targetWS = ipToSocket.get(ip);
            if (targetWS && targetWS.readyState === 1) {
                targetWS.send(JSON.stringify({
                    type: 'file',
                    filename: file.originalname,
                    fileContent: fileContentBase64,
                    signature: signatureBase64,
                    publicKey: publicKeyPem,
                }));
                return res.json({success: true, message: '✅ Đã gửi file đến máy nhận qua WebSocket'});
            } else {
                return res.status(404).json({success: false, message: '❌ Không tìm thấy máy nhận (IP chưa đăng ký)'});
            }
        } else {
            return res.status(400).json({success: false, message: '❌ Chữ ký không hợp lệ'});
        }
    } catch (e) {
        console.log(e.message)
    }
});
httpServer.listen(PORT, '0.0.0.0', () => {
    const interfaces = networkInterfaces();
    Object.keys(interfaces).forEach((ifaceName) => {
        interfaces[ifaceName].forEach((iface) => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`🚀 Server đang chạy tại: http://${iface.address}:${PORT}`);
            }
        });
    });
});