import { tokenize, type VerseChallenge } from '@bible/engine'

// Verse gap-fill challenges with REAL public-domain text (KJV / Luther 1912). The player types
// the missing CONTENT words; the engine checks tolerantly (case/punct/umlaut + opt. fuzzy on long
// words). Blank indices reference the whitespace tokenization of `fullText`.

const PHIL_46_EN =
  'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.'
const PHIL_46_DE =
  'Sorget nichts! sondern in allem lasset eure Bitten im Gebet und Flehen mit Danksagung vor Gott kund werden.'
const ZECH_46_EN =
  'Not by might, nor by power, but by my spirit, saith the LORD of hosts.'
const ZECH_46_DE =
  'Es soll nicht durch Heer oder Kraft, sondern durch meinen Geist geschehen, spricht der HERR Zebaoth.'
const LUKE_1027_EN =
  'Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy strength, and with all thy mind; and thy neighbour as thyself.'
const LUKE_1027_DE =
  'Du sollst Gott, deinen HERRN, lieben von ganzem Herzen, von ganzer Seele, von allen Kräften und von ganzem Gemüte und deinen Nächsten als dich selbst.'

// Helper: token index of the first token whose normalized core matches `word`.
const idxOf = (text: string, word: string): number =>
  tokenize(text).findIndex((t) => t.replace(/[^A-Za-zÀ-ÿ]/g, '').toLowerCase() === word.toLowerCase())

export const VERSES: Record<string, VerseChallenge> = {
  phil_4_6: {
    id: 'phil_4_6',
    ref: { book: 'Philippians', chapter: 4, verse: 6 },
    cardDefId: 'verse_phil_4_6',
    fruitAffinity: 'faith',
    byLocale: {
      en: {
        translation: 'KJV',
        reference: 'Philippians 4:6',
        fullText: PHIL_46_EN,
        tokens: tokenize(PHIL_46_EN),
        blankIndices: [
          idxOf(PHIL_46_EN, 'careful'),
          idxOf(PHIL_46_EN, 'prayer'),
          idxOf(PHIL_46_EN, 'supplication'),
          idxOf(PHIL_46_EN, 'God'),
        ],
        fuzzyIndices: [idxOf(PHIL_46_EN, 'supplication')],
      },
      de: {
        translation: 'LUTHER1912',
        reference: 'Philipper 4,6',
        fullText: PHIL_46_DE,
        tokens: tokenize(PHIL_46_DE),
        blankIndices: [idxOf(PHIL_46_DE, 'Gebet'), idxOf(PHIL_46_DE, 'Flehen'), idxOf(PHIL_46_DE, 'Gott')],
      },
    },
  },
  zech_4_6: {
    id: 'zech_4_6',
    ref: { book: 'Zechariah', chapter: 4, verse: 6 },
    cardDefId: 'verse_zech_4_6',
    fruitAffinity: 'faith',
    byLocale: {
      en: {
        translation: 'KJV',
        reference: 'Zechariah 4:6',
        fullText: ZECH_46_EN,
        tokens: tokenize(ZECH_46_EN),
        blankIndices: [idxOf(ZECH_46_EN, 'might'), idxOf(ZECH_46_EN, 'power'), idxOf(ZECH_46_EN, 'spirit')],
      },
      de: {
        translation: 'LUTHER1912',
        reference: 'Sacharja 4,6',
        fullText: ZECH_46_DE,
        tokens: tokenize(ZECH_46_DE),
        blankIndices: [idxOf(ZECH_46_DE, 'Heer'), idxOf(ZECH_46_DE, 'Kraft'), idxOf(ZECH_46_DE, 'Geist')],
      },
    },
  },
  luke_10_27: {
    id: 'luke_10_27',
    ref: { book: 'Luke', chapter: 10, verse: 27 },
    cardDefId: 'verse_luke_10_27',
    fruitAffinity: 'mercy',
    byLocale: {
      en: {
        translation: 'KJV',
        reference: 'Luke 10:27',
        fullText: LUKE_1027_EN,
        tokens: tokenize(LUKE_1027_EN),
        blankIndices: [idxOf(LUKE_1027_EN, 'love'), idxOf(LUKE_1027_EN, 'heart'), idxOf(LUKE_1027_EN, 'neighbour')],
        acceptableAlternatives: { [idxOf(LUKE_1027_EN, 'neighbour')]: ['neighbor'] },
      },
      de: {
        translation: 'LUTHER1912',
        reference: 'Lukas 10,27',
        fullText: LUKE_1027_DE,
        tokens: tokenize(LUKE_1027_DE),
        blankIndices: [idxOf(LUKE_1027_DE, 'lieben'), idxOf(LUKE_1027_DE, 'Herzen'), idxOf(LUKE_1027_DE, 'Nächsten')],
      },
    },
  },
}
