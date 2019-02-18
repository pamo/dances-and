const config = {
  siteTitle: 'dances & likes coffee', // Site title.
  siteTitleShort: 'a personal concert tracker', // Short site title for homescreen (PWA). Preferably should be under 12 characters to prevent truncation.
  siteTitleAlt: "pamo's Concert Tracker", // Alternative site title for SEO.
  siteLogo: '/logos/logo-160.png', // Logo used for SEO and manifest.
  siteUrl: 'https://dances-and.likescoffee.com', // Domain of your website without pathPrefix.
  pathPrefix: '/', // Prefixes all links. For cases when deployed to example.github.io/gatsby-advanced-starter/.
  siteDescription: 'pamo dances and likes coffee', // Website description used for RSS feeds/meta description tag.
  siteRss: '/rss.xml', // Path to the RSS file.
  googleAnalyticsID: 'UA-134666118-1', // GA tracking ID.
  postDefaultCategory: 'show', // Default category for posts.
  dateFromFormat: 'YYYY-MM-DD', // Date format used in the frontmatter.
  dateFormat: 'MM/DD/YYYY', // Date format for display.
  userName: 'pamo', // Username to display in the author segment.
  userEmail: 'pamela.ocampo@gmail.com', // Email used for RSS feed's author segment
  userTwitter: 'pmocampo', // Optionally renders "Follow Me" in the UserInfo segment.
  userLocation: 'San Francisco, CA', // User location to display in the author segment.
  userAvatar: '/images/avatar.jpg', // User avatar to display in the author segment.
  userDescription: 'Sometimes the best concert buddy is yourself.', // User description to display in the author segment.
  // Links to social profiles/projects you want to display in the author segment/navigation bar.
  lastfm: {
    url: 'https://last.fm/user/Psyc-adelick/library/music/'
  },
  userLinks: [
    {
      label: 'GitHub',
      url: 'https://github.com/pamo',
      iconClassName: 'fa fa-github'
    },
    {
      label: 'Twitter',
      url: 'https://twitter.com/pmocampo',
      iconClassName: 'fa fa-twitter'
    },
    {
      label: 'Last.fm',
      url: 'https://last.fm/user/Psyc-adelick',
      iconClassName: 'fa fa-lastfm'
    }
  ],
  copyright: 'Copyright © 2019. Pamela Ocampo', // Copyright string for the footer of the website and RSS feed.
  themeColor: '#c62828', // Used for setting manifest and progress theme colors.
  backgroundColor: '#e0e0e0' // Used for setting manifest background color.
};

// Validate

// Make sure pathPrefix is empty if not needed
if (config.pathPrefix === '/') {
  config.pathPrefix = '';
} else {
  // Make sure pathPrefix only contains the first forward slash
  config.pathPrefix = `/${config.pathPrefix.replace(/^\/|\/$/g, '')}`;
}

// Make sure siteUrl doesn't have an ending forward slash
if (config.siteUrl.substr(-1) === '/') config.siteUrl = config.siteUrl.slice(0, -1);

// Make sure siteRss has a starting forward slash
if (config.siteRss && config.siteRss[0] !== '/') config.siteRss = `/${config.siteRss}`;

module.exports = config;
