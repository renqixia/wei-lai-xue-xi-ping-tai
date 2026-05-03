export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // index of the correct option
}

export interface Node {
  id: string;
  name: string;
  grade: number;
  category: '数与代数' | '图形与几何' | '统计与概率';
  val: number;
  traps?: string[];
  example?: string;
  analysis?: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites?: string[]; // IDs of prerequisite nodes
  quiz?: QuizQuestion[];
}

export interface Link {
  source: string;
  target: string;
  type: 'direct' | 'derivative' | 'core';
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export const mathData: GraphData = {
  nodes: [
    // Grade 7
    { id: '7-1-1', name: '正数与负数', grade: 7, category: '数与代数', val: 1, difficulty: 'easy' },
    { id: '7-1-2', name: '有理数', grade: 7, category: '数与代数', val: 1, difficulty: 'easy' },
    { id: '7-1-3', name: '数轴', grade: 7, category: '数与代数', val: 2, difficulty: 'medium' },
    { id: '7-1-4', name: '相反数与绝对值', grade: 7, category: '数与代数', val: 2, difficulty: 'medium' },
    { 
      id: '7-1-6', 
      name: '有理数混合运算', 
      grade: 7, 
      category: '数与代数', 
      val: 3,
      difficulty: 'hard',
      explanation: '有理数的加减乘除及乘方的混合运算。遵循“先乘方，再乘除，最后加减”的原则。',
      prerequisites: ['7-1-1', '7-1-2'],
      quiz: [
        {
          question: '计算：-2² + (-2)²',
          options: ['0', '8', '-8', '4'],
          answer: 0
        }
      ],
      traps: [
        '乘方符号判断：-2² = -4，(-2)² = 4',
        '运算顺序先乘方再乘除',
        '除以一个数等于乘以它的倒数，0没有倒数'
      ],
      example: '计算：-1⁴ - (1-0.5) × 1/3 × [2 - (-3)²]',
      analysis: '原式 = -1 - 0.5 × 1/3 × (2-9) = -1 + 7/6 = 1/6。注意-1⁴的底数是1。'
    },
    { id: '7-2-1', name: '单项式与多项式', grade: 7, category: '数与代数', val: 2, difficulty: 'medium' },
    { 
      id: '7-2-5', 
      name: '整式加减', 
      grade: 7, 
      category: '数与代数', 
      val: 3,
      difficulty: 'medium',
      explanation: '整式的加减实质上就是合并同类项。去括号时需注意符号变化，是代数运算的基础。',
      traps: [
        '括号前是负号，每一项都变号，易漏项',
        '同类项判断忽略字母顺序',
        '去括号时漏乘括号外的系数'
      ],
      example: '化简：3x² - [5x - (2x-3) + 2x²]',
      analysis: '原式 = 3x² - (5x-2x+3+2x²) = 3x²-3x-3-2x² = x²-3x-3。'
    },
    { 
      id: '7-3-1', 
      name: '一元一次方程', 
      grade: 7, 
      category: '数与代数', 
      val: 3,
      difficulty: 'hard',
      explanation: '含有一个未知数，且未知数的次数是1的方程。解法包括去分母、去括号、移项、合并同类项、系数化为1。',
      prerequisites: ['7-2-5', '7-1-6'],
      quiz: [
        {
          question: '解方程 2x - 4 = 6，x 的值是？',
          options: ['1', '5', '10', '2'],
          answer: 1
        }
      ],
      traps: [
        '去分母漏乘常数项',
        '移项不变号',
        '配套问题比例关系找错',
        '行程问题顺逆水速度公式记混'
      ],
      example: '解方程：(2x-1)/3 = 1 - (x+2)/4',
      analysis: '去分母：4(2x-1)=12-3(x+2) → 8x-4=12-3x-6 → 11x=10 → x=10/11。'
    },
    { 
      id: '7-4-1', 
      name: '几何图形初步', 
      grade: 7, 
      category: '图形与几何', 
      val: 2,
      difficulty: 'medium',
      explanation: '点、线、面、体的基本认知，线段与角的度量、比较及和差计算。',
      traps: [
        '无图几何题双解（点在线段延长线上）',
        '度分秒换算60进制出错',
        '余角补角定义混淆'
      ],
      example: '线段AB=10，点C在直线AB上，BC=4，求AC。',
      analysis: 'C在AB之间：AC=6；C在AB延长线：AC=14。'
    },
    { 
      id: '7-5-2', 
      name: '相交线与平行线', 
      grade: 7, 
      category: '图形与几何', 
      val: 3,
      difficulty: 'hard',
      explanation: '研究同一平面内两条直线的位置关系。核心在于平行线的判定与性质，是几何推理的入门。',
      traps: [
        '判定与性质互逆用反',
        '“拐角模型”漏作辅助线',
        '证明逻辑不严谨，跳步严重'
      ],
      example: 'AB∥CD，∠A=30°，∠C=40°，求∠AEC。',
      analysis: '过E作平行线，利用内错角相等，∠AEC=30°+40°=70°。'
    },
    { id: '7-6-1', name: '实数', grade: 7, category: '数与代数', val: 2, difficulty: 'medium' },
    { id: '7-7-1', name: '平面直角坐标系', grade: 7, category: '图形与几何', val: 2, difficulty: 'medium' },
    { id: '7-8-1', name: '二元一次方程组', grade: 7, category: '数与代数', val: 2, difficulty: 'medium' },
    { id: '7-9-1', name: '不等式与不等式组', grade: 7, category: '数与代数', val: 2, difficulty: 'medium' },
    { id: '7-10-1', name: '数据的收集与整理', grade: 7, category: '统计与概率', val: 1, difficulty: 'easy' },

    // Grade 7 Second Semester Detailed Hubs (New)
    { 
      id: '7-5-2-1', 
      name: '相交线与平行线', 
      grade: 7, 
      category: '图形与几何', 
      val: 3, 
      difficulty: 'medium',
      explanation: '研究平面内两直线的位置关系，包括对顶角、邻补角、垂直及平行线的判定与性质。'
    },
    { 
      id: '7-6-1-1', 
      name: '实数体系', 
      grade: 7, 
      category: '数与代数', 
      val: 3, 
      difficulty: 'medium',
      explanation: '从有理数扩展到实数，引入平方根、立方根及无理数的概念。'
    },
    { 
      id: '7-7-1-1', 
      name: '平面直角坐标系', 
      grade: 7, 
      category: '图形与几何', 
      val: 3, 
      difficulty: 'medium',
      explanation: '建立数形结合的基础，通过坐标确定点的位置并研究图形变换。'
    },
    { 
      id: '7-8-1-1', 
      name: '二元一次方程组', 
      grade: 7, 
      category: '数与代数', 
      val: 3, 
      difficulty: 'hard',
      explanation: '学习代入消元与加减消元，解决含有两个未知数的实际问题。'
    },
    { 
      id: '7-9-1-1', 
      name: '不等式与不等式组', 
      grade: 7, 
      category: '数与代数', 
      val: 3, 
      difficulty: 'hard',
      explanation: '研究不等关系，掌握解一元一次不等式（组）的步骤与数轴表示。'
    },
    { 
      id: '7-10-1-1', 
      name: '统计调查与直方图', 
      grade: 7, 
      category: '统计与概率', 
      val: 2, 
      difficulty: 'easy',
      explanation: '学习数据的收集、整理、描述与分析，掌握全面调查与抽样调查。'
    },

    // Grade 8
    { 
      id: '8-11-1', 
      name: '三角形', 
      grade: 8, 
      category: '图形与几何', 
      val: 3,
      difficulty: 'medium',
      explanation: '三角形的三边关系、内角和定理及外角性质。是后续所有多边形研究的基础。',
      traps: [
        '等腰三角形边长分类讨论漏解',
        '外角性质应用时找错不相邻内角'
      ]
    },
    { 
      id: '8-12-1', 
      name: '全等三角形', 
      grade: 8, 
      category: '图形与几何', 
      val: 3,
      difficulty: 'hard',
      explanation: '能够完全重合的两个三角形。判定方法SSS, SAS, ASA, AAS, HL是几何证明的核心工具。',
      traps: [
        'SSA不能判定全等',
        '对应顶点不匹配导致结论错误'
      ]
    },
    { id: '8-13-1', name: '轴对称', grade: 8, category: '图形与几何', val: 2, difficulty: 'medium' },
    { 
      id: '8-14-1', 
      name: '整式乘法与因式分解', 
      grade: 8, 
      category: '数与代数', 
      val: 3,
      difficulty: 'hard',
      explanation: '幂的运算、整式乘法公式及因式分解。是分式运算和解一元二次方程的前提。',
      traps: [
        '完全平方公式漏掉2ab项',
        '因式分解不彻底，未分到不能再分为止'
      ]
    },
    { id: '8-15-1', name: '分式', grade: 8, category: '数与代数', val: 2, difficulty: 'medium' },
    { id: '8-16-1', name: '二次根式', grade: 8, category: '数与代数', val: 2, difficulty: 'medium' },
    { 
      id: '8-17-1', 
      name: '勾股定理', 
      grade: 8, 
      category: '图形与几何', 
      val: 3,
      difficulty: 'hard',
      explanation: '直角三角形特有的边量关系。广泛应用于几何计算、折叠问题及实际测量。'
    },
    { 
      id: '8-18-1', 
      name: '平行四边形', 
      grade: 8, 
      category: '图形与几何', 
      val: 3,
      difficulty: 'hard',
      explanation: '研究特殊四边形（矩形、菱形、正方形）的性质与判定。综合性极强。'
    },
    { 
      id: '8-19-1', 
      name: '一次函数', 
      grade: 8, 
      category: '数与代数', 
      val: 3,
      difficulty: 'hard',
      explanation: '函数思想的入门。研究变量间的线性关系，体现数形结合的核心思想。'
    },
    { id: '8-20-1', name: '数据的分析', grade: 8, category: '统计与概率', val: 2, difficulty: 'medium' },

    // Grade 9
    { 
      id: '9-21-1', 
      name: '一元二次方程', 
      grade: 9, 
      category: '数与代数', 
      val: 3,
      difficulty: 'hard',
      explanation: '未知数最高次数为2的整式方程。解法多样，根的判别式和韦达定理是核心。'
    },
    { id: '9-22-1', name: '旋转', grade: 9, category: '图形与几何', val: 2, difficulty: 'medium' },
    { 
      id: '9-23-1', 
      name: '圆', 
      grade: 9, 
      category: '图形与几何', 
      val: 3,
      difficulty: 'hard',
      explanation: '初中几何的压轴模块。涉及垂径定理、圆周角定理、切线性质等复杂关联。'
    },
    { id: '9-25-1', name: '概率初步', grade: 9, category: '统计与概率', val: 2, difficulty: 'medium' },
    { id: '9-26-1', name: '反比例函数', grade: 9, category: '数与代数', val: 3, difficulty: 'hard' },
    { 
      id: '9-27-1', 
      name: '相似三角形', 
      grade: 9, 
      category: '图形与几何', 
      val: 3,
      difficulty: 'hard',
      explanation: '全等三角形的推广。研究图形的缩放关系，是解决几何综合题的利器。'
    },
    { id: '9-28-1', name: '锐角三角函数', grade: 9, category: '图形与几何', val: 3, difficulty: 'hard' },
    { 
      id: '9-28-2', 
      name: '二次函数', 
      grade: 9, 
      category: '数与代数', 
      val: 3,
      difficulty: 'hard',
      explanation: '初中代数的巅峰。抛物线的性质、最值问题及与几何的综合是中考重难点。',
      prerequisites: ['8-19-1', '9-21-1'],
      quiz: [
        {
          question: '二次函数 y = x² - 2x + 1 的顶点坐标是？',
          options: ['(1, 0)', '(0, 1)', '(-1, 0)', '(1, 1)'],
          answer: 0
        }
      ]
    },
    { id: '9-29-1', name: '投影与视图', grade: 9, category: '图形与几何', val: 1, difficulty: 'easy' },
  ],
  links: [
    // Grade 7 Connections
    { source: '7-1-6', target: '7-2-5', type: 'core' }, // 有理数运算是整式加减基础
    { source: '7-1-6', target: '7-3-1', type: 'core' }, // 有理数运算是解方程基础
    { source: '7-1-6', target: '7-4-1', type: 'derivative' }, // 有理数运算用于几何度量
    { source: '7-1-3', target: '7-7-1', type: 'core' }, // 数轴是坐标系雏形
    { source: '7-2-5', target: '7-3-1', type: 'core' }, // 整式加减是解方程基础
    { source: '7-2-5', target: '8-14-1', type: 'core' }, // 整式概念是乘法因式分解前提
    { source: '7-3-1', target: '7-8-1', type: 'core' }, // 一元一次方程消元到二元
    { source: '7-3-1', target: '7-9-1', type: 'derivative' }, // 方程与不等式解法逻辑一致
    { source: '7-4-1', target: '7-5-2', type: 'core' }, // 几何初步延伸到相交平行
    { source: '7-5-2', target: '7-7-1', type: 'derivative' }, // 平行平移与坐标平移
    { source: '7-6-1', target: '7-7-1', type: 'core' }, // 实数与坐标轴一一对应
    { source: '7-10-1', target: '8-20-1', type: 'core' }, // 数据整理到分析

    // Grade 7 Second Semester Connections (New)
    { source: '7-1-6', target: '7-6-1-1', type: 'core' }, // 有理数到实数
    { source: '7-3-1', target: '7-8-1-1', type: 'core' }, // 一元到二元方程组
    { source: '7-8-1-1', target: '7-7-1-1', type: 'derivative' }, // 方程组与坐标系
    { source: '7-9-1-1', target: '7-8-1-1', type: 'derivative' }, // 不等式与方程组
    { source: '7-5-2-1', target: '7-1-6', type: 'derivative' }, // 平行线性质涉及有理数计算
    { source: '7-7-1-1', target: '7-5-2-1', type: 'derivative' }, // 坐标平移与几何平移
    { source: '7-10-1-1', target: '7-10-1', type: 'core' },

    // Grade 8 Connections
    { source: '8-11-1', target: '8-12-1', type: 'core' }, // 三角形关系是全等判定基础
    { source: '8-11-1', target: '8-13-1', type: 'derivative' }, // 等腰三角形是轴对称图形
    { source: '8-12-1', target: '8-18-1', type: 'core' }, // 全等是平行四边形证明工具
    { source: '8-14-1', target: '8-15-1', type: 'core' }, // 因式分解是分式化简前提
    { source: '8-14-1', target: '9-21-1', type: 'core' }, // 因式分解法解一元二次方程
    { source: '8-15-1', target: '9-26-1', type: 'core' }, // 分式延伸到反比例函数
    { source: '8-16-1', target: '8-17-1', type: 'derivative' }, // 开方运算用于勾股定理求边
    { source: '8-16-1', target: '9-21-1', type: 'core' }, // 二次根式用于求根公式
    { source: '8-17-1', target: '9-28-1', type: 'core' }, // 勾股定理是三角函数基础
    { source: '8-18-1', target: '9-27-1', type: 'derivative' }, // 平行线引出相似三角形
    { source: '8-19-1', target: '7-8-1', type: 'derivative' }, // 函数交点是方程组的解
    { source: '8-19-1', target: '9-28-2', type: 'core' }, // 一次函数延伸到二次函数
    { source: '8-20-1', target: '9-25-1', type: 'core' }, // 数据分析到概率初步

    // Grade 9 Connections
    { source: '9-21-1', target: '9-28-2', type: 'core' }, // 方程根是函数与x轴交点
    { source: '9-22-1', target: '9-23-1', type: 'derivative' }, // 旋转对称是圆的基础
    { source: '9-27-1', target: '9-28-1', type: 'core' }, // 相似比引出三角函数定义
    { source: '9-27-1', target: '9-23-1', type: 'derivative' }, // 相似用于圆的几何证明
    { source: '9-29-1', target: '9-27-1', type: 'derivative' }, // 投影形成相似三角形
  ]
};
