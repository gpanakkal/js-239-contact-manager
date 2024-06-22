import HistoryManager from './HistoryManager.js';

/* Router for page navigation via hash URLs */
export default class Router {
  static #getPath = (url) => url.hash || url.pathname;

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
    this.origin = window.location.origin;

    this.boundClickHandler = this.#handleNavClick.bind(this);
    this.boundAuxClickHandler = Router.#handleAuxClick.bind(this);
    this.boundCustomNavHandler = this.#handleCustomNav.bind(this);
    this.routePatterns = this.#getRoutePatterns();
    this.historyManager = new HistoryManager();
    this.bindEvents();
    this.#navWithoutHistory();
  }

  bindEvents() {
    window.addEventListener('popstate', (e) => {
      e.stopPropagation();
      const historyUrl = this.historyManager.getStoredUrl();
      const urlRaw = historyUrl ?? window.location.href;
      const { route, params } = this.#getRouteFromUrl(urlRaw);
      const wrapperArray = this.routes[route];
      const pageValues = Router.#getPageValues(wrapperArray);
      this.historyManager.setEntry(pageValues, { update: true });
      this.#draw(wrapperArray, params);
    });
  }

  #getRouteFromUrl(urlString) {
    const url = new URL(urlString);
    const path = Router.#getPath(url);
    const route = this.#matchRoute(path);
    const params = /:/.test(route) ? Router.#extractParams(path, route) : { };
    return { route, params };
  }

  #getRoutePatterns() {
    return Object.entries(this.routes)
      .map(([routePath]) => ({ pattern: this.#routeMatchRegex(routePath), path: routePath }));
  }

  #routeMatchRegex(routePath) {
    const patternString = routePath
      .split('/')
      .map((segment) => segment.replace(/(:\w+)/, '\\w+'))
      .join('/');
    return new RegExp(`^(${this.origin}/?)?${patternString}/?$`, 'i');
  }

  // given a nav path, finds the corresponding route
  #matchRoute(navPath) {
    const match = this.routePatterns.find(({ pattern }) => pattern.test(navPath));
    if (!match) return null;
    return match.path;
  }

  #bindNavigationEvents() {
    document.removeEventListener('appnavigation', this.boundCustomNavHandler);
    document.addEventListener('appnavigation', this.boundCustomNavHandler);
    this.container.removeEventListener('click', this.boundClickHandler);
    this.container.addEventListener('click', this.boundClickHandler);
    this.container.removeEventListener('auxclick', this.boundAuxClickHandler);
    this.container.addEventListener('auxclick', this.boundAuxClickHandler);
  }

  static #handleAuxClick(e) {
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
    e.preventDefault();
    const path = e.target.getAttribute('href');
    const route = this.#matchRoute(path);
    this.#navTo(path, route);
  }

  // draw the templates corresponding to the path and update the history
  #navTo(path, route) {
    const currentUrl = window.location;
    const { route: currentRoute } = this.#getRouteFromUrl(currentUrl);
    const pageValues = Router.#getPageValues(this.routes[currentRoute]);
    this.historyManager.setEntry(pageValues, { update: true });

    const params = /:/.test(route) ? Router.#extractParams(path, route) : { };
    this.historyManager.createEntry(path);
    this.#draw(this.routes[route ?? '/'], params);
  }

  // fresh navigation from a new tab
  async #navWithoutHistory() {
    const path = window.location.hash;
    const route = this.#matchRoute(path || '/');
    const params = /:/.test(route) ? Router.#extractParams(path, route) : { };
    this.historyManager.setEntry(null, { update: false });
    const nextPage = this.routes[route];
    this.#draw(nextPage, params);
  }

  static #getPageValues(wrapperArray) {
    return wrapperArray.map((wrapper) => wrapper.getValues())
      .reduce((acc, elementValues) => Object.assign(acc, elementValues), {});
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
