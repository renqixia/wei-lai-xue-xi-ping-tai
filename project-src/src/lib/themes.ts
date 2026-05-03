
export interface PaletteColors {
  bg: string;
  text: string;
  accent: string;
}

export interface ColorScheme {
  id: number;
  name: string;
  purpose: string;
  light: PaletteColors;
  dark: PaletteColors;
}

export const colorSchemes: ColorScheme[] = [
  {
    id: 1,
    name: "温柔奶白 + 浅蓝",
    purpose: "最适合阅读、题库、笔记",
    light: { bg: "#FCFBFA", text: "#1F2937", accent: "#3B82F6" },
    dark: { bg: "#0F1115", text: "#F3F4F6", accent: "#60A5FA" }
  },
  {
    id: 2,
    name: "浅杏暖黄 + 淡棕",
    purpose: "最温馨、适合长期学习",
    light: { bg: "#FFFDF7", text: "#433E3A", accent: "#D97706" },
    dark: { bg: "#161412", text: "#FEF7ED", accent: "#F59E0B" }
  },
  {
    id: 3,
    name: "薄荷淡绿 + 浅灰",
    purpose: "清爽专注，防疲劳",
    light: { bg: "#F8FAF8", text: "#1F2926", accent: "#059669" },
    dark: { bg: "#0D1210", text: "#E5F0EC", accent: "#34D399" }
  },
  {
    id: 4,
    name: "淡紫温柔风",
    purpose: "优雅学习、女生友好",
    light: { bg: "#FAF8FC", text: "#2E2436", accent: "#8B5CF6" },
    dark: { bg: "#120D1A", text: "#F3E8FF", accent: "#A78BFA" }
  },
  {
    id: 5,
    name: "浅灰极简风",
    purpose: "高级、克制、适合工具类",
    light: { bg: "#F9FAFB", text: "#111827", accent: "#4B5563" },
    dark: { bg: "#0A0A0C", text: "#E5E7EB", accent: "#9CA3AF" }
  },
  {
    id: 6,
    name: "暖橙活力风",
    purpose: "提升动力、打卡激励",
    light: { bg: "#FFFAFA", text: "#3B2824", accent: "#EA580C" },
    dark: { bg: "#170D09", text: "#FFF1E6", accent: "#FB923C" }
  },
  {
    id: 7,
    name: "淡青学术风",
    purpose: "冷静理性、适合理科学习",
    light: { bg: "#F6FCFE", text: "#1A2E35", accent: "#0284C7" },
    dark: { bg: "#0B1519", text: "#E0F2FE", accent: "#38BDF8" }
  },
  {
    id: 8,
    name: "豆沙温柔粉",
    purpose: "柔和不艳、护眼舒适",
    light: { bg: "#FEF7F9", text: "#3D2429", accent: "#E11D48" },
    dark: { bg: "#1A0F13", text: "#FFE4E6", accent: "#FB7185" }
  },
  {
    id: 9,
    name: "森林浅绿",
    purpose: "自然护眼、长时间阅读首选",
    light: { bg: "#FAFDF7", text: "#243324", accent: "#65A30D" },
    dark: { bg: "#0F1A0F", text: "#ECFCCB", accent: "#A3E635" }
  },
  {
    id: 10,
    name: "经典蓝白",
    purpose: "正式、专业、教育机构风",
    light: { bg: "#FFFFFF", text: "#0F172A", accent: "#2563EB" },
    dark: { bg: "#0B1120", text: "#F8FAFC", accent: "#3B82F6" }
  }
];
