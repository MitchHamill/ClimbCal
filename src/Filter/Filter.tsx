import type { FilterState } from 'types/filter';
import './Filter.scss';

interface FilterProps {
  setEventFilter: (state: FilterState) => void;
}

const Filter: React.FC<FilterProps> = ({ setEventFilter }) => {
  return <div id="filters">Filters</div>;
};

export default Filter;
