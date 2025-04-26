import React, { useEffect, useRef, useState } from 'react';
import { ToastContainer } from "react-toastify";
import { KJUR, KEYUTIL } from 'jsrsasign';

export default function Receiver() {
    const [message, setMessage] = useState('🟢 Đang chờ file...');
    const ws = useRef(null);

    const verifySignature = (fileContentBase64, signatureBase64, publicKeyPem) => {
        try {
            const publicKey = KEYUTIL.getKey(publicKeyPem);
            const sig = new KJUR.crypto.Signature({ alg: "SHA256withRSA" });
            sig.init(publicKey);
            sig.updateString(fileContentBase64); // ✅ Phải giống với bên gửi
            const isValid = sig.verify(signatureBase64);
            return isValid;
        } catch (err) {
            console.error("❌ Lỗi khi xác minh chữ ký:", err);
            return false;
        }
    };

    useEffect(() => {
        let socket;

        const connectWebSocket = () => {
            try {
                socket = new WebSocket('ws://192.168.1.23:3000');
                ws.current = socket;

                socket.onerror = (e) => {
                    console.error('WebSocket error:', e);
                };

                socket.onopen = () => {
                    console.log("🔌 Kết nối WebSocket mở");
                    socket.send(JSON.stringify({ type: 'register' }));
                };

                socket.onmessage = async (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'file') {
                        setMessage(`📦 Đang xác minh file: ${data.filename}...`);

                        const isValid = verifySignature(data.fileContent, data.signature, data.publicKey);

                        if (isValid) {
                            setMessage(`✅ Đã xác minh thành công file: ${data.filename}`);

                            // 🧩 Decode base64 thành blob
                            const byteCharacters = atob(data.fileContent);
                            const byteNumbers = new Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            const blob = new Blob([byteArray]);

                            // 💾 Trigger tải file
                            const downloadUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = downloadUrl;
                            a.download = data.filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(downloadUrl);
                        } else {
                            setMessage(`❌ Chữ ký không hợp lệ cho file: ${data.filename}`);
                        }
                    }
                };

                socket.onclose = () => {
                    console.log("🔌 WebSocket ngắt kết nối");
                    setMessage('🔴 Mất kết nối với server');
                };
            } catch (e) {
                console.error('❌ Lỗi khi tạo WebSocket:', e.message);
            }
        };

        connectWebSocket();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold">🎧 Trình nhận file qua WebSocket</h1>
            <p className="mt-2">{message}</p>
            <ToastContainer />
        </div>
    );
}
