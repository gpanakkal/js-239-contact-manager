const select = (selector) => document.querySelector(selector);

const selectAll = (selector) => [...document.querySelectorAll(selector)];

// create elements
const create = (tag, attributes = {}, properties = {}) => {
  const el = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
  Object.assign(el, properties);
  return el;
}

const htmlToElements = (html) => {
  const div = create('div', { }, { innerHTML: html });
  const children = div.children;
  children.remove();
  return children;
}

const hashIterable = (iterable) => [].reduce
  .call(iterable, (acc, val, i) => Object.assign(acc, { [val]: i }), {});

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

const stringSubtract = (first, second) => arraySubtract(first, second).join('');

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

const formatNumber = (phoneNumber) => {
  const num = String(phoneNumber);
  return num.length === 10 
    ? num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    : num.replace(/(\d*)(\d{3})(\d{3})(\d{4})/, '+$1 $2-$3-$4');
};

const getFormValues = (e) => [...e.currentTarget.elements]
.reduce((acc, el) => Object.assign(acc, { [el.name]: el.value }), { });

// const formDataToJson = (formData) => {
//   const obj = [...formData.entries()]
//     .reduce((acc, pair) => Object.assign(acc, { [pair[0]]: pair[1] }), {});
//   return JSON.stringify(obj);
// }

const formToJson = (form) => JSON.stringify(Object.fromEntries(new FormData(form)));

// untested
const queryString = (formObj) => {
  return Object.entries(formObj).reduce((acc, pair) => {
    const [key, value] = pair.map(encodeURIComponent);
    return acc.concat(`${key}=${value}`)}, '');
}

const xhrRequest = (method, path, headers = {}, data = undefined) => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, path);
  
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
  select,
  selectAll,
  create,
  htmlToElements,
  arraySubtract,
  stringSubtract,
  setSubtract,
  formatNumber,
  getFormValues,
  formToJson,
  queryString,
  xhrRequest,
};
