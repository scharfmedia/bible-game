import type { Story } from '@bible/engine'

// Closing narration, shown when the lone wolf (the tutorial "boss") is defeated. A calm sign-off
// that points the player onward to the Jericho Road. Original prose (no copyrighted translation).
// NO Spirit/flesh wording — keep it to the journey and the road ahead.

const tutorialOutro: Story = {
  id: 'tutorialOutro',
  titleKey: 'story.tutorialOutro.title',
  bgAsset: 'bg-rest-old-cistern',
  paragraphs: ['story.tutorialOutro.p1', 'story.tutorialOutro.p2'],
  attributionKey: 'story.tutorialOutro.attribution',
  onEnd: [{ setFlag: 'finishedTutorial', value: true }],
}

export const TUTORIAL_STORIES: Record<string, Story> = { tutorialOutro }
