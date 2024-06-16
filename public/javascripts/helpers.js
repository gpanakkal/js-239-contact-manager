const select = (selector) => document.querySelector(selector);

const selectAll = (selector) => [...document.querySelector(selector)];

// create elements
const create = (tag, attributes = {}, properties = {}) => {
  const el = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
  Object.assign(el, properties);
  return el;
}

// add the new elements, then remove the previous ones once they finish transitioning in
const setBody = (templates) => {
  const bodyContainer = select('.app.container');
  const previousElements = [...bodyContainer.children];
  templates.forEach((template) => bodyContainer
    .insertAdjacentHTML('beforeend', template));

  previousElements.forEach((element) => element.remove());
};

const getFormValues = (e) => [...e.currentTarget.elements]
.reduce((acc, el) => Object.assign(acc, { [el.name]: el.value }), { });

const formDataToJson = (formData) => {
  const obj = [...formData.entries()]
    .reduce((acc, pair) => Object.assign(acc, { [pair[0]]: pair[1] }), {});
  return JSON.stringify(obj);
}

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

module.exports = {
  select,
  selectAll,
  create,
  setBody,
  getFormValues,
  formDataToJson,
  queryString,
  xhrRequest,
};
