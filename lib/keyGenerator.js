const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class KeyGenerator {
    constructor() {
        this.pubKey = '04f3d82b7a30e9676e6892a5cb696a97834d193e2dde0981468782c0dd1305b514bcfcb328328eaf6a100360e05291b867efe877875728720cb073f0d8e76d6ae4';
        this.privKey = '2a09b0e949b5ce291dfc698778fbc4a3229f52eadb25580e9fa2f09e61dce7e8';
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