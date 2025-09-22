import React, {useState, useEffect} from 'react';
import './App.css';
import {useFormik} from 'formik';
import axios from 'axios';
import Receiver from './Receiver.jsx';
import {toast, ToastContainer} from 'react-toastify';
import {KJUR, KEYUTIL, hextob64u} from 'jsrsasign';
import GenerateKeyPair from "./GenerateKeyPair.jsx";
import Base64Encode from "./Base64Encode.jsx";

function App() {
    const [keyPair, setKeyPair] = useState(null); // State để lưu trữ keypair
    const [prvKey, setPrvKey] = useState(null);

    const formData = useFormik({
        initialValues: {
            ip: '', // receiver's ip
            file: null,
            publicKeyPem: '',
            signature: '', //encrypted file signed with a private key
            fileContentBase64: '' // encoded file (here using base64)

        },
        onSubmit: async (values, {setSubmitting}) => {
            try {
                let privateKey = '';
                let publicKeyPem = '';
                if (prvKey === null || prvKey === '') {
                    // 1. Generate keypair
                    const keyPair = await GenerateKeyPair();
                    const prvKeyPem = KEYUTIL.getPEM(keyPair.privateKey, "PKCS1PRV");
                    privateKey = KEYUTIL.getKey(prvKeyPem);
                    //console.log(keyPair.privateKey);
                    localStorage.setItem('prv', prvKeyPem);
                    publicKeyPem = KEYUTIL.getPEM(keyPair.publicKey);
                }

                // 2. Reading file and encode by base64
                const fileBuffer = await values.file.arrayBuffer();
                const binaryStr = Base64Encode(fileBuffer);

                // 3. Signing base64's content by private key
                const sig = new KJUR.crypto.Signature({alg: "SHA256withRSA", prov: "cryptojs/jsrsa"});
                if (prvKey !== null) {
                    sig.init(prvKey);
                } else sig.init(privateKey);
                sig.updateString(binaryStr);
                const signature = sig.sign();

                // 4. Post all to server
                const form = new FormData();
                form.append('ip', values.ip);
                form.append('file', values.file);
                form.append('publicKeyPem', publicKeyPem);
                form.append('signature', signature);
                form.append('fileContentBase64', binaryStr);

                const response = await axios.post(import.meta.env.VITE_SERVER_URL + import.meta.env.VITE_UPLOAD_API, form, {
                    headers: {'Content-Type': 'multipart/form-data'}
                });

                toast.success(response.data.message || '✅ Upload thành công');
            } catch (e) {
                console.error('❌ Lỗi khi gửi:', e);
                toast.error('Lỗi khi gửi file');
            } finally {
                setSubmitting(false);
            }
        }

    });

    useEffect(() => {
        //checking if a private key is existing
        if (localStorage.getItem('prv')) {
            setPrvKey(localStorage.getItem('prv'));
        }
        console.log(localStorage.getItem('prv'));

    }, [])

    return (
        <div className={'h-screen w-screen'}>
            <Receiver/>
            <div className={'h-full w-full flex flex-row justify-center items-center'}>
                <form onSubmit={formData.handleSubmit} className={'shadow-md shadow-gray-500 rounded-md'}>
                    <div className={'bg-emerald-600 p-2 flex flex-row justify-center items-center'}>Form gửi file</div>

                    <div className={'p-2'}>
                        <fieldset className={'border-2 border-gray-500'}>
                            <legend>Nhập địa chỉ IP người gửi:</legend>
                            <input type='text'
                                   name={'ip'} placeholder={`IP address... `} value={formData.values.ip}
                                   onChange={formData.handleChange} className={'w-full p-1 outline-emerald-600'}/>
                        </fieldset>
                        <fieldset className={'border-2 border-gray-500'}>

                            <legend>File media muốn gửi đi:</legend>
                            <input type='file' name={'file'} placeholder={`File upload... `}
                                   onChange={(event) => {
                                       formData.setFieldValue('file', event.currentTarget.files[0]);
                                   }} className={'w-full p-1 outline-emerald-600'}/>
                        </fieldset>
                        <div className={'w-full h-full mt-2 flex flex-row justify-around items-center'}>
                            <button type='submit' className={'border-1 border-emerald-600 rounded-full px-2 py-1'}>
                                Gửi
                            </button>
                            <button type='button' className={'border-1 border-emerald-600 rounded-full px-2 py-1'}>
                                Hủy
                            </button>
                        </div>
                    </div>

                </form>
            </div>
            <ToastContainer/>
        </div>
    );
}

export default App;