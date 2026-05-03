export interface MindMapNode {
  id: string;
  name: string;
  children?: MindMapNode[];
  content?: string;
  type?: 'hub' | 'topic' | 'category' | 'detail' | 'deep-detail' | 'leaf-practice';
  examples?: {
    id: string;
    q: string;
    analysis: string;
    answer: string;
    isCustom?: boolean;
  }[];
  tips?: string[];
}

export const mindMapData: MindMapNode = {
  id: "root",
  name: "七年级下册数学知识体思维导图",
  type: "hub",
  children: [
    {
      id: "ch1",
      name: "第一章：相交线与平行线",
      type: "topic",
      children: [
        {
          id: "ch1-1",
          name: "相交线基础",
          type: "category",
          children: [
            {
              id: "ch1-1-1",
              name: "对顶角深研",
              type: "detail",
              content: "性质：对顶角相等。必须具备两个特征：①有公共顶点；②两边互为反向延长线。",
              children: [
                {
                  id: "ch1-1-1-1",
                  name: "图形识别技巧",
                  type: "deep-detail",
                  content: "在复杂图形中，寻找‘X’形交叉点是锁定对顶角的关键。",
                  children: [
                    {
                      id: "ch1-1-1-1-1",
                      name: "实战练习：复杂图形判定",
                      type: "leaf-practice",
                      examples: [
                        {
                          id: "ex-ch1-01",
                          q: "如图，三条直线相交于一点O，共有多少对对顶角？",
                          analysis: "三条直线相交，形成6个小角。利用公式n(n-1)对，n为直线条数。",
                          answer: "6对 (3*2=6)"
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              id: "ch1-1-2",
              name: "垂线模型",
              type: "detail",
              children: [
                {
                  id: "ch1-1-2-1",
                  name: "点到直线距离",
                  type: "deep-detail",
                  children: [
                    {
                      id: "ch1-1-2-1-1",
                      name: "最短路径算法应用",
                      type: "leaf-practice",
                      examples: [
                        {
                          id: "ex-ch1-02",
                          q: "若P为直线L外一点，PA=3, PB=4, PC=2.5，PC⊥L，求P到L的距离。",
                          analysis: "点到直线的距离是垂线段的长度。",
                          answer: "2.5"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "ch1-2",
          name: "平行线判定与性质",
          type: "category",
          children: [
            {
              id: "ch1-2-1",
              name: "同位角/内错角/同旁内角",
              type: "detail",
              children: [
                {
                  id: "ch1-2-1-1",
                  name: "F/Z/U型判定法",
                  type: "deep-detail",
                  children: [
                    {
                      id: "ch1-2-1-1-1",
                      name: "专项：判定与性质互逆转换",
                      type: "leaf-practice",
                      examples: [
                        {
                          id: "ex-ch1-03",
                          q: "已知∠1=∠2，且均为同位角，能判定平行吗？",
                          analysis: "依据判定定理1：同位角相等，两直线平行。",
                          answer: "可以判定"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      tips: [
        "平行线拐点模型：M型（向左的角之和等于向右的角之和）",
        "几何证明步骤：已知 -> 分析 -> 推理 -> 结论"
      ]
    },
    {
      id: "ch2",
      name: "第二章：实数系统",
      type: "topic",
      children: [
        {
          id: "ch2-1",
          name: "开方运算",
          type: "category",
          children: [
            {
              id: "ch2-1-1",
              name: "算术平方根",
              type: "detail",
              children: [
                {
                  id: "ch2-1-1-1",
                  name: "非负性判定",
                  type: "deep-detail",
                  children: [
                    {
                      id: "ch2-1-1-1-1",
                      name: "综合：双重非负性应用",
                      type: "leaf-practice",
                      examples: [
                        {
                          id: "ex-ch2-01",
                          q: "若√(x-1) + |y+2| = 0，求x+y的值。",
                          analysis: "利用非负性之和为0，则各项均为0。",
                          answer: "x=1, y=-2, x+y=-1"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "ch4",
      name: "第四章：二元一次方程组",
      type: "topic",
      children: [
        {
          id: "ch4-1",
          name: "方程组解法",
          type: "category",
          children: [
            {
              id: "ch4-1-1",
              name: "消元法进阶",
              type: "detail",
              children: [
                {
                  id: "ch4-1-1-1",
                  name: "加减消元系数构造",
                  type: "deep-detail",
                  children: [
                    {
                      id: "ch4-1-1-1-1",
                      name: "速解法：倍数消元综合",
                      type: "leaf-practice",
                      examples: [
                        {
                          id: "ex-ch4-01",
                          q: "方程组：{2x+3y=7, 4x-y=5}，最快的消元步骤是？",
                          analysis: "观察系数，第一式乘2或第二式乘3。",
                          answer: "1式*2 - 2式 消x"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
