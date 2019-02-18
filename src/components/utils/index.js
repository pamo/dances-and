import { sample } from 'underscore';

const colors = [
  'gold',
  'yellow',
  'purple',
  'dark-pink',
  'pink',
  'hot-pink',
  'dark-blue',
  'blue',
  'green',
  'red',
  'dark-red'
];
export const randomColor = () => sample(colors);
