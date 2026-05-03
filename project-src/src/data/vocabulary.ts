export type WordCategory = 'KET' | 'PET' | 'Essential';

export interface Word {
  id: string;
  word: string;
  translation: string;
  phonetic: string;
  example: string;
  category: WordCategory;
}

export const vocabularyData: Word[] = [
  // KET (Key English Test) Samples
  { id: 'k1', word: 'accident', translation: '事故，意外', phonetic: '/ˈæksɪdənt/', example: 'He had a car accident.', category: 'KET' },
  { id: 'k2', word: 'believe', translation: '相信', phonetic: '/bɪˈliːv/', example: 'I believe you can do it.', category: 'KET' },
  { id: 'k3', word: 'catch', translation: '抓住，赶上', phonetic: '/kætʃ/', example: 'Catch the ball!', category: 'KET' },
  { id: 'k4', word: 'decide', translation: '决定', phonetic: '/dɪˈsaɪd/', example: 'We decided to go home.', category: 'KET' },
  { id: 'k5', word: 'excellent', translation: '优秀的', phonetic: '/ˈeksələnt/', example: 'That is an excellent idea.', category: 'KET' },
  { id: 'k6', word: 'factory', translation: '工厂', phonetic: '/ˈfæktəri/', example: 'He works in a shoe factory.', category: 'KET' },
  { id: 'k7', word: 'guess', translation: '猜测', phonetic: '/ɡes/', example: 'Can you guess my age?', category: 'KET' },
  { id: 'k8', word: 'happen', translation: '发生', phonetic: '/ˈhæpən/', example: 'What happened here?', category: 'KET' },
  { id: 'k9', word: 'improve', translation: '改善，提高', phonetic: '/ɪmˈpruːv/', example: 'I want to improve my English.', category: 'KET' },
  { id: 'k10', word: 'journey', translation: '旅行', phonetic: '/ˈdʒɜːni/', example: 'Have a safe journey!', category: 'KET' },

  // PET (Preliminary English Test) Samples
  { id: 'p1', word: 'accommodation', translation: '住宿', phonetic: '/əˌkɒməˈdeɪʃn/', example: 'We need to find accommodation for the night.', category: 'PET' },
  { id: 'p2', word: 'brilliant', translation: '聪颖的，绝妙的', phonetic: '/ˈbrɪliənt/', example: 'She has a brilliant mind.', category: 'PET' },
  { id: 'p3', word: 'concentrate', translation: '集中注意力', phonetic: '/ˈkɒnsntreɪt/', example: 'I can\'t concentrate on my work.', category: 'PET' },
  { id: 'p4', word: 'destination', translation: '目的地', phonetic: '/ˌdestɪˈneɪʃn/', example: 'We reached our destination at noon.', category: 'PET' },
  { id: 'p5', word: 'environment', translation: '环境', phonetic: '/ɪnˈvaɪrənmənt/', example: 'We must protect the environment.', category: 'PET' },
  { id: 'p6', word: 'fascinating', translation: '迷人的', phonetic: '/ˈfæsɪneɪtɪŋ/', example: 'The museum was fascinating.', category: 'PET' },
  { id: 'p7', word: 'generation', translation: '一代人', phonetic: '/ˌdʒenəˈreɪʃn/', example: 'The younger generation loves technology.', category: 'PET' },
  { id: 'p8', word: 'hesitate', translation: '犹豫', phonetic: '/ˈhezɪteɪt/', example: 'Don\'t hesitate to call me.', category: 'PET' },
  { id: 'p9', word: 'independent', translation: '独立的', phonetic: '/ˌɪndɪˈpendənt/', example: 'She is a very independent woman.', category: 'PET' },
  { id: 'p10', word: 'knowledge', translation: '知识', phonetic: '/ˈnɒlɪdʒ/', example: 'Knowledge is power.', category: 'PET' },

  // Essential 1000 (Primary/Middle School) Samples
  { id: 'e1', word: 'apple', translation: '苹果', phonetic: '/ˈæpl/', example: 'I eat an apple every day.', category: 'Essential' },
  { id: 'e2', word: 'book', translation: '书', phonetic: '/bʊk/', example: 'This is a good book.', category: 'Essential' },
  { id: 'e3', word: 'cat', translation: '猫', phonetic: '/kæt/', example: 'The cat is sleeping.', category: 'Essential' },
  { id: 'e4', word: 'dog', translation: '狗', phonetic: '/dɒɡ/', example: 'My dog likes to play.', category: 'Essential' },
  { id: 'e5', word: 'elephant', translation: '大象', phonetic: '/ˈelɪfənt/', example: 'An elephant has a long trunk.', category: 'Essential' },
  { id: 'e6', word: 'friend', translation: '朋友', phonetic: '/frend/', example: 'She is my best friend.', category: 'Essential' },
  { id: 'e7', word: 'good', translation: '好的', phonetic: '/ɡʊd/', example: 'Have a good day!', category: 'Essential' },
  { id: 'e8', word: 'happy', translation: '开心的', phonetic: '/ˈhæpi/', example: 'I am very happy today.', category: 'Essential' },
  { id: 'e9', word: 'idea', translation: '主意', phonetic: '/aɪˈdɪə/', example: 'That is a great idea.', category: 'Essential' },
  { id: 'e10', word: 'jump', translation: '跳跃', phonetic: '/dʒʌmp/', example: 'The frog can jump high.', category: 'Essential' },
];
