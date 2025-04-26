import {KEYUTIL} from "jsrsasign";
const GenerateKeyPair  =async ()=> {
   return new Promise((resolve)=>{
       const keyPair =new KEYUTIL.generateKeypair('RSA',2048);

       resolve({
           privateKey: keyPair.prvKeyObj,
           publicKey: keyPair.pubKeyObj,
       });
   })
};

export default GenerateKeyPair;