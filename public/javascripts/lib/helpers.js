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

const formatNumber = (phoneNumber) => {
  const num = String(phoneNumber);
  return num.length === 10 
    ? num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    : num.replace(/(\d*)(\d{3})(\d{3})(\d{4})/, '+$1 $2-$3-$4');
};

// const formDataToJson = (formData) => {
//   const obj = [...formData.entries()]
//     .reduce((acc, pair) => Object.assign(acc, { [pair[0]]: pair[1] }), {});
//   return JSON.stringify(obj);
// }

const formToJson = (form) => JSON.stringify(Object.fromEntries(new FormData(form)));

const getFormValues = (e) => [...e.currentTarget.elements]
.reduce((acc, el) => Object.assign(acc, { [el.name]: el.value }), { });

/**
 * Converts raw HTML text into elements
 * @param {string} htmlString 
 * @returns {HTMLCollection}
 */
const htmlToElements = (htmlString) => {
  const div = create('div', { }, { innerHTML: htmlString });
  const children = [...div.children];
  console.log(div.textContent);
  console.log(children);
  children.forEach((child) => child.remove());
  return children;
}

const hashIterable = (iterable) => [].reduce
  .call(iterable, (acc, val, i) => Object.assign(acc, { [val]: i }), {});

// untested
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

const select = (selector) => document.querySelector(selector);

const selectAll = (selector) => [...document.querySelectorAll(selector)];

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

// Update only fields found in the original object
const updateObject = (original, updates, updateCb = undefined) => {
  const updateFunc = updateCb ?? ((a, b, key) => a[key] = b[key]);
  const revised = { ...original };
  const missingKeys = [];
  Object.keys(updates).forEach((key) => {
    if (key in original) {
      updateFunc(revised, updates, key);
    } else {
      missingKeys.push(key);
    }
  });
  return [revised, missingKeys];
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
  setSubtract,
  stringSubtract,
  updateObject,
  xhrRequest,
};
