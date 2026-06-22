import type { Ability, AgeCategory, Discipline } from './calendar';

export interface FilterState {
  abilities?: Ability[];
  ageCategories?: AgeCategory[];
  disciplines?: Discipline[];
}
