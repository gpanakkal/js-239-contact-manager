import { hashIterable } from "../lib/helpers.js";
import Autocomplete from "./Autocomplete.js";

export default class TagAutocomplete extends Autocomplete {
  constructor(input, optionsLoader) {
    super(input, optionsLoader, '(No matching tags)');
  }

  matchingOptions(tagValues) {
    const inputTags = this.getInputValue();
    if (!inputTags.length) return null;
    const lastTag = inputTags[inputTags.length - 1];
    return tagValues.filter((option) => option.toLowerCase().startsWith(lastTag.toLowerCase()));
  }

  tagStringToArray(tagString) {
    return tagString.split(',').map((tag) => tag.trim()).filter((tag) => tag.length);
  }

  tagArrayToString(tagArray) {
    return tagArray.map((tag) => tag.trim()).filter((tag) => tag.length).join(', ');
  }

  // split it into an array
  getInputValue() {
    return this.input.value ? this.tagStringToArray(this.input.value) : [];
  }

  setInputValue(tagArray) {
    if (!Array.isArray(tagArray)) throw new TypeError(`Must pass an array of strings`);
    this.input.value = this.tagArrayToString(tagArray);
  }

  appendToInput(string) {
    const current = this.getInputValue();
    this.setInputValue(current.concat([string]));
  }

  newFillValue(option) {
    const tagArr = this.getInputValue();
    const newTagStr = option.textContent;
    const withNewTag = tagArr.slice(0, -1).concat([newTagStr]);
    return withNewTag;
  }

  // remove the last tag and add the option's value
  autoFillInputValue(option) {
    this.backupValue = this.getInputValue();
    this.setInputValue(this.newFillValue(option));
    const inputSet = new InputEvent('input', { bubbles: true });
    this.input.dispatchEvent(inputSet);
  }

  // prevent consecutive commas and auto insert commas when hitting space
  controlInput(e) {
    const value = this.getInputValue();
    const currentValueString = this.input.value;
    console.info({ beforeInputData: e.data, event: e })
    const prevCharIsComma = /,\s*$/.test(currentValueString);
    const improperSpaces = /,(\S|\s{2,})/.test(currentValueString);
    const inputIsSpace = /^\s+$/.test(e.data);
    const isWordInput = /\w+/.test(e.data);
    const isDeletion = /^delete/i.test(e.inputType);

    if (improperSpaces) {
      const corrected = currentValueString.replace(/,(\s{0}|\s{2,})/, ', ');
      this.setInputValue(this.tagStringToArray(corrected));
    }

    if (e.inputType === 'insertText') {
      if (e.data === ',' && prevCharIsComma) {
        e.preventDefault();
      } else if (inputIsSpace) {
        e.preventDefault();
        if (!prevCharIsComma) this.appendToInput(', ');
      }
    } else if (e.inputType === 'deleteContentBackward') {
      if (prevCharIsComma) {
        const updated = currentValueString.replace(/,\s*$/, '');
        this.setInputValue(this.tagStringToArray(updated));
      }
    } else if (e.inputType === 'deleteWordBackward') {
      // const updated = currentValueString.replace(/,\s*$/, '');
      const updated = value.slice(0, -1);
      this.setInputValue(updated);
    } 
    // add else condition to strip trailing ',\s*$' from the tag string on form submit
  }
}