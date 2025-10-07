import crypto from "crypto";
import {config} from "../config";

const keyHex = config.aes.key;
const ivHex = config.aes.iv;

const AES = {
    encrypt,
    decrypt,
    generateKeyAndIV
}

function fromHex(hex: string) {
    return Buffer.from(hex.replace(/-/g, ''), 'hex');
}
function encrypt(plainText: string) {
    const key = fromHex(keyHex);
    const iv = fromHex(ivHex);

    // Determine AES algorithm based on key length
    let algorithm = '';
    console.log(key.length)
    switch (key.length) {
        case 16:
            algorithm = 'aes-128-cbc';
            break;
        case 24:
            algorithm = 'aes-192-cbc';
            break;
        case 32:
            algorithm = 'aes-256-cbc';
            break;
        default:
            throw new Error('Invalid key length. AES requires a 16, 24, or 32 byte key.');
    }

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = Buffer.concat([
        cipher.update(plainText, 'utf8'),
        cipher.final()
    ]);

    // Combine IV and encrypted data
    const combinedData = Buffer.concat([iv, encrypted]);

    return combinedData.toString('base64');
}


function decrypt(combinedString: string) {
    const keyBuffer = fromHex(keyHex);
    const combinedData = Buffer.from(combinedString, 'base64');


    const blockSize = 16;

    // Extract IV and ciphertext
    const iv = combinedData.slice(0, blockSize);
    const cipherText = combinedData.slice(blockSize);

    // Determine AES algorithm based on key length
    let algorithm = '';
    console.log(keyBuffer.length)

    switch (keyBuffer.length) {
        case 16:
            algorithm = 'aes-128-cbc';
            break;
        case 24:
            algorithm = 'aes-192-cbc';
            break;
        case 32:
            algorithm = 'aes-256-cbc';
            break;
        default:
            throw new Error('Invalid key length. AES requires a 16, 24, or 32 byte key.');
    }

    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    let decrypted = Buffer.concat([
        decipher.update(cipherText),
        decipher.final()
    ]);

    return decrypted.toString('utf8');
}


function generateKeyAndIV() {
    const newKey = crypto.randomBytes(32).toString('hex');
    const newIV = crypto.randomBytes(16).toString('hex');
    console.log('Generated new key:', newKey);
    console.log('Generated new IV:', newIV);
    return {key: newKey, iv: newIV};
}


export {AES};