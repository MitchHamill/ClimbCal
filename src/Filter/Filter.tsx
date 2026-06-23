import type { FilterState } from 'types/filter';
import './Filter.scss';
import ReactSelect, { type Props as SelectPropsType } from 'react-select';
import type { AgeCategory, Ability, Discipline } from 'types/calendar';
import { useEffect, useState } from 'react';

interface FilterProps {
  setEventFilter: (state: FilterState) => void;
}

interface Option<T> {
  value: T;
  label: string;
}

type SelectProps<Option> = SelectPropsType<Option, true> & {
  label: string;
};

const Select = <Option,>({ label, ...rest }: SelectProps<Option>) => {
  return (
    <div>
      <p>{label}</p>
      <ReactSelect<Option, true> {...rest} />
    </div>
  );
};
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
  const typesToOpt: <T>(
    opts: readonly Option<T>[],
    values: T[] | undefined,
  ) => readonly Option<T>[] = (opts, values) =>
    opts.filter(({ value }) => values && values.includes(value));

  const [selectedAbilityOpts, setSelectedAbilityOpts] = useState<
    readonly Option<Ability>[] | undefined
  >(typesToOpt(abilityOpts, ['open']));
  const [selectedAgeOpts, setSelectedAgeOpts] = useState<
    readonly Option<'youth' | 'open'>[] | undefined
  >(typesToOpt(ageOpts, ['open']));
  const [selectedDisciplineOpts, setSelectedDisciplineOpts] = useState<
    readonly Option<Discipline>[] | undefined
  >();

  useEffect(() => {
    setEventFilter({
      abilities: selectedAbilityOpts?.length
        ? selectedAbilityOpts.map(({ value }) => value)
        : undefined,
      ageCategories: selectedAgeOpts?.length
        ? selectedAgeOpts
            .map(({ value }) =>
              value === 'open' ? openCategories : youthCategories,
            )
            .flat()
        : undefined,
      disciplines: selectedDisciplineOpts?.length
        ? selectedDisciplineOpts?.map(({ value }) => value)
        : undefined,
    });
  }, [
    selectedAbilityOpts,
    selectedAgeOpts,
    selectedDisciplineOpts,
    setEventFilter,
  ]);

  return (
    <div id="filters">
      <Select
        label="Ability"
        options={abilityOpts}
        isMulti
        value={selectedAbilityOpts}
        onChange={setSelectedAbilityOpts}
        className="select"
      />
      <Select
        label="Age Group"
        options={ageOpts}
        isMulti
        value={selectedAgeOpts}
        onChange={setSelectedAgeOpts}
        className="select"
      />
      <Select
        label="Discipline"
        options={disciplineOpts}
        isMulti
        value={selectedDisciplineOpts}
        onChange={setSelectedDisciplineOpts}
        className="select"
      />
    </div>
  );
};

export default Filter;
