import { selectAll } from "../lib/helpers.js";
import TemplateWrapper from "./TemplateWrapper.js";

/* Router for page navigation via hash URLs

*/
export default class Router {
  static #routeMatchRegex(routePath) {
    const patternString = routePath
      .split('/')
      .map((segment) => segment.replace(/(:\w+)/, "\\w+"))
      .join('/');
    return new RegExp(`^${patternString}/?$`, 'i');
  }

  static #segmentPath(path) {
    return path?.replace(/^#/, '').split('/') ?? null;
  }

  static #extractParams(navPath, routePath) {
    const routeSegments = this.#segmentPath(routePath);
    const navSegments = this.#segmentPath(navPath);
  
    return navSegments.reduce((acc, value, i) => {
      const paramSegment = routeSegments[i];
      if (!paramSegment.match(/^:/)) return acc;
      return Object.assign(acc, { [paramSegment.slice(1)]: value });
    }, {});
  }

  static #logNav(...args) {
    console.log(new Date().toLocaleTimeString(), JSON.stringify(...args));
  }

  constructor({ appRoutes, appContainer, appState }) {
    this.routes = appRoutes;
    this.container = appContainer;
    this.appState = appState;
    this.origin = window.location.origin;
    this.boundClickHandler = this.handleNavClick.bind(this);
    this.boundAuxClickHandler = this.handleAuxClick.bind(this);
    this.boundCustomNavHandler = this.handleCustomNav.bind(this);
    this.routePatterns = this.#getRoutePatterns();
    // history.scrollRestoration = "auto"; // does this make sense here?

    window.addEventListener('popstate', (e) => {
      // console.log({popStateEvent: e})forward, but 

      // return;
      // alert('state popped')
      e.stopPropagation();
      // save history if navigating forwards as well
      const historyState = history.state;
      // if (!e.state) { console.error(e);  }
      console.warn({ popStateEventHistory: historyState });
      const path = new URL(historyState.href).pathname;
      const route = this.#matchRoute(path || '/');
      
      history.replaceState(historyState, '', path); // seems unnecessary
      const params = /:/.test(route) ? Router.#extractParams(path, route) : { };
      console.log('popstate routing to', { historyState, route, path, params })
      this.#draw(this.routes[route], params);
      
    });

    this.#navWithoutHistory();
  }
  
  #getRoutePatterns() {
    return Object.entries(this.routes)
      .map(([routePath]) => ({ pattern: Router.#routeMatchRegex(routePath), path: routePath }));
  }

  // given a nav path, finds the corresponding route
  #matchRoute(navPath) {
    const match = this.routePatterns.find(({ pattern, route }) => {
      return pattern.test(navPath);
    });
    console.log({navPath, match })
    if (!match) return null;
    const route = match.path;
    return route;
  }

  #sameOrigin(path) {
    return !URL.canParse(path) || new URL(path).origin === this.origin;
  }

  // could be eliminated?
  #refresh() {
    this.navTo(window.location.hash);
  }

  #bindNavigationEvents() {
    const navLinks = selectAll('.navigation');
    console.table({navLinks})
    
    document.removeEventListener('appnavigation', this.boundCustomNavHandler);
    document.addEventListener('appnavigation', this.boundCustomNavHandler);
    this.container.removeEventListener('click', this.boundClickHandler);
    this.container.addEventListener('click', this.boundClickHandler);
    this.container.removeEventListener('auxclick', this.boundAuxClickHandler);
    this.container.addEventListener('auxclick', this.boundAuxClickHandler);
    // selectAll('.navigation').forEach((link) => {
    //   link.removeEventListener('click', this.boundClickHandler);
    //   link.addEventListener('click', this.boundClickHandler);
    //   link.addEventListener('auxclick', (e) => e.preventDefault());
    // });
  }

  handleAuxClick(e) {
    const isNavLink = e.target.classList.contains('navigation') 
      && e.target.tagName === 'A';
    if (!isNavLink) return; 
    e.preventDefault();
  }

  handleCustomNav(e) {
    const path = e.detail;
    const route = this.#matchRoute(path);
    this.navTo(path, route);
  }

  handleNavClick(e) {
    const isNavLink = e.target.classList.contains('navigation') 
      && e.target.tagName === 'A';
    if (!isNavLink) return; 
    // console.log(e);
    // console.log("clicked navlink")
    e.preventDefault();
    const path = e.target.getAttribute('href');
    const route = this.#matchRoute(path);
    this.navTo(path, route);
  }

  // draw the templates corresponding to the path and update the history
  navTo(path, route) {
    console.warn('navigating to', path)
    const params = /:/.test(route) ? Router.#extractParams(path, route) : { };
    Router.#logNav({ path, route, params })
    this.#setCurrentHistory(history.state);
    this.#newHistoryEntry(path, params);
    // alert(`${path} ; ${window.location.hash}`)
    this.#draw(this.routes[route ?? '/'], params);
  }

  // 
  async #navWithoutHistory() {
    const path = window.location.hash;
    // alert(`without history: ${path}, ${window.location}`)
    const route = this.#matchRoute(path || '/');
    const params = /:/.test(route) ? Router.#extractParams(path, route) : { };
    console.log({params, path, route})
    this.#setCurrentHistory();
    // this.#updateHistory(params, path, null);
    // if (!route) {
    //   console.error(`Path '${path}' is invalid; redirecting home`);
    //   this.#draw(this.routes['/'], params);
    // } else {
      const nextPage = this.routes[route];
      console.log({nextPage})
      this.#draw(this.routes[route], params);
    // }
  }

  // Saves the current page values to history
  #setCurrentHistory(historyState = undefined) {
    const currentPageState = historyState ?? {
      previousPage: null,
      currentPage: null,
      href: window.location.toString(),
      nextPage: null,
    };
    // add page values to state.currentPage, overwriting existing values
    const pageValues = this.#getPageValues();
    currentPageState.currentPage = Object.assign({}, historyState?.currentPage, pageValues);
    history.replaceState(currentPageState, '', window.location.toString());
    console.log(`Set this page's history`, history.state, history.state.href);
  }

  /**
   * Saves the current page state to its history entry, then passes the same 
   * state object to be stored on the previousPageState property.
   * Invoked when navigating without using the forward/back buttons.
   * @param {string} path The URL's path
   * @param {{ [key: string]: string }} params key: value pairs of query string parameters
   */
  #newHistoryEntry(path, params) {    // set up the state object for the next page with a reference to the current page
    const newHref = new URL(path, this.origin).toString();
    const currentPageState = history.state;
    const nextPageState = {
      previousPage: currentPageState,
      currentPage: params,
      href: newHref,
      nextPage: null,
    };
    // create a reference to the next page
    currentPageState.nextPage = nextPageState;
    // save state entries
    history.replaceState(currentPageState, '', window.location.toString());
    history.pushState(nextPageState, '', newHref);
    console.log(`Updated this page's history`, currentPageState, currentPageState.href);
    console.log(`Navigating to this page with history: `, nextPageState, nextPageState.href);
  }

  /**
   * Saves the current page state to its history entry, then passes the same 
   * state object to be stored on the previousPageState property.
   * Invoked when navigating without using the forward/back buttons.
   * @param {{ [key: string]: string }} params key: value pairs of query string parameters
   * @param {string} path The URL's path
   */
  // #updateHistory(params, path, historyState) {
  //   const pageValues = this.#getPageValues();
  //   const currentPageState = historyState ?? {
  //     previousPage: null,
  //     currentPage: null,
  //     href: window.location.toString(),
  //     nextPage: null,
  //   };
  //   // add page values to state.currentPage, overwriting existing values
  //   currentPageState.currentPage = Object.assign({}, historyState?.currentPage, pageValues);

  //   // set up the state object for the next page with a reference to the current page
  //   const newHref = new URL(path, this.origin).toString();
  //   const nextPageState = {
  //     previousPage: currentPageState,
  //     currentPage: params,
  //     href: newHref,
  //     nextPage: null,
  //   };
  //   // create a reference to the next page
  //   currentPageState.nextPage = nextPageState;
  //   // save state entries
  //   history.replaceState(currentPageState, '', window.location.toString());
  //   history.pushState(nextPageState, '', newHref);
  //   console.log(`Updated this page's history`, history.state, history.state.href);
  //   console.log(`Navigating to this page with history: `, nextPageState, nextPageState.href);
  // }

  // collect all page values
  
  #getPageValues() {
    return selectAll('[value]', this.container)
    .reduce((acc, element) => Object.assign(acc, { [element.id]: element.value }), {});
  }

  /**
   * Re-render the entire app container, optionally passing in state to fill element values
   * @param {TemplateWrapper[]} wrapperArray 
   * @param {{ [key: string]: string }} params
   */
  async #draw(wrapperArray, params = undefined) {

    // alert('drawing....')
    this.container.innerHTML = null;
    const promises = wrapperArray.map((wrapper) => {
      return wrapper.draw(params);
    });
    Promise.all(promises).then(() => {
      this.#bindNavigationEvents();
    });
  }
}