/**
 * Creates and updates history entries to permit forward and back navigation in SPAs
 * Creates history entries as a doubly-linked list containing paths and page values.
 */
export default class HistoryManager {
  constructor() {
    this.origin = window.location.origin;
  }

  getState() {
    return history.state;
  }

  getUrl() {
    return history.state?.href ?? null;
  }

  // to ensure consistent structure 
  #initEntry(previousPageEntry, href, pageData = null, nextPageEntry = null) {
    return {
      previousPage: previousPageEntry,
      href,
      pageData,
      nextPage: nextPageEntry,
    };
  }

  // Updates the history state, or replaces it if specified or no state exists
  setEntry(pageValues, { replace: update = false } = {}) {
    const historyState = this.getState();
    const url = window.location.toString();
    let currentPageState = this.#initEntry(null, url, null, null);
    let base = {};
    if (update && historyState) {
      currentPageState = historyState;
      base = historyState.pageData ?? {};
    }
    currentPageState.currentPage = Object.assign(base, pageValues);

    history.replaceState(currentPageState, '', window.location.toString());
    console.log(`Set this page's history`, history.state, history.state.href); // temporary
  }

  /**
   * Saves the current page state to its history entry, then passes the same 
   * state object to be stored on the previousPageState property.
   * Invoked when navigating without using the forward/back buttons.
   * @param {string} path The URL's path
   * @param {{ [key: string]: string }} params key: value pairs of query string parameters
   */
  createEntry(path, params) {    // set up the state object for the next page with a reference to the current page
    const currentPageState = history.state;
    const newHref = new URL(path, this.origin).toString();
    const nextPageState = this.#initEntry(currentPageState, newHref, params, null)
    // {
    //   previousPage: currentPageState,
    //   pageData: params,
    //   href: newHref,
    //   nextPage: null,
    // };
    // create a reference to the next page
    currentPageState.nextPage = nextPageState;
    // save state entries
    history.replaceState(currentPageState, '', window.location.toString());
    history.pushState(nextPageState, '', newHref);
    console.log(`Updated this page's history`, currentPageState, currentPageState.href);
    console.log(`Navigating to this page with history: `, nextPageState, nextPageState.href);
  }
}