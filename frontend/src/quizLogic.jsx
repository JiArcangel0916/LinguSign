{/* 
    MAIN LOGIC FOR GENERATING QUIZZES 
    - this code accepts a "category" to point which pool of word/letters it would get its questions from
    - the code returns a list of objects containing the 5 questions for learning:
        - each index contains the mainText, mainMedia, and choices
        - the displaying of mainMedia, mainText can be interchanged depending on the type of learning done
        - interchanging can also be done within the choices since the choices is also a list of objects containg the label and media
    - this code can be called when the user starts their learning session or when they wish to continue leraning on the same category
*/}

import { ALPHABET_DICT, DIGIT_DICT, WORD_DICT } from "./aslData";

export const generateQuiz = (category) => {
    let pool = []

    if (category == 'Alphabet')
        pool = ALPHABET_DICT
    else if (category == 'Digit')
        pool = DIGIT_DICT
    else {
        const categ = WORD_DICT.find(item => item.category == category)
        pool = categ.words
    }

    const vals = [...pool].sort(() => 0.5 - Math.random()).slice(0, 5);
    return vals.map(val => {
        const answerLabel = val.word
        const answerMedia = val.media

        const distractors = pool
        .filter(item => (item.id !== val.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)

        const choices = [val, ...distractors]
        .map(c => ({ text: c.word, media: c.media}))
        .sort(() => 0.5 - Math.random());

        return {
            mainText: answerLabel,
            mainMedia: answerMedia,
            choices: choices
        }
    })
}