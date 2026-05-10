const { BasicCredential } = require("tencentcloud-sdk-nodejs/tencentcloud/common/credential");
const { Client } = require("tencentcloud-sdk-nodejs/tencentcloud/services/asr/v20190614").v20190614;

exports.handler = async (event, context) => {
  try {
    // 从环境变量获取配置
    const { TENCENT_APP_ID, TENCENT_SECRET_ID, TENCENT_SECRET_KEY } = process.env;
    
    // 验证配置
    if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "腾讯云密钥未配置" })
      };
    }

    // 解析请求体
    const { action, audioData } = JSON.parse(event.body);
    
    if (action !== "recognize") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "无效的 action" })
      };
    }

    // 创建腾讯云ASR客户端
    const credential = new BasicCredential(TENCENT_SECRET_ID, TENCENT_SECRET_KEY);
    const client = new Client({
      credential: credential,
      region: "ap-beijing",
      profile: {
        httpProfile: {
          endpoint: "asr.tencentcloudapi.com",
        },
      },
    });

    // 构建请求参数
    const params = {
      ProjectId: 0,
      SubServiceType: 2,
      EngSerViceType: "16k_zh",
      SourceType: 1,
      VoiceFormat: "pcm",
      UsrAudioKey: "voice_" + Date.now(),
      Data: audioData,
      DataLen: Buffer.from(audioData, "base64").length,
    };

    console.log("=== 腾讯云ASR请求 ===");
    console.log("参数:", {
      EngSerViceType: params.EngSerViceType,
      VoiceFormat: params.VoiceFormat,
      DataLen: params.DataLen,
      UsrAudioKey: params.UsrAudioKey,
    });

    // 调用API
    const response = await client.SentenceRecognition(params);
    
    console.log("=== 腾讯云ASR响应 ===");
    console.log("响应数据:", JSON.stringify(response, null, 2));

    // 处理响应格式（腾讯云ASR直接返回Result字段）
    let result = null;
    if (response && response.Result) {
      result = response.Result;
    } else if (response && response.response && response.response.Result) {
      result = response.response.Result;
    } else if (response && response.Response && response.Response.Result) {
      result = response.Response.Result;
    } else if (response && response.result) {
      result = response.result;
    }

    if (result !== undefined) {
      return {
        statusCode: 200,
        body: JSON.stringify({ result: result })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "ASR API返回格式异常" })
      };
    }
    
  } catch (error) {
    console.error("ASR处理失败:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "服务器错误: " + error.message })
    };
  }
};
