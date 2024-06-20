import { htmlToElements, select, selectAll } from "../lib/helpers.js";

const wrapperTemplate = (input) => /* html */ `
<div class="autocomplete-wrapper">
  <ul class="autocomplete-ui">
  </ul>
  <div class="autocomplete-overlay" style="${input.clientWidth}px">
  </div>
</div>
`;

const matchListTemplate = (matches) => matches.length && matches
  .map((match, i) => /* html */ `<li class="autocomplete-ui-choice" value="${match}">${match}</li>`)
  .join('\n');

export default class Autocomplete {
  constructor(inputElement, optionsLoader) {
    this.input = inputElement;
    this.optionsLoader = optionsLoader;
    this.highlightedOption = null;
    this.backupValue = '';
    this.wrapper = null;
    this.listUI = null;
    this.overlay = null;

    this.createWrapper();
    this.bindEvents();
  }

  matchesInput(input, option) {
    return option.match(new RegExp(input, 'i'));
  }

  newFillValue(option) {
    return option.getAttribute('value');
  }

  createWrapper() {
    this.wrapper = htmlToElements(wrapperTemplate(this.input))[0];
    this.input.parentNode.appendChild(this.wrapper);
    this.wrapper.insertAdjacentElement('afterbegin', this.input);
    this.listUI = select('ul.autocomplete-ui', this.wrapper);
    this.overlay = select('div.autocomplete-overlay', this.wrapper);
    this.input.setAttribute('autocomplete', 'off');
  }

  bindEvents() {
    this.input.addEventListener('beforeinput', this.controlInput.bind(this));
    this.input.addEventListener('input', this.handleTextInput.bind(this));
    this.input.addEventListener('keydown', this.handleKeydown.bind(this));
    document.body.addEventListener('mousedown', this.handleMousedown.bind(this));
    this.listUI.addEventListener('mouseover', this.handleMouseover.bind(this));
  }

  // prevent insertion of spaces
  controlInput(e) {
    console.warn({ beforeInputData: e.data, event: e })
    if (e.inputType === 'insertText') {
      if (e.data.match(/\s/)) {
        e.preventDefault();
        return;
      }
      const prevCharIsComma = this.input.value.slice(-1) === ','
      if (prevCharIsComma) {
        this.input.value = this.input.value + ' ';
      }
      if (e.data === ',') {
        this.input.value += ', ';
        e.preventDefault();
      }
    }
  }

  // redraw matches as needed
  async handleTextInput(e) {
    const { value } = this.input;
    this.backupValue = value;
    this.clearUI();
    if (value.length === 0) return;

    const optionValues = [...await this.optionsLoader()];
    const matches = this.matchesInput(value, optionValues);
    this.drawUI(matches);
  }

  handleKeydown(e) {
    const keyActions = {
      'ArrowDown': (e) => {
        e.preventDefault();
        const next = this.highlightedOption.nextElementSibling ?? this.listUI.firstElementChild;
        this.highlightMatch(next);
      },
      'ArrowUp': (e) => {
        e.preventDefault();
        const prev = this.highlightedOption.previousElementSibling ?? this.listUI.lastElementChild;
        this.highlightMatch(prev);
      },
      'Tab': (e) => {
        if (!this.highlightedOption) return;
        e.preventDefault();
        // replace the partial tag with the full one
        // this.input.value = this.fillCallback(this.input, this.highlightedOption);
        this.autoFillInputValue();
        this.clearUI();
        // this.highlightMatch(null);
      },
      'Escape': (e) => {
        this.input.value = this.backupValue;
        this.clearUI();
      },
      'Enter': (e) => this.clearUI(), // this also submits the form since it doesn't prevent default
    }
    
    if (e.key in keyActions) {
      keyActions[e.key](e);
    }
  }

  autoFillInputValue() {
    this.input.value = this.newFillValue(this.highlightedOption);
    const inputSet = new InputEvent('input', { bubbles: true });
    this.input.dispatchEvent(inputSet);
  }

  handleMousedown(e) {
    if (e.target === this.input) {
      this.handleTextInput(e);
      return;
    }
    if (!e.target.classList.contains('autocomplete-ui-choice')) {
      this.clearUI();
      return;
    }
    e.preventDefault();
    const match = e.target;
    this.input.value = this.newFillValue(match);
    this.clearUI();
    this.input.focus({ focusVisible: true });
  }

  handleMouseover(e) {
    const match = e.target;
    if (e.target.classList.contains('autocomplete-ui-choice')) {
      this.highlightMatch(match);
    }
  }

  findListOption(value) {
    const selector = `.autocomplete-ui-choice[value="${value}"]`;
    console.log(selector, select(selector));
    return select(selector, this.wrapper);
  }

  highlightMatch(match = null) {
    const optionList = selectAll('.autocomplete-ui-choice', this.listUI);
    optionList.forEach((li) => li.classList.remove('highlighted'));
    match?.classList.add('highlighted');
    this.highlightedOption = match;
    this.generateOverlayText(match);
  }

  async drawUI(optionValues) {
    this.clearUI();
    const options = optionValues.length > 0
      ? optionValues.filter((option) => option !== this.input.value) 
      : ['(No matching tags)'];
    if (!options.length) return;
    const listStr = matchListTemplate(options);
    const listItems = htmlToElements(listStr);
    this.listUI.setAttribute('visible', 'true');
    this.listUI.append(...listItems);
    this.highlightMatch(listItems[0]);
  }

  generateOverlayText(match) {
    const newText = this.newFillValue(match);
    this.overlay.textContent = newText;
  }

  clearUI() {
    this.highlightedOption = null;
    this.listUI.innerHTML = null;
    this.overlay.textContent = '';
    this.listUI.setAttribute('visible', 'false');
    selectAll('.autocomplete-ui-choice', this.listUI).forEach((li) => li.remove());
    const uiClearedEvent = new CustomEvent('autocomplete-cleared');
    this.input.dispatchEvent(uiClearedEvent);
  }
}