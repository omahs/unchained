import { FilterTypes } from '../db/schema';
import createRangeFilterParser from './range';
import createSwitchFilterParser from './switch';

export default (type) => {
  switch (type) {
    case FilterTypes.SWITCH:
      return createSwitchFilterParser;
    case FilterTypes.RANGE:
      return createRangeFilterParser;
    default:
      return (values, allKeys) => values;
  }
};
