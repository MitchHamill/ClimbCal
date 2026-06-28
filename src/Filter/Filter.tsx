import type { FilterState } from 'types/filter';
import './Filter.scss';
import type { AgeGroup, Ability, Discipline } from 'types/calendar';
import { useEffect, useState } from 'react';

interface FilterProps {
  setEventFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  filterState: FilterState;
}

interface Option<T> {
  value: T;
  label: string;
}

const abilityOpts: Option<Ability>[] = [
  {
    value: 'open',
    label: 'Open',
  },
  {
    value: 'para',
    label: 'Para',
  },
];
const ageOpts: Option<'youth' | 'open'>[] = [
  {
    value: 'open',
    label: 'Open',
  },
  {
    value: 'youth',
    label: 'Youth',
  },
];
const disciplineOpts: Option<Discipline>[] = [
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

type AgeGroupSimpMap = { youth: AgeGroup[]; open: AgeGroup[] };
const ageGrouptSimpMap: AgeGroupSimpMap = {
  youth: ['u17', 'u19', 'u21'],
  open: ['open'],
};

interface FilterableType<T> {
  label: string;
  setter: React.Dispatch<React.SetStateAction<T[] | undefined>>;
  selected: T[] | undefined;
  opts: Option<T>[];
}

const Filter: React.FC<FilterProps> = ({
  setEventFilter,
  filterState: existingState,
}) => {
  const [selectedDisciplines, setSelectedDisciplines] = useState<
    Discipline[] | undefined
  >(existingState.disciplines);
  const [selectedAbilties, setSelectedAbilties] = useState<
    Ability[] | undefined
  >(existingState.abilities);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<
    ('youth' | 'open')[] | undefined
  >(() => {
    const hasOpen = existingState.ageGroups?.includes('open');
    const hasYouth = ageGrouptSimpMap.youth.some((g) =>
      existingState.ageGroups?.includes(g),
    );
    const groups: ('open' | 'youth')[] = [];
    if (hasOpen) groups.push('open');
    if (hasYouth) groups.push('youth');

    return groups.length ? groups : undefined;
  });

  useEffect(() => {
    setEventFilter({
      disciplines: selectedDisciplines,
      abilities: selectedAbilties,
      ageGroups: selectedAgeGroups?.map((t) => ageGrouptSimpMap[t]).flat(),
    });
  }, [selectedDisciplines, selectedAbilties, selectedAgeGroups]);

  function toggle<T>(
    setter: React.Dispatch<React.SetStateAction<T[] | undefined>>,
    type: T,
  ): () => void {
    return () =>
      setter((prev) => {
        if (!prev) return [type];
        if (!prev.includes(type)) return [...prev, type];
        return prev.length > 1 ? prev.filter((i) => i !== type) : undefined;
      });
  }

  const filterConfigs: FilterableType<any>[] = [
    {
      label: 'Disciplines',
      setter: setSelectedDisciplines,
      selected: selectedDisciplines,
      opts: disciplineOpts,
    },
    {
      label: 'Abilities',
      setter: setSelectedAbilties,
      selected: selectedAbilties,
      opts: abilityOpts,
    },
    {
      label: 'Age Groups',
      setter: setSelectedAgeGroups,
      selected: selectedAgeGroups,
      opts: ageOpts,
    },
  ];

  return (
    <div id="filters">
      {filterConfigs.map(({ label, setter, selected, opts }, i) => (
        <div key={'filter-sect-' + i} className="filter-section">
          <b>{label}</b>
          <div className="filter-buttons">
            {opts.map(({ label, value }) => (
              <button
                key={value}
                onClick={toggle(setter, value)}
                className={
                  'filter-toggle' +
                  (selected?.includes(value) ? ' selected' : '')
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Filter;
