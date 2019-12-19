const express = require('express');
const app = express();
require('dotenv').config();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const request = require('request');
const BotMessageService = require('./BotMessageService');

var port = process.env.PORT || 3000
app.listen(port, function() {
    console.log('To view your app, open this link in your browser: http://localhost:' + port);
});

app.use(express.json({verify:(req, res, buf, encoding) => {
  // メッセージの改ざん防止
  const data = crypto.createHmac('sha256', process.env.API_ID).update(buf).digest('base64');
  const signature = req.headers['x-works-signature'];

  if (data !== signature) {
    throw 'NOT_MATCHED signature';
  }
}}));

/* 
* 疎通確認API
*/
app.get('/', function (req, res) {
  res.send('起動してます！');
});

/**
 * LINE WORKS からのメッセージを受信するAPI
 */
app.post('/callback', async function (req, res, next) {
  res.sendStatus(200);
  try {
    const serverToken = await getServerTokenFromLineWorks();
    const botMessageService = new BotMessageService(serverToken);
    await botMessageService.send(req.body);
  } catch (error) {
    return next(error);
  }
});

/** 
 * JWTを作成します。
 * @return {string} JWT
 */
function createJWT() {
  const iss = process.env.SERVER_ID;
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60;
  const cert = process.env.PRIVATE_KEY;

  return new Promise((resolve, reject) => {
    jwt.sign({ iss: iss, iat: iat, exp: exp }, cert, { algorithm: 'RS256' }, (error, jwtData) => {
      if (error) {
        console.log('createJWT error');
        reject(error);
      } else {
        resolve(jwtData);
      }
    });
  });
}

/**
 * LINE WORKS から Serverトークンを取得します。
 * @return {string} Serverトークン
 */
async function getServerTokenFromLineWorks() {
  const jwtData = await createJWT();
  // 注意:
  // このサンプルでは有効期限1時間のServerトークンをリクエストが来るたびに LINE WORKS から取得しています。
  // 本番稼働時は、取得したServerトークンを NoSQL データベース等に保持し、
  // 有効期限が過ぎた場合にのみ、再度 LINE WORKS から取得するように実装してください。
  const postdata = {
    url: `https://authapi.worksmobile.com/b/${process.env.API_ID}/server/token`,
    headers : {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    form: {
      grant_type: encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer'),
      assertion: jwtData
    }
  };
  return new Promise((resolve, reject) => {
    // LINE WORKS から Serverトークンを取得リクエスト
    request.post(postdata, (error, response, body) => {
      if (error) {
        console.log('getServerTokenFromLineWorks error');
        reject(error);
      } else {
        resolve(JSON.parse(body).access_token);
      }
    });
  });
}