import type { MoralEvent } from '@bible/engine'

// The wounded traveler (Luke 10) — the moral hinge of the road. Mercy (bind/bread/pray) sets
// `helpedTraveler`, which opens the hidden spiritual route (prayer + quiet cave). Robbing him
// griefs the Spirit. "Bind his wounds" needs the oil flask found in the house.

export const EVENTS: Record<string, MoralEvent> = {
  traveler: {
    id: 'traveler',
    bgAsset: 'bg-event-wounded-traveler',
    titleKey: 'event.traveler.title',
    bodyKey: 'event.traveler.body',
    choices: [
      {
        id: 'bind',
        labelKey: 'event.traveler.bind',
        requires: { hasItem: 'oilFlask' },
        script: [
          { takeItem: 'oilFlask', count: 1 },
          { setFlag: 'helpedTraveler', value: true },
          { addSpirit: 25, reason: 'boundWounds' },
          { say: 'event.traveler.bind.result' },
        ],
      },
      {
        id: 'bread',
        labelKey: 'event.traveler.bread',
        requires: { hasItem: 'bread' },
        script: [
          { takeItem: 'bread', count: 1 },
          { setFlag: 'helpedTraveler', value: true },
          { addSpirit: 18, reason: 'gaveBread' },
          { say: 'event.traveler.bread.result' },
        ],
      },
      {
        id: 'pray',
        labelKey: 'event.traveler.pray',
        script: [
          { setFlag: 'helpedTraveler', value: true },
          { addSpirit: 15, reason: 'prayedForHim' },
          { say: 'event.traveler.pray.result' },
        ],
      },
      {
        id: 'rob',
        labelKey: 'event.traveler.rob',
        // robbing the wounded (the anti-Samaritan) is serious harm — a big hit, though less than a kill.
        // Author future "harm" choices in this harsher band.
        script: [{ addSpirit: -80, reason: 'robbedTraveler' }, { giveItem: 'coin', count: 2 }, { say: 'event.traveler.rob.result' }],
      },
      { id: 'leave', labelKey: 'event.traveler.leave', script: [{ say: 'event.traveler.leave.result' }] },
    ],
  },
}
