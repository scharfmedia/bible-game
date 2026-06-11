import type { Dialogue } from '@bible/engine'

// The shepherd guide. A controls-only walkthrough: how to travel the map, how a fight works (play
// cards → spend energy → pick a target → End Turn), and that you can rest at a fire to mend.
// STRICTLY mechanical — it must never mention the Spirit/flesh system, grace, or any "right way"
// to fight. The player figures that out for themselves. Text in @bible/i18n (dialogue.shepherdGuide.*).

const shepherdGuide: Dialogue = {
  id: 'shepherdGuide',
  start: 'greet',
  speakerNameKey: 'dialogue.shepherdGuide.name',
  nodes: {
    greet: {
      id: 'greet',
      lines: ['dialogue.shepherdGuide.greet.line1'],
      choices: [
        { id: 'travel', textKey: 'dialogue.shepherdGuide.choice.travel', goto: 'travel' },
        { id: 'places', textKey: 'dialogue.shepherdGuide.choice.places', goto: 'places' },
        { id: 'fight', textKey: 'dialogue.shepherdGuide.choice.fight', goto: 'fight' },
        { id: 'rest', textKey: 'dialogue.shepherdGuide.choice.rest', goto: 'rest' },
        { id: 'bye', textKey: 'dialogue.shepherdGuide.choice.bye' },
      ],
    },
    places: {
      id: 'places',
      lines: ['dialogue.shepherdGuide.places.line1', 'dialogue.shepherdGuide.places.line2'],
      choices: [
        { id: 'back', textKey: 'dialogue.shepherdGuide.choice.back', goto: 'greet' },
        { id: 'bye', textKey: 'dialogue.shepherdGuide.choice.bye' },
      ],
    },
    travel: {
      id: 'travel',
      lines: ['dialogue.shepherdGuide.travel.line1'],
      choices: [
        { id: 'back', textKey: 'dialogue.shepherdGuide.choice.back', goto: 'greet' },
        { id: 'bye', textKey: 'dialogue.shepherdGuide.choice.bye' },
      ],
    },
    fight: {
      id: 'fight',
      lines: ['dialogue.shepherdGuide.fight.line1', 'dialogue.shepherdGuide.fight.line2'],
      choices: [
        { id: 'back', textKey: 'dialogue.shepherdGuide.choice.back', goto: 'greet' },
        { id: 'bye', textKey: 'dialogue.shepherdGuide.choice.bye' },
      ],
    },
    rest: {
      id: 'rest',
      lines: ['dialogue.shepherdGuide.rest.line1'],
      choices: [
        { id: 'back', textKey: 'dialogue.shepherdGuide.choice.back', goto: 'greet' },
        { id: 'bye', textKey: 'dialogue.shepherdGuide.choice.bye' },
      ],
    },
  },
}

export const TUTORIAL_DIALOGUES: Record<string, Dialogue> = { shepherdGuide }
