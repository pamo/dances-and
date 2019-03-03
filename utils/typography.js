import Typography from 'typography';
import lawtonTheme from 'typography-theme-lawton';

const modifiedLawton = { ...lawtonTheme, headerColor: 'inherit' };
modifiedLawton.overrideStyles = () => ({
  a: {
    color: 'inherit'
  },
  'td:first-child, th:first-child,td:last-child, th:last-child': {
    paddingLeft: 'inherit',
    paddingRight: 'inherit'
  },
  'a:hover': {
    textDecoration: 'none'
  }
});
const typography = new Typography(modifiedLawton);

export default typography;
