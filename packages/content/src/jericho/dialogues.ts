import type { Dialogue } from '@bible/engine'

// Branching conversations for the Jericho road. The merchant camp (a hub node) is populated with
// MULTIPLE talkable entities — a merchant, a fellow traveler, and a pack donkey — each its own
// Dialogue, launched from a `talk` hotspot in the merchant scene. Only one runs at a time
// (world.dialogue); the player talks to one, leaves, and talks to the next.
//
// Choice side-effects reuse the Script DSL and gating reuses GateExpr, so a conversation can do
// everything a scene/event can: set flags, give/take items, shift the Spirit, REVEAL a hidden node,
// unlock an edge, or TRIGGER combat. Text is i18n keys (EN/DE in @bible/i18n) by the convention
// dialogue.<id>.<nodeId>.lineN / dialogue.<id>.choice.<choiceId> / dialogue.<id>.name.

// --- the merchant keeper: the deep branching conversation (gate → unlock, or provoke → combat) ---
const merchantKeeper: Dialogue = {
  id: 'merchantKeeper',
  start: 'greet',
  speakerNameKey: 'dialogue.merchantKeeper.name',
  nodes: {
    greet: {
      id: 'greet',
      lines: ['dialogue.merchantKeeper.greet.line1'],
      choices: [
        { id: 'road', textKey: 'dialogue.merchantKeeper.choice.road', goto: 'road' },
        { id: 'wares', textKey: 'dialogue.merchantKeeper.choice.wares', goto: 'wares' },
        // Gated + once: showing the letter from the poor family's house earns his trust — he reveals
        // the hidden prayer place beside the camp and presses a few coins on you.
        {
          id: 'letter',
          textKey: 'dialogue.merchantKeeper.choice.letter',
          requires: { hasItem: 'letter' },
          once: true,
          script: [{ setFlag: 'merchantFriend', value: true }, { revealNode: 'prayer' }, { giveItem: 'coin', count: 3 }],
          goto: 'letterGiven',
        },
        // Provoke him → his hired men set upon you. The transition ends the conversation and fights.
        { id: 'provoke', textKey: 'dialogue.merchantKeeper.choice.provoke', script: [{ startCombat: 'roadAmbush' }] },
        { id: 'bye', textKey: 'dialogue.merchantKeeper.choice.bye' }, // no goto → ends
      ],
    },
    road: {
      id: 'road',
      lines: ['dialogue.merchantKeeper.road.line1', 'dialogue.merchantKeeper.road.line2'],
      choices: [
        { id: 'back', textKey: 'dialogue.merchantKeeper.choice.back', goto: 'greet' },
        { id: 'bye', textKey: 'dialogue.merchantKeeper.choice.bye' },
      ],
    },
    wares: {
      id: 'wares',
      lines: ['dialogue.merchantKeeper.wares.line1'],
      choices: [
        { id: 'back', textKey: 'dialogue.merchantKeeper.choice.back', goto: 'greet' },
        { id: 'bye', textKey: 'dialogue.merchantKeeper.choice.bye' },
      ],
    },
    letterGiven: {
      id: 'letterGiven',
      lines: ['dialogue.merchantKeeper.letterGiven.line1', 'dialogue.merchantKeeper.letterGiven.line2'],
      choices: [
        { id: 'back', textKey: 'dialogue.merchantKeeper.choice.back', goto: 'greet' },
        { id: 'bye', textKey: 'dialogue.merchantKeeper.choice.bye' },
      ],
    },
  },
}

// --- a fellow traveler resting at the camp (a person; a short branching chat) ---
const roadTraveler: Dialogue = {
  id: 'roadTraveler',
  start: 'greet',
  speakerNameKey: 'dialogue.roadTraveler.name',
  nodes: {
    greet: {
      id: 'greet',
      lines: ['dialogue.roadTraveler.greet.line1'],
      choices: [
        { id: 'story', textKey: 'dialogue.roadTraveler.choice.story', goto: 'story' },
        // Gated on bread (found in the house). Sharing it lifts the Spirit. Repeatable while you
        // still carry bread — a gated-but-self-limiting option (no `once`).
        {
          id: 'bread',
          textKey: 'dialogue.roadTraveler.choice.bread',
          requires: { hasItem: 'bread' },
          script: [{ takeItem: 'bread', count: 1 }, { setFlag: 'sharedBreadTraveler', value: true }, { addSpirit: 10, reason: 'sharedBread' }],
          goto: 'thanks',
        },
        { id: 'bye', textKey: 'dialogue.roadTraveler.choice.bye' },
      ],
    },
    story: {
      id: 'story',
      lines: ['dialogue.roadTraveler.story.line1', 'dialogue.roadTraveler.story.line2'],
      choices: [
        // ask him to tell the whole of it → the scrolling Good Samaritan narration
        { id: 'whole', textKey: 'dialogue.roadTraveler.choice.whole', script: [{ startStory: 'goodSamaritan' }] },
        { id: 'back', textKey: 'dialogue.roadTraveler.choice.back', goto: 'greet' },
        { id: 'bye', textKey: 'dialogue.roadTraveler.choice.bye' },
      ],
    },
    thanks: {
      id: 'thanks',
      lines: ['dialogue.roadTraveler.thanks.line1'],
      choices: [
        { id: 'back', textKey: 'dialogue.roadTraveler.choice.back', goto: 'greet' },
        { id: 'bye', textKey: 'dialogue.roadTraveler.choice.bye' },
      ],
    },
  },
}

// --- the pack donkey (an animal; brief and characterful — the hero "talks at" it) ---
const packDonkey: Dialogue = {
  id: 'packDonkey',
  start: 'bray',
  speakerNameKey: 'dialogue.packDonkey.name',
  nodes: {
    bray: {
      id: 'bray',
      lines: ['dialogue.packDonkey.bray.line1'],
      choices: [
        // A one-time kindness: scratch the donkey's ears. A small Spirit lift, then it's done.
        {
          id: 'pat',
          textKey: 'dialogue.packDonkey.choice.pat',
          once: true,
          script: [{ addSpirit: 3, reason: 'kindnessToBeast' }],
          goto: 'patted',
        },
        { id: 'bye', textKey: 'dialogue.packDonkey.choice.bye' },
      ],
    },
    patted: {
      id: 'patted',
      lines: ['dialogue.packDonkey.patted.line1'],
      choices: [{ id: 'bye', textKey: 'dialogue.packDonkey.choice.bye' }],
    },
  },
}

export const DIALOGUES: Record<string, Dialogue> = {
  merchantKeeper,
  roadTraveler,
  packDonkey,
}
