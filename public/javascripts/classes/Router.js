import { selectAll } from "../lib/helpers.js";
import HistoryManager from "./HistoryManager.js";
import TemplateWrapper from "./TemplateWrapper.js";

/* Router for page navigation via hash URLs

*/
export default class Router {
  static #getPath = (url) =>  url.hash || url.pathname;

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

  constructor({ appRoutes, appContainer, appState }) {
    this.routes = appRoutes;
    this.container = appContainer;
    this.appState = appState;
    this.boundClickHandler = this.#handleNavClick.bind(this);
    this.boundAuxClickHandler = this.#handleAuxClick.bind(this);
    this.boundCustomNavHandler = this.#handleCustomNav.bind(this);
    this.routePatterns = this.#getRoutePatterns();
    this.historyManager = new HistoryManager();
    this.bindEvents();
    this.#navWithoutHistory();
  }

  bindEvents() {
    window.addEventListener('popstate', (e) => {
      e.stopPropagation();
      const historyUrl = this.historyManager.getUrl();
      // const urlRaw = historyState === null ? window.location.href : historyState.href;
      // const urlRaw = history.state ? history.state.href : window.location.href;
      const urlRaw = historyUrl ?? window.location.href;
      const url = new URL(urlRaw);
      const path = Router.#getPath(url);
      const route = this.#matchRoute(path);
      const params = /:/.test(route) ? Router.#extractParams(path, route) : { };
      this.#draw(this.routes[route], params);
    });
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

  #bindNavigationEvents() {
    // const navLinks = selectAll('.navigation');
    
    document.removeEventListener('appnavigation', this.boundCustomNavHandler);
    document.addEventListener('appnavigation', this.boundCustomNavHandler);
    this.container.removeEventListener('click', this.boundClickHandler);
    this.container.addEventListener('click', this.boundClickHandler);
    this.container.removeEventListener('auxclick', this.boundAuxClickHandler);
    this.container.addEventListener('auxclick', this.boundAuxClickHandler);
  }

  #handleAuxClick(e) {
    const isNavLink = e.target.classList.contains('navigation') 
      && e.target.tagName === 'A';
    if (!isNavLink) return; 
    e.preventDefault();
  }

  #handleCustomNav(e) {
    const path = e.detail;
    const route = this.#matchRoute(path);
    this.#navTo(path, route);
  }

  #handleNavClick(e) {
    const isNavLink = e.target.classList.contains('navigation') 
      && e.target.tagName === 'A';
    if (!isNavLink) return; 
    // console.log(e);
    // console.log("clicked navlink")
    e.preventDefault();
    const path = e.target.getAttribute('href');
    const route = this.#matchRoute(path);
    this.#navTo(path, route);
  }

  // draw the templates corresponding to the path and update the history
  #navTo(path, route) {
    console.warn('navigating to', path)
    const params = /:/.test(route) ? Router.#extractParams(path, route) : { };
    // this.#setCurrentHistory(history.state);
    const pageValues = this.#getPageValues();
    this.historyManager.setEntry(pageValues, { update: true });
    // this.#newHistoryEntry(path, params);
    this.historyManager.createEntry(path, params);
    this.#draw(this.routes[route ?? '/'], params);
  }

  // 
  async #navWithoutHistory() {
    const path = window.location.hash;
    const route = this.#matchRoute(path || '/');
    const params = /:/.test(route) ? Router.#extractParams(path, route) : { };
    console.log({params, path, route})
    const pageValues = this.#getPageValues();
    // this.#setCurrentHistory();
    this.historyManager.setEntry(pageValues, { update: false });
    const nextPage = this.routes[route];
    console.log({nextPage})
    this.#draw(this.routes[route], params);
  }

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
    this.container.innerHTML = null;
    this.#bindNavigationEvents();
    wrapperArray.forEach((wrapper) => {
      wrapper.draw(params);
    });
  }
}