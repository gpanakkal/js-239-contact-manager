import { selectAll } from "../lib/helpers.js";

/* Router for mimicking page navigation via hash URLs

*/
export default class Router {
  // router - obsolete
  static routeMatchRegex(routePath) {
    const hashReplace = /^#/.test(routePath) ? '#' : '';
    const patternString = routePath
      .replace(/^#/, '')
      .split('/')
      .map((segment) => segment.replace(/(:\w+)/, "\\w+"))
      .join('/');
    return new RegExp(`^${hashReplace}${patternString}/?$`, 'i');
  }

  // router
  static segmentPath(path) {
    return path?.replace(/^#/, '').split('/') ?? null;
  }

  // router
  static extractParams(navPath, routePath) {
    const routeSegments = Router.pathSegments(routePath);
    const navSegments = Router.pathSegments(navPath);
  
    return navSegments.reduce((acc, value, i) => {
      const paramSegment = routeSegments[i];
      if (!paramSegment.match(/^:/)) return acc;
      return Object.assign(acc, { [paramSegment.slice(1)]: value });
    }, {});
  }

  // router? only if the router has final determination of what to draw
  static logNav(...args) {
    console.log(new Date().toLocaleTimeString(), JSON.stringify(...args));
  }

  // router
  static validPath(path) {
    return (typeof path === 'string') 
      && (path.length === 0 || path.match(/(^#\w+)|(^\/$)/))
  }

  constructor(routes, container) {
    this.routes = routes;
    this.container = container;
    this.origin = window.location.origin;
    this.boundClickHandler = this.handleNavClick.bind(this);
    this.routePatterns = this.getRoutePatterns();
    history.scrollRestoration = "auto";
    this.#navWithoutHistory();
  }
  
  getRoutePatterns() {
    return Object.fromEntries(
      Object.entries(this.routes).map(([routePath]) => [Router.routeMatchRegex(routePath), routePath])
    );
  }

  // router
  // given a nav path, finds the corresponding route
  matchRoute(navPath) {
    const match = Object.keys(this.routePatterns).find((pattern) => navPath.match(pattern));
    if (!match) return null;
    return this.routePatterns[match];
  }

  // router
  sameOrigin(path) {
    return !URL.canParse(path) || new URL(path).origin === this.origin;
  }

  // router
  // could be eliminated?
  refresh() {
    this.navTo(window.location.hash);
  }

  handleNavClick(e) {
    const path = e.currentTarget.getAttribute('href');
    const route = this.matchRoute(path);
    if (!route && !this.sameOrigin(path)) {
      return;
    };
    e.preventDefault();
    this.navTo(path, route);
  }

  navTo(path, route) {
    const params = /:/.test(route) ? App.extractParams(path, route) : { };
    App.logNav({ path, route, params })
    this.manageHistory(params, path);
    this.routes[route ?? '#home'](params);
  }

  #navWithoutHistory() {
    const path = window.location.hash;
    const route = this.matchRoute(path);
    if (!route) {
      console.error(`Path '${path}' is invalid; redirecting home`);
      this.draw(this.routes['#home']);
    } else {
      this.draw(this.routes[route]);
    }
  }

  // router - or whichever object makes the final determination to follow a route or not
  // revise to only add history entries and update the address bar
  manageHistory(pageState, path) {
    history.replaceState(this.getPageState(), '', window.location.pathname);
    history.pushState(pageState, '', new URL(path, this.origin));
    this.setPageState(pageState);
  }

  // Router
  // if revising to use template wrappers, make this call a local draw() method on each passed wrapper?
  // that appends the template to the end of the app container
  // instead of inserting templates inside this method
  // re-render the entire app container
  draw(wrapperArray) {
    this.container.innerHTML = null;
    wrapperArray.forEach((wrapper) => {
      console.log(wrapper);
      wrapper.draw();
    });
    this.bindNavigationEvents();
  };

  // Router
  bindNavigationEvents() {
    selectAll('.navigation').forEach((link) => {
      link.removeEventListener('click', this.boundClickHandler);
      link.addEventListener('click', this.boundClickHandler);
      link.addEventListener('auxclick', (e) => e.preventDefault());
    });
  }
}