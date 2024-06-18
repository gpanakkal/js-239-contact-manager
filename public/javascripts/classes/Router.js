export default class Router {
  // router
  static routeMatchRegex(routePath) {
    const hashReplace = /^#/.test(routePath) ? '#' : '';
    const patternString = routePath
      .replace(/^#/, '')
      .split('/')
      .map((segment) => segment.replace(/(:\w+)/, "\\w+"))
      .join('/');
    return new RegExp(`^${hashReplace}${patternString}/?$`, 'i');
  }

  // router
  static pathSegments(path) {
    return path?.replace(/^#/, '').split('/') ?? null;
  }

  // router
  static extractParams(navPath, routePath) {
    const routeSegments = App.pathSegments(routePath);
    const navSegments = App.pathSegments(navPath);
  
    return navSegments.reduce((acc, value, i) => {
      const paramSegment = routeSegments[i];
      if (!paramSegment.match(/^:/)) return acc;
      return Object.assign(acc, { [paramSegment.slice(1)]: value });
    }, {});
  }

  // router? only if the router has final determination of what to draw
  static logNav(...args) {
    console.log(new Date().toLocaleTimeString(), JSON.stringify(...args));
  }

  compileTemplate 
}