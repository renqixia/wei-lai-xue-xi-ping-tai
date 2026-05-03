import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function parseDailyReview(content: string) {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      dailySummary: { type: Type.STRING, description: "今日学习/复盘的高维度总结（教练口吻）" },
      knowledgePoints: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            coreConcept: { type: Type.STRING, description: "提炼的核心概念" },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "关键要点" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "学科或主题标签" },
            importance: { type: Type.STRING, enum: ["高", "中", "低"] }
          }
        }
      },
      mistakesFound: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionContext: { type: Type.STRING, description: "用户描述的错误场景、题目或卡点" },
            errorReason: { type: Type.STRING, description: "深层错因分析" },
            actionAdvice: { type: Type.STRING, description: "改进建议" }
          }
        }
      }
    },
    required: ["dailySummary", "knowledgePoints", "mistakesFound"]
  };

  const response = await getAI().models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: 'user', parts: [{ text: `作为顶级教育教练，请分析以下用户的今日复盘内容，给出一句充满洞察的总结，并结构化提取出核心知识点和暴露出的错误/心智卡点：\n${content}` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function processKnowledgePoint(content: string) {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      coreConcept: { type: Type.STRING, description: "提炼的核心概念" },
      keyPoints: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "列出3-5个关键信息"
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "推荐的分类标签，如学科、主题"
      },
      importance: {
        type: Type.STRING,
        enum: ["高", "中", "低"],
        description: "重要程度评估"
      }
    },
    required: ["coreConcept", "keyPoints", "tags", "importance"]
  };

  const response = await getAI().models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: 'user', parts: [{ text: `请帮我分析以下知识点内容，提取核心概念和关键信息：\n${content}` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function analyzeMistake(question: string, wrongAnswer: string, correctAnswer: string) {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      errorReason: { type: Type.STRING, description: "深入心智与逻辑层面的详细分析" },
      rootKnowledge: { type: Type.STRING, description: "关联的底层知识点" },
      similarTraits: { type: Type.STRING, description: "这类题的共同陷阱与特点" },
      actionAdvice: { type: Type.STRING, description: "具体的改进与学习建议" }
    },
    required: ["errorReason", "rootKnowledge", "similarTraits", "actionAdvice"]
  };

  const response = await getAI().models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{
      role: 'user', parts: [{
        text: `分析以下错题：\n题目：${question}\n错误答案：${wrongAnswer}\n正确答案：${correctAnswer}\n\n根据结构输出分析。`
      }]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.3
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function evaluateFeynman(knowledge: string, output: string) {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      accuracyScore: { type: Type.INTEGER, description: "准确性评分 1-10" },
      concisenessScore: { type: Type.INTEGER, description: "简洁性评分 1-10" },
      logicScore: { type: Type.INTEGER, description: "逻辑性评分 1-10" },
      depthScore: { type: Type.INTEGER, description: "认知深度评分 1-10" },
      coachAdvice: { type: Type.STRING, description: "指出理解偏差，给出具体优化建议" }
    },
    required: ["accuracyScore", "concisenessScore", "logicScore", "depthScore", "coachAdvice"]
  };

  const response = await getAI().models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{
      role: 'user', parts: [{
        text: `评估用户对以下知识点的费曼输出：\n核心知识点：${knowledge}\n用户费曼输出：${output}`
      }]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.3
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function generateMindMap(knowledgeList: string[]) {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "根节点名称" },
      children: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            children: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                   children: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING }
                        }
                      }
                  }
                }
              }
            }
          }
        }
      }
    },
    required: ["name", "children"]
  };

  const response = await getAI().models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{
      role: 'user', parts: [{
        text: `请根据以下知识点集合，生成一个结构化的思维导图：\n${knowledgeList.join('\n- ')}`
      }]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function generateAdvice(stats: any) {
  const response = await getAI().models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{
      role: 'user', parts: [{
        text: `基于以下用户的学习数据快照：\n${JSON.stringify(stats, null, 2)}\n\n生成一份极简、直击本质的个性化学习建议：\n1 短期攻克重点\n2 认知与方法优化建议\n3 下一步时间分配策略`
      }]
    }],
    config: {
      temperature: 0.4
    }
  });

  return response.text || "无法生成建议。";
}

export async function polishTextDirectly(text: string): Promise<string> {
  const response = await getAI().models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: 'user', parts: [{ text: `请将以下用户的文本润色得通顺流畅，修正错别字，保持原意。\n规则：极其重要！必须直接输出润色后的结果文本，绝对不能包含任何打招呼、解释（如“已经为您润色好了”）或其他多余字符！\n待润色文本：\n${text}` }] }],
    config: {
      temperature: 0.1
    }
  });

  return response.text?.trim() || text;
}

export async function getAIResponse(prompt: string, images?: string[], modelName: string = "gemini-3.1-pro-preview") {
  const parts: any[] = [{ text: prompt }];

  if (images && Array.isArray(images)) {
    images.forEach(img => {
      if (typeof img === 'string') {
         const match = img.match(/data:([^;]+);base64,(.*)/);
         if (match) {
           parts.push({
             inlineData: {
               data: match[2],
               mimeType: match[1]
             }
           });
         } else if (!img.startsWith('data:')) {
           const parts_img = img.split(',');
           if (parts_img.length === 2) {
             const mimeType = parts_img[0].split(':')[1].split(';')[0];
             parts.push({
               inlineData: {
                 data: parts_img[1],
                 mimeType
               }
             });
           }
         }
      }
    });
  }

  const response = await getAI().models.generateContent({
    model: modelName,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: "你是一个专业的学习助手。请根据用户提供的信息（可能有图片）给出简洁、专业的建议。"
    }
  });

  return response.text || "";
}

export async function getTTSAudio(text: string) {
  const response = await getAI().models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
  return base64Audio;
}

export async function getChatResponse(contents: any[], systemInstruction?: string, tools?: any[], modelName: string = "gemini-3.1-pro-preview") {
  try {
    const response = await getAI().models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        tools,
        temperature: 0.7
      }
    });

    return {
      text: response.text,
      functionCalls: response.functionCalls
    };
  } catch (error) {
    console.error("AI API Error:", error);
    throw error;
  }
}

