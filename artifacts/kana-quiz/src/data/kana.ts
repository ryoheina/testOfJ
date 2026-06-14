export interface KanaChar {
  kana: string;
  reading: string;
  type: 'hiragana' | 'katakana';
}

export const hiragana: KanaChar[] = [
  { kana: 'あ', reading: 'a', type: 'hiragana' }, { kana: 'い', reading: 'i', type: 'hiragana' }, { kana: 'う', reading: 'u', type: 'hiragana' }, { kana: 'え', reading: 'e', type: 'hiragana' }, { kana: 'お', reading: 'o', type: 'hiragana' },
  { kana: 'か', reading: 'ka', type: 'hiragana' }, { kana: 'き', reading: 'ki', type: 'hiragana' }, { kana: 'く', reading: 'ku', type: 'hiragana' }, { kana: 'け', reading: 'ke', type: 'hiragana' }, { kana: 'こ', reading: 'ko', type: 'hiragana' },
  { kana: 'さ', reading: 'sa', type: 'hiragana' }, { kana: 'し', reading: 'shi', type: 'hiragana' }, { kana: 'す', reading: 'su', type: 'hiragana' }, { kana: 'せ', reading: 'se', type: 'hiragana' }, { kana: 'そ', reading: 'so', type: 'hiragana' },
  { kana: 'た', reading: 'ta', type: 'hiragana' }, { kana: 'ち', reading: 'chi', type: 'hiragana' }, { kana: 'つ', reading: 'tsu', type: 'hiragana' }, { kana: 'て', reading: 'te', type: 'hiragana' }, { kana: 'と', reading: 'to', type: 'hiragana' },
  { kana: 'な', reading: 'na', type: 'hiragana' }, { kana: 'に', reading: 'ni', type: 'hiragana' }, { kana: 'ぬ', reading: 'nu', type: 'hiragana' }, { kana: 'ね', reading: 'ne', type: 'hiragana' }, { kana: 'の', reading: 'no', type: 'hiragana' },
  { kana: 'は', reading: 'ha', type: 'hiragana' }, { kana: 'ひ', reading: 'hi', type: 'hiragana' }, { kana: 'ふ', reading: 'fu', type: 'hiragana' }, { kana: 'へ', reading: 'he', type: 'hiragana' }, { kana: 'ほ', reading: 'ho', type: 'hiragana' },
  { kana: 'ま', reading: 'ma', type: 'hiragana' }, { kana: 'み', reading: 'mi', type: 'hiragana' }, { kana: 'む', reading: 'mu', type: 'hiragana' }, { kana: 'め', reading: 'me', type: 'hiragana' }, { kana: 'も', reading: 'mo', type: 'hiragana' },
  { kana: 'や', reading: 'ya', type: 'hiragana' }, { kana: 'ゆ', reading: 'yu', type: 'hiragana' }, { kana: 'よ', reading: 'yo', type: 'hiragana' },
  { kana: 'ら', reading: 'ra', type: 'hiragana' }, { kana: 'り', reading: 'ri', type: 'hiragana' }, { kana: 'る', reading: 'ru', type: 'hiragana' }, { kana: 'れ', reading: 're', type: 'hiragana' }, { kana: 'ろ', reading: 'ro', type: 'hiragana' },
  { kana: 'わ', reading: 'wa', type: 'hiragana' }, { kana: 'を', reading: 'wo', type: 'hiragana' }, { kana: 'ん', reading: 'n', type: 'hiragana' }
];

export const katakana: KanaChar[] = [
  { kana: 'ア', reading: 'a', type: 'katakana' }, { kana: 'イ', reading: 'i', type: 'katakana' }, { kana: 'ウ', reading: 'u', type: 'katakana' }, { kana: 'エ', reading: 'e', type: 'katakana' }, { kana: 'オ', reading: 'o', type: 'katakana' },
  { kana: 'カ', reading: 'ka', type: 'katakana' }, { kana: 'キ', reading: 'ki', type: 'katakana' }, { kana: 'ク', reading: 'ku', type: 'katakana' }, { kana: 'ケ', reading: 'ke', type: 'katakana' }, { kana: 'コ', reading: 'ko', type: 'katakana' },
  { kana: 'サ', reading: 'sa', type: 'katakana' }, { kana: 'シ', reading: 'shi', type: 'katakana' }, { kana: 'ス', reading: 'su', type: 'katakana' }, { kana: 'セ', reading: 'se', type: 'katakana' }, { kana: 'ソ', reading: 'so', type: 'katakana' },
  { kana: 'タ', reading: 'ta', type: 'katakana' }, { kana: 'チ', reading: 'chi', type: 'katakana' }, { kana: 'ツ', reading: 'tsu', type: 'katakana' }, { kana: 'テ', reading: 'te', type: 'katakana' }, { kana: 'ト', reading: 'to', type: 'katakana' },
  { kana: 'ナ', reading: 'na', type: 'katakana' }, { kana: 'ニ', reading: 'ni', type: 'katakana' }, { kana: 'ヌ', reading: 'nu', type: 'katakana' }, { kana: 'ネ', reading: 'ne', type: 'katakana' }, { kana: 'ノ', reading: 'no', type: 'katakana' },
  { kana: 'ハ', reading: 'ha', type: 'katakana' }, { kana: 'ヒ', reading: 'hi', type: 'katakana' }, { kana: 'フ', reading: 'fu', type: 'katakana' }, { kana: 'ヘ', reading: 'he', type: 'katakana' }, { kana: 'ホ', reading: 'ho', type: 'katakana' },
  { kana: 'マ', reading: 'ma', type: 'katakana' }, { kana: 'ミ', reading: 'mi', type: 'katakana' }, { kana: 'ム', reading: 'mu', type: 'katakana' }, { kana: 'メ', reading: 'me', type: 'katakana' }, { kana: 'モ', reading: 'mo', type: 'katakana' },
  { kana: 'ヤ', reading: 'ya', type: 'katakana' }, { kana: 'ユ', reading: 'yu', type: 'katakana' }, { kana: 'ヨ', reading: 'yo', type: 'katakana' },
  { kana: 'ラ', reading: 'ra', type: 'katakana' }, { kana: 'リ', reading: 'ri', type: 'katakana' }, { kana: 'ル', reading: 'ru', type: 'katakana' }, { kana: 'レ', reading: 're', type: 'katakana' }, { kana: 'ロ', reading: 'ro', type: 'katakana' },
  { kana: 'ワ', reading: 'wa', type: 'katakana' }, { kana: 'ヲ', reading: 'wo', type: 'katakana' }, { kana: 'ン', reading: 'n', type: 'katakana' }
];

export const allKana = [...hiragana, ...katakana];

export const getKanaDataset = (mode: 'hiragana' | 'katakana' | 'mixed'): KanaChar[] => {
  if (mode === 'hiragana') return [...hiragana];
  if (mode === 'katakana') return [...katakana];
  return [...allKana];
};
