import type { FilterState } from 'types/filter';
import './Filter.scss';
import type { AgeCategory, Ability, Discipline } from 'types/calendar';

interface FilterProps {
  setEventFilter: (state: FilterState) => void;
}

interface Option<T> {
  value: T;
  label: string;
}

const abilityOpts: readonly Option<Ability>[] = [
  {
    value: 'open',
    label: 'Open',
  },
  {
    value: 'para',
    label: 'Para',
  },
];
const ageOpts: readonly Option<'youth' | 'open'>[] = [
  {
    value: 'youth',
    label: 'Youth',
  },
  {
    value: 'open',
    label: 'Open',
  },
];
const disciplineOpts: readonly Option<Discipline>[] = [
  {
    value: 'boulder',
    label: 'Boulder',
  },
  {
    value: 'lead',
    label: 'Lead',
  },
  {
    value: 'speed',
    label: 'Speed',
  },
];

const youthCategories: AgeCategory[] = ['u17', 'u19', 'u21'];
const openCategories: AgeCategory[] = ['open'];

const Filter: React.FC<FilterProps> = ({ setEventFilter }) => {
  return <div id="filters">Filters</div>;
};

export default Filter;
