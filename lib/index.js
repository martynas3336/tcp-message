const uuid = require('uuid').v4;

class Message {

  constructor(props) {
    this.socket = props.socket; // json-socket
    this.packet = props.packet;
    this.packet.resId = this.packet.resId || null;
    this.packet.data = this.packet.data || {};
  }

  // send this message
  async send(cb) { return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(() => new Promise((resolve, reject) => {
      if(!!cb === false || typeof cb !== 'function') return resolve(null);

      const id = uuid();
      Promise.resolve()
      .then(() => this.constructor.onData(this.socket, message => {
        if(message.packet.resId === id) cb(message);
      }))
      .then(() => resolve(id))
      .catch(reject);
    }))
    .then(id => new Promise((resolve, reject) => {
      this.constructor.encryptMessage({resId:this.packet.resId, reqId:id, action:this.packet.action, data:this.packet.data}).then(encryptedMessage => {
        this.socket.write(encryptedMessage);
        return resolve();
      }).catch(reject);
    }))
    .then(() => resolve(this))
    .catch(reject);
  })}

  // respond to this message
  async respond(data, cb) { return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(() => this.constructor.init({socket:this.socket, packet:{resId:this.packet.reqId, reqId:null, action:data.action, data:data.data}}))
    .then((msg) => msg.send(cb))
    .then(resolve)
    .catch(reject)
  })}

  // send message
  static async send(socket, msg, cb) { return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(() => this.init({socket:socket, packet:msg}))
    .then(message => message.send(cb))
    .then(resolve)
    .catch(reject);
  })}

  // listen to incomming messages and run cb with message instance
  static async onData(socket, cb) { return new Promise((resolve, reject) => {
    if(!!cb === false || typeof cb !== 'function') throw new Error(`${cb} is not a function`);

    socket.on('data', (data) => {
      Promise.resolve()
      .then(() => this.chopData(data))
      .then(choppedData => this.decryptMessage(choppedData))
      .then(decryptedMessage => {
        decryptedMessage.forEach(d => {
          Promise.resolve()
          .then(() => this.init({socket:socket, packet:d}))
          .then(cb)
          .catch(console.log);
        });
      })
      .catch(console.log);
    })
    return resolve();
  })}

  // chop data
  static async chopData(data) { return new Promise((resolve, reject) => {
    const sanitized = `[${data.replace(/}{/g, '},{')}]`;
    return resolve(sanitized);
  })}

  // encrypt message
  static async encryptMessage(msg) { return new Promise((resolve, reject) => {
    try {
      const encryptedMessage = JSON.stringify(msg);
      return resolve(encryptedMessage);
    } catch(err) {
      return reject('Error while encrypting message');
    }
  })}

  // decrypt message
  static async decryptMessage(msg) { return new Promise((resolve, reject) => {
    try {
      const decryptedMessage = JSON.parse(msg);
      return resolve(decryptedMessage);
    } catch(err) {
      console.log(msg);
      return reject('Error while decrypting message');
    }
  })}

  // attach action listener to incomming messages
  static async onAction(socket, action, cb) { return new Promise((resolve, reject) => {
    if(!!action === false) throw new Error(`${action} must be a string`);
    if(!!cb === false || typeof cb !== 'function') throw new Error(`${cb} is not a function`);

    Promise.resolve()
    .then(() => this.onData(socket, message => {
      if(message.packet.action === action) cb(message);
    }))
    .then(resolve)
    .catch(reject);
  })}

  // new Message() and resolve
  static async init(props) { return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(() => Promise.resolve(new this(props)))
    .then(resolve)
    .catch(reject);
  })}
}

module.exports = Message;
