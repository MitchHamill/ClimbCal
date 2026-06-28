import type { Ability, AgeGroup, Discipline } from './calendar';

export interface FilterState {
  abilities?: Ability[];
  ageGroups?: AgeGroup[];
  disciplines?: Discipline[];
}
