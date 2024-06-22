# Contact Manager

This is a practice project for [Launch School](https://launchschool.com/).

To run the app, execute `npm i; npm start`. Access it via `localhost:3000`, or directly access subroutes such as `localhost:3000/#contacts/new`.

## Features

This app uses [Handlebars](https://handlebarsjs.com/) for templating and the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) to enable forward, backwards, and direct route navigation.

The tag search function has several shortcuts:
- `Tab` autofills the highlighted option, if any.
- `Escape` reverts autofilled input.
- `Enter` closes the suggestion list.
- `Backspace` deletes the latest tag; `Ctrl` + `Backspace` will empty the field.
- The up and down arrow keys navigate the list, or bring it up if it isn't already displayed.

## Reading the Code

This project uses a template wrapper to encapsulate webpage logic and markup. HTML templates in `/public/javascripts/templates` can be highlighted as HTML by using the [Comment tagged templates](https://marketplace.visualstudio.com/items?itemName=bierner.comment-tagged-templates) extension for VSCode.