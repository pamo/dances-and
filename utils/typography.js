import Typography from 'typography';
import lawtonTheme from 'typography-theme-lawton';

const modifiedLawton = { ...lawtonTheme, headerColor: 'inherit' };
modifiedLawton.overrideStyles = ({ rhythm }, options) => ({
  a: {
    color: 'inherit'
  },
  'a:hover': {
    textDecoration: 'none'
  }
});
const typography = new Typography(modifiedLawton);

export default typography;
