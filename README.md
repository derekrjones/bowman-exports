# bowman-exports

## Plugin for Bowman that finds exposed globals and sets the export for requiring with browserify

- adds `exports` property for use with browserify
- adds `exposes` property for globals (ie. window.jQuery)
- uses JSDom

## install

`npm install bowman-exports --save`

## usage

```javascript
// bower.json
"bowman": {
  "plugins": [
    "bowman-exports"
  ],
  "bowman-exports": {
    "angular-scroll": "angular.module('duScroll')",
    "ng-Fx": "angular.module('ngFx')"
  }
}
```

## example

```javascript
// .bowman.json
"angular-ui-router": {
  "name": "angular-ui-router",
  "repository": "angular-ui/ui-router",
  /* ... */
  "angular": {
    "ui.router.util": [
      "ng"
    ],
    "ui.router.router": [
      "ui.router.util"
    ],
    "ui.router.state": [
      "ui.router.router",
      "ui.router.util"
    ],
    "ui.router": [
      "ui.router.state"
    ],
    "ui.router.compat": [
      "ui.router"
    ]
  },
  "exposes": [],
  "exports": "angular.module('ui.router')"
},
"jquery": {
  "name": "jquery",
  "repository": "jquery/jquery",
  "version": "2.1.2",
  /* ... */
  "angular": {},
  "exposes": [
    "$",
    "jQuery"
  ],
  "exports": "jQuery"
}
```
