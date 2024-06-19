import * as helpers from '../lib/helpers.js';

export default class TemplateWrapper {
  constructor (templateStrings, insertionCallback, appState) {
    this.templates = [];
    this.insertionCallback = insertionCallback; // e.g., (html) => parentElement.insertAdjacentHTML('beforeend', html)
    this.appState = appState;
    this.createTemplates(templateStrings);
  }

  createTemplates(templateStrings) {
    this.templates = templateStrings.map((str) => {
      const script = helpers.htmlToElements(str)[0];
      const compiled = Handlebars.compile(script.innerHTML);
      return [script.id, compiled];
    });
  }

  // draw the element, passing in the app state
  draw(state) {
    console.log({state, caller: this});
    for (let i = 0; i < this.templates.length; i += 1) {
      const html = this.templates[i][1](state);
      // console.log(html); // temporary
      // insert the element into the DOM using the insertion callback
      this.insertionCallback(html);
    }
  }

  findTemplate(name) {
    return this.templates.find(([id]) => id === name)[1];
  }
}
