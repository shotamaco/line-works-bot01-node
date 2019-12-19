const request = require('request');

const CALL_BACK_TYPE = {
  message : 'message',
  join : 'join',
  leave : 'leave',
  joined : 'joined',
  left : 'left',
  postback : 'postback',
};

/**
 * BotMessageServiceクラス
 */
module.exports = class BotMessageService {

  /**
   * BotMessageServiceを初期化します。
   * @param {string} serverToken Serverトークン
   */
  constructor (serverToken) {
    this._serverToken = serverToken;
  }

  /**
   * LINE WORKS にBotメッセージを送信します。
   * @param {object} callbackEvent リクエストのコールバックイベント
   */
  async send(callbackEvent) {
    let res = this._getResponse(callbackEvent);
    if (!res) {
      return;
    }
    return new Promise((resolve, reject) => {
      // LINE WORKS にメッセージを送信するリクエスト
      request.post(this._createMessage(res), (error, response, body) => {
          if (error) {
            console.log('BotService.send error');
            console.log(error);
          }
          console.log(body);
          // 揉み消してます！
          resolve();
      });
    });
  }

  /**
   * LINE WORKS に送信するBotメッセージを作成して返します。
   * @param {object} res レスポンスデータ
   */
  _createMessage(res) {
    return {
      url: `https://apis.worksmobile.com/${process.env.API_ID}/message/sendMessage/v2`,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        consumerKey: process.env.CONSUMER_KEY,
        Authorization: `Bearer ${this._serverToken}`
      },
      json: res
    };
  }

  /**
   * メンバーIDを連結して返します。
   * @param {Array} memberList メンバーリスト
   */
  _buildMember(memberList) {
    let result = '';
    if (memberList) {
      memberList.forEach(m => {
        if (result.length > 0) {
          result += ',';
        }
        result += m;
      });
    }
    return result;
  }
  
  /**
   * Bot実装部
   * @param {object} callbackEvent リクエストのコールバックイベント
   * @return {string} レスポンスメッセージ
   */
  _getResponse(callbackEvent) {
    console.log(callbackEvent);

    let res = {
      botNo : Number(process.env.BOT_NO),
    };
    if (callbackEvent.source.roomId) {
      // 受信したデータにトークルームIDがある場合は、送信先にも同じトークルームIDを指定します。
      res.roomId = callbackEvent.source.roomId;
    } else {
      // トークルームIDがない場合はBotとユーザーとの1:1のチャットです。
      res.accountId = callbackEvent.source.accountId;
    }

    switch (callbackEvent.type) {
      case CALL_BACK_TYPE.message:
        // メンバーからのメッセージ
        if (callbackEvent.content.postback == 'start') {
          // メンバーと Bot との初回トークを開始する画面で「利用開始」を押すと、自動的に「利用開始」というメッセージがコールされる
          console.log(`start`);
          res.content = { type: 'text', text: 'ト〜クルームに〜〜。ボトやまが〜くる〜！' };
          return res;
        }

        console.log(CALL_BACK_TYPE.message);
        res.content = { type: 'text', text: 'からの〜〜〜。' };
        break;

      case CALL_BACK_TYPE.join:
        // Bot が複数人トークルームに招待された
        // このイベントがコールされるタイミング
        //  ・API を使って Bot がトークルームを生成した
        //  ・メンバーが Bot を含むトークルームを作成した
        //  ・Bot が複数人のトークルームに招待された
        // ※メンバー１人と Bot のトークルームに他のメンバーを招待したらjoinがコールされる（最初の１回だけ）
        //  招待したメンバーを退会させ、再度他のメンバーを招待するとjoinedがコールされるこれ仕様？
        //  たぶん、メンバー１人と Botの場合、トークルームIDが払い出されてないことが原因だろう。。。
        console.log(CALL_BACK_TYPE.join);
        res.content = { type: 'text', text: 'うぃーん!' };
        break;

      case CALL_BACK_TYPE.leave:
        // Bot が複数人トークルームから退室した
        // このイベントがコールされるタイミング
        //  ・API を使って Bot を退室させた
        //  ・メンバーが Bot をトークルームから退室させた
        //  ・何らかの理由で複数人のトークルームが解散した
        console.log(CALL_BACK_TYPE.leave);
        break;

      case CALL_BACK_TYPE.joined: {
        // メンバーが Bot のいるトークルームに参加した
        // このイベントがコールされるタイミング
        //  ・Bot がトークルームを生成した
        //  ・Bot が他のメンバーをトークルームに招待した
        //  ・トークルームにいるメンバーが他のメンバーを招待した
        console.log(CALL_BACK_TYPE.joined);
        res.content = { type: 'text', text: `${this._buildMember(callbackEvent.memberList)} いらっしゃいませ〜そのせつは〜` };
        break;
      }

      case CALL_BACK_TYPE.left: {
        // メンバーが Bot のいるトークルームから退室した
        // このイベントがコールされるタイミング
        //  ・Bot が属するトークルームでメンバーが自ら退室した、もしくは退室させられた
        //  ・何らかの理由でトークルームが解散した
        console.log(CALL_BACK_TYPE.left);
        res.content = { type: 'text', text: `${this._buildMember(callbackEvent.memberList)} そうなります？` };
        break;
      }

      case CALL_BACK_TYPE.postback:
        // postback タイプのメッセージ
        // このイベントがコールされるタイミング
        //  ・メッセージ送信(Carousel)
        //  ・メッセージ送信(Image Carousel)
        //  ・トークリッチメニュー
        // ※次回の記事で作り込みます。
        console.log(CALL_BACK_TYPE.postback);
        break;

      default:
        console.log('知らないコールバックですね。。。');
        return null;
    }

    return res;
  }
}