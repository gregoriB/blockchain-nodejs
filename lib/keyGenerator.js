const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class KeyGenerator {
    constructor() {
        this.keys = this.generateKeys();
    }

    generateKeys() {
        return ec.genKeyPair();
    }

    getPrivate() {
        return this.keys.getPrivate('hex');
    }

    getPublic() {
        return this.keys.getPublic('hex');
    }

    generateSignature(hash) {
        return this.keys.sign(hash, 'base64').toDER('hex');
    }
}

module.exports = KeyGenerator;