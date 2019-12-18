const request = require('request');

module.exports = class BotService {

  constructor (apiId, consumerKey, serverToken) {
    this._apiId = apiId;
    this._consumerKey = consumerKey;
    this._serverToken = serverToken;
  }
}