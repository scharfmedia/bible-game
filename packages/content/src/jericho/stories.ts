import type { Story } from '@bible/engine'

// Long-form narration shown in the scrolling story box. Triggered three ways on the Jericho road:
//  • reading the wayside shrine on the Samaritan Road (a scene `observe` → startStory),
//  • asking the weary traveler at the merchant camp to tell his whole tale (a dialogue choice),
//  • and the closing narration once the boss (the Accuser) is defeated (the map's outroStoryId).
// All prose is ORIGINAL retelling (no copyrighted translation is quoted); text in @bible/i18n.

const goodSamaritan: Story = {
  id: 'goodSamaritan',
  titleKey: 'story.goodSamaritan.title',
  bgAsset: 'bg-event-wounded-traveler',
  paragraphs: [
    'story.goodSamaritan.p1',
    'story.goodSamaritan.p2',
    'story.goodSamaritan.p3',
    'story.goodSamaritan.p4',
    'story.goodSamaritan.p5',
  ],
  attributionKey: 'story.goodSamaritan.attribution',
  // hearing the parable settles the Spirit and is remembered
  onEnd: [{ setFlag: 'heardSamaritanTale', value: true }, { addSpirit: 6, reason: 'heardParable' }],
}

const jerichoOutro: Story = {
  id: 'jerichoOutro',
  titleKey: 'story.jerichoOutro.title',
  bgAsset: 'bg-rest-jericho-inn',
  paragraphs: ['story.jerichoOutro.p1', 'story.jerichoOutro.p2', 'story.jerichoOutro.p3'],
  attributionKey: 'story.jerichoOutro.attribution',
}

export const STORIES: Record<string, Story> = { goodSamaritan, jerichoOutro }
