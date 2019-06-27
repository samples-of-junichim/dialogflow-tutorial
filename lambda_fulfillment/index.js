//
// Dialogflow -> fulfillment のサンプル
//
// 公式チュートリアルを Google カレンダーなし + Webhook で試したもの
// https://dialogflow.com/docs/tutorial-build-an-agent-advanced-concepts

'use strict';

// 戻り値
let response;
let requestBody;

exports.fulfillmentHandler = async function(event) {

    console.log("event: " + JSON.stringify(event));

    let request = event.requestContext;
    let body = JSON.parse(event.body);
    
    console.log("request: " + JSON.stringify(request));
    console.log("body: " + JSON.stringify(body));

    // intent と対応するハンドラ関数のマップを生成
    let intentMap = new Map();
    intentMap.set('reservation', checkAppointment);
    intentMap.set('reservation - yes', makeAppointment);
    intentMap.set('suggestion - yes', suggestAppointment);

    const intent = body.queryResult.intent;
    console.log("intent: " + JSON.stringify(intent));

    response = createResponse();
    requestBody = body;

    // レスポンスにコンテキストを（ディープ）コピー
    response.outputContexts = JSON.parse(JSON.stringify(body.queryResult.outputContexts));

    // intent に応じて処理
    let ret;
    try {
      ret = await handleRequest(intentMap, intent);
    } catch(e) {
      console.error("error occured: " + JSON.stringify(e));
      throw e;
    }

    // Lambda -> API Gateway -> Dialogflow fulfillment に戻す
    const r = {
        statusCode: 200,
        body: JSON.stringify(ret),
    };
    return r;
}

function createResponse() {
  let response = {
    fulfillmentText: "This is a text response",
    fulfillmentMessages: [],
    source: "example.com",
    payload: {},
    outputContexts: [
        {
            name: "projects/${PROJECT_ID}/agent/sessions/${SESSION_ID}/contexts/context name",
            lifespanCount: 5,
            parameters: {
                param: "param value"
            }
        }
    ],
    followupEventInput: {}
  };
  return response;
}

async function handleRequest(intentMap, intent) {
  const intentName = intent.displayName;

  // 呼び出し
  if (intentMap.has(intentName)) {
    return intentMap.get(intent.displayName)();
  }

  console.log("no intent handler, intent: " + intentName);
  throw new Error("no intent hander");
}

// intent に応じた処理
async function checkAppointment() {

  console.log("checkAppointment called");

  const context = getContext(response, "reservation-followup");
  if (!context) {
    console.warn("コンテキスト, " + "reservation-followup" + " が見つかりません。");
    throw new Error("no context");
  }
  
  const date = requestBody.queryResult.parameters.date;
  const time = requestBody.queryResult.parameters.time;

  console.log("context before: " + JSON.stringify(response));

  // check OK/NG を想定
  const flg = trueOrFalse(1);

  if (flg) {
    response.fulfillmentText = `了解しました。 ${date} 日の ${time} 時の予約でよろしいでしょうか？`;
  } else {
    // event を発行
    response.followupEventInput = {
      name: "suggest",
      languageCode: "ja-JP",
      parameters: {
          date: date,
          time: time,
          suggested_time: "2019-07-22T13:00:00+9:00"
      }
    }

  }
  
  console.log("context after: " + JSON.stringify(response));

  return response;
}

async function makeAppointment() {

  console.log("makeAppointment called");

  const context = getContext(response, "reservation-followup");
  if (!context) {
    console.warn("コンテキスト, " + "reservation-followup" + " が見つかりません。");
    throw new Error("no context");
  }

  const date = context.parameters.date;
  const time = context.parameters.time;

  // コンテキストをクリア
  context.lifespanCount = 0;

  // 予約 OK/NG を想定
  const flg = trueOrFalse(1);

  if (flg) {
    response.fulfillmentText = `予約が完了しました。 ${date} 日の ${time} 時に予約をお取りしました。`;
  } else {
    response.fulfillmentText = `すいません。なぜか予約に失敗しました。 ${date} 日の ${time} 時の予約を取り直してください。`;
  }
  return response;
}

// intent に応じた処理
async function suggestAppointment() {

  console.log("suggestAppointment called");

  const context = getContext(response, "suggestion-followup");
  if (!context) {
    console.warn("コンテキスト, " + "suggestion-followup" + " が見つかりません。");
    throw new Error("no context");
  }
  
  console.log("context before: " + JSON.stringify(response));

  const suggested_time = context.parameters.suggested_time;

  // event を発行
  response.followupEventInput = {
    name: "suggest-agree",
    languageCode: "ja-JP",
    parameters: {
        suggested_time: suggested_time
    }
  };

  console.log("context after: " + JSON.stringify(response));

  return response;
}

function trueOrFalse(maxVal) {
  if (!maxVal) {
      maxVal = 1;
  }
  // random() は [0, 1)
  return Math.floor(Math.random() * (maxVal+1));
}

function getContext(response, contextName) {
  for (let context of response.outputContexts) {
    const ary = context.name.split("/");
    if (ary[ary.length-1] === contextName) {
      return context;
    }
  }
  return;
}

function setNewContext(oldContextName, newContextName) {
  let ary = oldContextName.split("/");
  ary[ary.length-1] = newContextName;
  return ary.join("/");
}
