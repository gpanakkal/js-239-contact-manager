import * as helpers from '../lib/helpers.js';

export default class TemplateWrapper {
  static createTemplate(handlebarsTemplate) {
    this.templates = handlebarsTemplate.map((str) => {
      const script = helpers.htmlToElements(str)[0];
      const compiled = Handlebars.compile(script.innerHTML);
      return { id: script.id, compiled };
    });
  }

  /**
   * 
   * @param {string} templateString 
   * @returns {HTMLCollection}
   */
  static createElements(templateString) {
    const script = 
    this.templates = templateString.map((str) => {
      const script = helpers.htmlToElements(str)[0];
      const compiled = Handlebars.compile(script.innerHTML);
      return { id: script.id, compiled };
    });
  }

  constructor (templateStrings, insertionCallback, appState) {
    this.templates = [];
    this.insertionCallback = insertionCallback; // e.g., (html) => parentElement.insertAdjacentHTML('beforeend', html)
    this.appState = appState;
    this.templates = TemplateWrapper.createTemplates
    this.createTemplate(templateStrings);
  }

  // draw the element, passing in relevant state
  draw(elementValues, useHistory = true) {
    const historyState = useHistory ? history.state?.currentPage : {};
    const fullValues = Object.assign({}, elementValues, historyState);
    console.log({fullValues, caller: this});
    for (let i = 0; i < this.templates.length; i += 1) {
      const html = this.templates[i].compiled(fullValues);
      // insert the element into the DOM using the insertion callback
      this.insertionCallback(html);
    }
  }

  findTemplate(name) {
    return this.templates.find(({ id }) => id === name).compiled;
  }
}
