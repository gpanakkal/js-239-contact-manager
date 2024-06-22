const assertObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`Argument must be an object. Received: ${value}`);
  };
}

/**
 * Given two array-like objects, non-destructively remove each element from iterator1 found in the 
 * same position in iterator2
 * @returns an array of remaining values
 */
const arraySubtract = (iterator1, iterator2) => {
  const end = Math.min(iterator1.length, iterator2.length);
  let output = {...iterator1};
  for (let i = 0; i < end; i += 1) {
    if (output[i] === iterator2[i]) delete output[i];
  }
  return Object.values(output);
}

// create elements
const create = (tag, attributes = {}, properties = {}) => {
  const el = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
  Object.assign(el, properties);
  return el;
}

// wip
const formatNumber = (phoneNumber) => {
  const num = String(phoneNumber);
  return num.length === 10 
    ? num.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
    : num.replace(/(\d*)(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
};

const formToJson = (form) => JSON.stringify(Object.fromEntries(new FormData(form)));

const getFormValues = (e) => [...e.currentTarget.elements]
.reduce((acc, el) => Object.assign(acc, { [el.name]: el.value }), { });

/**
 * Converts raw HTML text into elements. Don't pass HTML strings containing interpolated values!
 * @param {string} htmlString 
 * @returns {HTMLCollection}
 */
const htmlToElements = (htmlString) => {
  const div = create('div', { }, { innerHTML: htmlString });
  const children = [...div.children];
  children.forEach((child) => child.remove());
  return children;
}

const hashIterable = (iterable, transform = (x) => x) => [].reduce
  .call(iterable, (acc, val, i) => Object.assign(acc, { [transform(val)]: i }), {});

// assumes the element is in the DOM
const matchesSelector = (selector, element) => selectAll(selector).includes(element);

const queryString = (formObj) => {
  return Object.entries(formObj).reduce((acc, pair) => {
    const [key, value] = pair.map(encodeURIComponent);
    return acc.concat(`${key}=${value}`)}, '');
}

const rollOverAccess = (arr, i) => {
  let index = (i % arr.length);
  if (index < 0) index = arr.length + index;
  return arr[index];
}

const select = (selector, parent = document) => parent.querySelector(selector);

const selectAll = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const selectParent = (selector, child) => {
  if (child.parentNode === document.body) return null;
  return matchesSelector(selector, child.parentNode) 
    ? child.parentNode 
    : selectParent(selector, child.parentNode);
}

/**
 * Given two array-like objects, immutably remove each element from iterator1 found in iterator2
 * without respect to position
 * @returns a non-sparse array of the remaining values
 */
const setSubtract = (iterator1, iterator2) => {
  const end = Math.min(iterator1.length, iterator2.length);
  let hash = hashIterable(iterator2);
  let output = { ...iterator1 };
  for (let i = 0; i < end; i += 1) {
    if (output[i] in hash) delete output[i];
  }
  return Object.values(output);
}

const stringSubtract = (first, second) => arraySubtract(first, second).join('');

/**
 * Get the exclusive disjunction of two objects' keys
 * @param {object} first
 * @param {object} second 
 * @returns {{ first: string[], second: string[] }}
 */
const uniqueKeys = (first, second) => {
  const allKeys = new Set(Object.keys(first).concat(Object.keys(second)));
  return [...allKeys].reduce((unique, key) => {
    if (!(key in first)) unique.second[key] = second[key];
    if (!(key in second)) unique.first[key] = first[key];
    return unique;
  }, { first: [], second: [] });
}

/**
 * Immutably update an object without adding new properties
 * @param {object} original 
 * @param {object} updates 
 * @param {function} updateCb A function to execute to update the object.
 * If not specified, performs direct reassignment at each matching key.
 * @returns {[object, string[]]} A double of the updated object and an
 * array of the missing keys
 */
const updateObject = (original, updates, updateCb = ((a, b, key) => a[key] = b[key])) => {
  const revised = { ...original };
  Object.keys(updates).forEach((key) => {
    if (key in original) updateCb(revised, updates, key);
  });
  return revised;
}

const xhrRequest = (method, path, headers = {}, data = undefined, responseType = '') => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, path);
    request.responseType = responseType;
  
    Object.entries(headers)
      .forEach(([header, value]) => request.setRequestHeader(header, value));
  
    request.addEventListener('load', (e) => {
      resolve(request.response);
    });
    
    request.addEventListener('error', (e) => {
      reject({ status: xhr.status, statusText: xhr.statusText});
    });

    request.send(data);
  });
};

export {
  assertObject,
  arraySubtract,
  create,
  formatNumber,
  formToJson,
  getFormValues,
  hashIterable,
  htmlToElements,
  queryString,
  rollOverAccess,
  select,
  selectAll,
  selectParent,
  setSubtract,
  stringSubtract,
  uniqueKeys,
  updateObject,
  xhrRequest,
};
