export type Discipline = 'boulder' | 'lead' | 'speed';

export type AgeGroup = 'open' | 'u17' | 'u19' | 'u21';

export type Ability = 'open' | 'para';

export type LocalDateTime = string & { readonly __brand: 'LocalDateTime' };

export type IanaTimeZone = string & { readonly __brand: 'IanaTimeZone' };

export interface Venue {
  city: string;
  country: string;
  timezone: IanaTimeZone;
}

export interface Link {
  displayText: string;
  accessibleText: string;
  url: string;
  openInNewTab: boolean;
}

// A single discipline/round within a competition. Age and ability now live
// here instead of on the event, so a Sukoró final and qualifier that run for
// different age groups can sit in the same program array.
export interface Round {
  discipline: Discipline;
  name: string;
  start: LocalDateTime;
  age: AgeGroup;
  ability: Ability;
}

// One official IFSC competition entity — what the website calls an "event"
// (its own title, its own info-sheet/registration links). Most calendar
// events have exactly one of these; venues hosting back-to-back competitions
// (e.g. a Para Series straight into the Series, or a Youth Championship into
// an open Series) have more than one.
export interface Leg {
  id: string;
  title: string;
  links: Link[];
  start: LocalDateTime;
  end: LocalDateTime;
  program: Round[];
}

// A calendar entry: one venue, one contiguous block of dates, one or more
// legs. Use this for rendering a single card; iterate `legs` to render
// per-competition titles/links, and `legs[].program` for the session list.
export interface ClimbEvent {
  id: string;
  venue: Venue;
  start: LocalDateTime;
  end: LocalDateTime;
  legs: Leg[];
}
