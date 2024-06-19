/*
For interacting with the localStorage API.

*/

import { updateObject, assertObject } from "./helpers.js";

// // Update only fields found in the original object
// const updateObject = (original, updates, updateCb = undefined) => {
//   const updateFunc = updateCb ?? ((a, b, key) => a[key] = b[key]);
//   const revised = { ...original };
//   const missingKeys = [];
//   Object.keys(updates).forEach((key) => {
//     if (key in original) {
//       updateFunc(revised, updates, key);
//     } else {
//       missingKeys.push(key);
//     }
//   });
//   return [revised, missingKeys];
// }

// take a state object with keys and optionally values
class LocalStorageManager {
  constructor(state) {
    this.fields = Object.keys(state);
  }
  create(name, value) {
    const exists = !!this.read(name);
    if (exists) throw new Error(`Value "${name}" already exists in storage!`);
    this.replace(name, value);
  }

  read(name) {
    const existing = localStorage.getItem(name);
    // if (existing === null) throw new Error(`Value to read "${name}" not found`); // should this be a throw?
    return JSON.parse(existing);
  }

  replace(name, value) {
    localStorage.setItem(name, JSON.stringify(value));
  }

  // erases values but retains properties
  reset(name) {
    const result = this.read(name);
    for (const key in result) {
      result[key] = undefined;
    }
    this.replace(name, result);
  }

  /**
   * Overwrite properties of a stored value
   * @param {string} name The key of the property to update
   * @param {object} updates A bare object (not a Set or Map)
   */
  static update(name, updates) {
    assertObject(updates);

    const [revised, missingKeys] = updateObject(existing, updates);
    console.error(`Keys ${missingKeys} do not exist in ${name}`);
    
    this.replace(name, revised);
  }

  /**
   * Remove the values stored at each key of the object stored at the given name.
   * Throws an error if the stored value at the name is not an object.
   */
  static #removeAtKeys(name, keyObject) {
    assertObject(keyObject);
    const existing = this.read(name);
    if (typeof existing !== 'object') {
      throw new TypeError(`Value ${existing} at "${name}" is not an object.`);
    }

    const cb = (existing, _, key) => { delete existing[key] };
    const revised = updateObject(existing, keyObject, cb);
    this.replace(revised);
  }

  static #delete(name) {
    localStorage.removeItem(name);
  }

  static #clear() {
    localStorage.clear();
  }
}

export default LocalStorageManager;