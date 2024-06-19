import { selectAll } from "../lib/helpers.js";

/* Router for mimicking page navigation via hash URLs

*/
export default class Router {
  // router - obsolete
  static routeMatchRegex(routePath) {
    const patternString = routePath
      .split('/')
      .map((segment) => segment.replace(/(:\w+)/, "\\w+"))
      .join('/');
    return new RegExp(`^${patternString}/?$`, 'i');
  }

  // router
  static segmentPath(path) {
    return path?.replace(/^#/, '').split('/') ?? null;
  }

  // router
  static extractParams(navPath, routePath) {
    const routeSegments = Router.segmentPath(routePath);
    const navSegments = Router.segmentPath(navPath);
  
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

  constructor(app) {
    this.routes = app.routes;
    this.container = app.container;
    this.appState = app.state;
    this.origin = window.location.origin;
    this.boundClickHandler = this.handleNavClick.bind(this);
    this.routePatterns = this.getRoutePatterns();
    history.scrollRestoration = "auto";
    window.addEventListener('popstate', (e) => {
      e.preventDefault();
      // alert('state popped')
      const route = this.matchRoute(window.location.hash || '/');
      console.log({ poppedState: e.state, route, hash: window.location.hash })
      this.#draw(this.routes[route]);
      
    });
    this.#navWithoutHistory();
  }
  
  getRoutePatterns() {
    return Object.entries(this.routes)
      .map(([routePath]) => [Router.routeMatchRegex(routePath), routePath]);
  }

  // router
  // given a nav path, finds the corresponding route
  matchRoute(navPath) {
    const match = this.routePatterns.find(([pattern, route]) => {
      return pattern.test(navPath);
    });
    console.log({navPath, match })
    if (!match) return null;
    const route = match[1];
    return route;
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

  // Router
  bindNavigationEvents() {
    const navLinks = selectAll('.navigation');
    console.table({navLinks})
    selectAll('.navigation').forEach((link) => {
      link.removeEventListener('click', this.boundClickHandler);
      link.addEventListener('click', this.boundClickHandler);
      link.addEventListener('auxclick', (e) => e.preventDefault());
    });
  }

  handleNavClick(e) {
    console.log(e);
    console.log("clicked navlink")
    const path = e.currentTarget.getAttribute('href');
    const route = this.matchRoute(path);
    if (!route && !this.sameOrigin(path)) {
      console.warn('external path: ', path)
      return;
    };
    e.preventDefault();
    this.navTo(path, route);
  }

  navTo(path, route) {
    const params = /:/.test(route) ? Router.extractParams(path, route) : { };
    Router.logNav({ path, route, params })
    this.#manageHistory(params, path);
    // alert(`${path} ; ${window.location.hash}`)
    this.#draw(this.routes[route ?? '/']);
  }

  async #navWithoutHistory() {
    const path = window.location.hash;
    // alert(`without history: ${path}, ${window.location}`)
    const route = this.matchRoute(path || '/');
    const params = /:/.test(route) ? Router.extractParams(path, route) : { };
    const state = await this.appState.get();
    console.log({state, params, path})
    
    history.replaceState(Object.assign(state.pageState, params), '', new URL(path, this.origin));
    if (!route) {
      console.error(`Path '${path}' is invalid; redirecting home`);
      this.#draw(this.routes['/']);
    } else {
      const nextPage = this.routes[route];
      console.log({nextPage})
      this.#draw(this.routes[route]);
    }
  }

  // router - or whichever object makes the final determination to follow a route or not
  // revise to only add history entries and update the address bar
  async #manageHistory(params, path) {
    const pageState = this.appState.getPage();
    history.replaceState(pageState, '', window.location.pathname);
    history.pushState(params, '', new URL(path, this.origin));
    this.appState.setPage(params);
  }

  // Router
  // if revising to use template wrappers, make this call a local draw() method on each passed wrapper?
  // that appends the template to the end of the app container
  // instead of inserting templates inside this method
  // re-render the entire app container
  async #draw(wrapperArray) {
    // alert('drawing....')
    this.container.innerHTML = null;
    const state = await this.appState.get();
    const promises = wrapperArray.map((wrapper) => {
      // console.log(wrapper);
      return wrapper.draw(state);
    });
    Promise.all(promises).then(() => {
      this.bindNavigationEvents();
    });
  }
}