import { analyzeMistake } from '../services/aiService';

export const recordMistake = async (subject: string, question: string, wrongAnswer: string, correctAnswer: string) => {
    try {
        console.log(`Analyzing mistake for ${subject}...`);
        const analysis = await analyzeMistake(question, wrongAnswer, correctAnswer);
        
        const newMistake = {
            id: crypto.randomUUID(),
            subject,
            questionContext: question,
            errorReason: analysis.errorReason || '认知暂未完全建立',
            actionAdvice: analysis.actionAdvice || '建议重新回顾基础概念，多加练习',
            nextReviewDate: new Date().toISOString(),
            interval: 0, 
            reps: 0
        };
        
        const currentStr = localStorage.getItem('mistakeBook');
        const mistakes = currentStr ? JSON.parse(currentStr) : [];
        mistakes.unshift(newMistake);
        localStorage.setItem('mistakeBook', JSON.stringify(mistakes));
        
        console.log('Mistake recorded in Learning Engine!');
    } catch (e) {
        console.error('Failed to record mistake:', e);
    }
};
