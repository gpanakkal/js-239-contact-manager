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
  constructor(
    inputElement,
    optionsLoader,
    matchCallback = (input, option) => option.match(new RegExp(input, 'i')),
    fillCallback = (input, option) => input.value = option.getAttribute('value'),
  ) {
    this.input = inputElement;
    this.matchCallback = matchCallback;
    this.optionsLoader = optionsLoader;
    this.fillCallback = fillCallback;
    this.highlightedOption = null;
    this.backupValue = '';
    this.wrapper = null;
    this.listUI = null;

    this.createWrapper();
    this.bindEvents();
  }

  createWrapper() {
    this.wrapper = htmlToElements(wrapperTemplate(this.input))[0];
    this.input.parentNode.appendChild(this.wrapper);
    this.wrapper.insertAdjacentElement('afterbegin', this.input);
    this.listUI = select('ul.autocomplete-ui', this.wrapper);
    this.input.setAttribute('autocomplete', 'off');
  }

  bindEvents() {
    this.input.addEventListener('input', this.handleTextInput.bind(this));
    this.input.addEventListener('keydown', this.handleKeydown.bind(this));
    this.listUI.addEventListener('mousedown', this.handleMousedown.bind(this));
    this.listUI.addEventListener('mouseover', this.handleMouseover.bind(this));
  }

  // redraw matches as needed
  async handleTextInput(e) {
    const { value } = this.input;
    this.backupValue = value;
    this.clearUI();
    if (value.length === 0) return;

    const optionValues = [...await this.optionsLoader()];
    const matches = this.matchCallback(value, optionValues);
    this.drawUI(matches);
  }

  handleKeydown(e) {
    // const options = selectAll('.autocomplete-ui-choice', this.listUI);

    const keyActions = {
      'ArrowDown': () => {
        e.preventDefault();
        const next = this.highlightedOption.nextElementSibling ?? this.listUI.firstElementChild;
        this.highlightMatch(next);
      },
      'ArrowUp': () => {
        e.preventDefault();
        const prev = this.highlightedOption.previousElementSibling ?? this.listUI.lastElementChild;
        this.highlightMatch(prev);
      },
      'Tab': () => {
        if (!this.highlightedOption) return;
        e.preventDefault();
        // replace the partial tag with the full one
        this.fillCallback(this.input, this.highlightedOption);
        this.clearUI();
        // this.highlightMatch(null);
      },
      'Escape': () => {
        this.input.value = this.backupValue;
        this.clearUI();
      },
      'Enter': () => this.clearUI(),
    }

    if (e.key in keyActions) {
      keyActions[e.key]();
    }
  }

  handleMousedown(e) {
    e.preventDefault();
    const match = e.target;
    this.fillCallback(this.input, match);
    this.clearUI();
    this.input.focus({ focusVisible: true });
  }

  handleMouseover(e) {
    const match = e.target;
    if (e.target.classList.contains('.autocomplete-ui-choice')) {
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
  }

  async drawUI(optionValues) {
    // generate the list
    const options = optionValues.length ? optionValues : ['(No matching tags)'];
    const listStr = matchListTemplate(options);
    const listItems = htmlToElements(listStr);
    this.clearUI();
    if (listItems[0])
    this.listUI.setAttribute('visible', 'true');
    this.listUI.append(...listItems);
    this.highlightMatch(listItems[0]);
  }

  clearUI() {
    this.highlightedOption = null;
    this.listUI.innerHTML = null;
    this.listUI.setAttribute('visible', 'false');
    selectAll('.autocomplete-ui-choice', this.listUI).forEach((li) => li.remove());
  }
}