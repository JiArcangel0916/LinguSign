import { supabase } from '../../supabaseClient';

export const generateQuiz = async (category) => {
  let query = supabase.from('Word').select('word_id, word, media_path, categ_id, Category(categ_name)');

  if (category === 'Alphabet' || category === 'Digit') {
    const { data: catData } = await supabase
      .from('Category')
      .select('categ_id')
      .eq('categ_name', category)
      .single();
    if (catData) query = query.eq('categ_id', catData.categ_id);
  } else {
    const { data: catData } = await supabase
      .from('Category')
      .select('categ_id')
      .eq('categ_name', category)
      .single();
    if (catData) query = query.eq('categ_id', catData.categ_id);
  }

  const { data: pool, error } = await query;
  if (error || !pool || pool.length < 4) return [];

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const vals = shuffled.slice(0, 5);

  return vals.map((val) => {
    const distractors = pool
      .filter((item) => item.word_id !== val.word_id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const choices = [val, ...distractors]
      .map((c) => ({ text: c.word, media: c.media_path }))
      .sort(() => 0.5 - Math.random());

    return {
      mainText: val.word,
      mainMedia: val.media_path,
      choices,
    };
  });
};