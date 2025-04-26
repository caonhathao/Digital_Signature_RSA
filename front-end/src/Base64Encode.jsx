
const Base64Encode = (buffer) => {
    let bin = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        bin += String.fromCharCode(bytes[i]);
    }
    return window.btoa(bin);
}
export default Base64Encode;