const {StoreKey} = require('../models/_index');
const _express = require('express');
const fs = require("fs");
const {KEYUTIL, KJUR} = require("jsrsasign");
const multer = require("multer");
const router = _express.Router();
const upload = multer();

router.post('/upload', upload.single('file'), async (req, res) => {
    const senderIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (senderIP === null || senderIP === undefined) {
        console.log('Can not access IP');
    }
    //console.log(req.body);
    try {
        if (!req.file) {
            return res.status(400).json({success: false, message: 'Không có file được gửi'});
        }
        const {ip} = req.body;
        const file = req.file;
        const publicKeyPem = req.body.publicKeyPem;
        const signatureBase64 = req.body.signature;
        const fileContentBase64 = req.body.fileContentBase64;

        const logData = {
            ip: ip || req.ip,
            filename: file.originalname,
            savedAs: file.filename,
            uploadedAt: new Date().toISOString(),
        };

        fs.appendFileSync('./logs/upload.log', JSON.stringify(logData) + '\n');

        //save public key to database if it's empty'
        let userRec = null;
        if (publicKeyPem && publicKeyPem.length > 0) {
            const saveKey = await StoreKey.update(
                {key: publicKeyPem},
                {
                    where: {userIp: senderIP.toString()},
                });
            if (!saveKey) {
                console.log('Can not save key');
            }
        } else {
            console.log('Can not save key');
            userRec = await StoreKey.findOne({
                where: {
                    userIp: senderIP.toString(),
                }
            });
            console.log('User record: ', userRec);
        }

        //starting verify content
        let isVerified = false;
        let publicKey = null;
        try {
            //get public key from .pem file, if not -> check the database
            if (userRec === null) {
                publicKey = KEYUTIL.getKey(publicKeyPem);
            } else {
               if(userRec.key.length !== 0) {
                   publicKey = KEYUTIL.getKey(userRec.key);
               }else publicKey = KEYUTIL.getKey(publicKeyPem);
            }

            const verifier = new KJUR.crypto.Signature({"alg": "SHA256withRSA"});
            verifier.init(publicKey);
            verifier.updateString(fileContentBase64); // ✅ Update with binary file content
            isVerified = verifier.verify(signatureBase64);
            console.log('Verified successfully: ', isVerified);
            fs.appendFileSync('./logs/upload.log', 'Verified successfully: '+ isVerified + '\n\n');
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
                    publicKey: publicKeyPem.length > 0 ? publicKeyPem : userRec.key,
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

module.exports = router;