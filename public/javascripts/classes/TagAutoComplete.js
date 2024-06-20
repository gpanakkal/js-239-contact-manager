import { hashIterable } from "../lib/helpers.js";
import Autocomplete from "./Autocomplete.js";

export default class TagAutocomplete extends Autocomplete {
  constructor(input, optionsLoader) {
    super(input, optionsLoader);
    console.log({ controlInput: this.controlInput})
    super.bindEvents.call(this);
  }

  matchesInput(tagInputText, tagValues) {
    const tags = tagInputText.split(',').map((tag) => tag.trim());
    const lastTag = tags[tags.length - 1].toLowerCase();
    const tagHash = hashIterable(tags.slice(0, -1));
    const matchingTags = tagValues.filter((value) => {
      const tagPresent = (value.toLowerCase() in tagHash);
      const lastTagMatches = value.toLowerCase().includes(lastTag);
      return !tagPresent && lastTagMatches;
    });
    return matchingTags.toSorted((a, b) => a.toLowerCase().indexOf(lastTag) - b.toLowerCase().indexOf(lastTag));
  }

  newFillValue(option) {
    const previousTagArr = this.input.value.split(',').map((value) => value.trim()).slice(0, -1);
    const newTagStr = `${option.getAttribute('value')}, `;
    const withNewTag = previousTagArr.concat([newTagStr]).join(', ');
    return withNewTag;
  }
}