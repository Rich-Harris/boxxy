# boxxy

A layout manager for web apps. [See it in action here.](http://rich-harris.github.io/boxxy/)


## Installation

```bash
npm install boxxy
```


## Usage

Include **Boxxy.js** in your project - it works as a standalone script, or as an AMD module - along with **Boxxy.css**. Then,

```js
var boxxy = new Boxxy({
    el: container, // this is a reference to the container DOM element
    columns: [     // or you can have rows instead
        'left',
        'right'
    ]
});
```

This will create two columns inside `container`, with `left` and `right` as their IDs. They will be separated by a vertical control, which you can drag to resize the two columns.

You can easily retrieve references to the two columns (for the purposes of rendering the rest of your UI, for example):

```js
boxxy.blocks.left === document.getElementById( 'left' ); // true
boxxy.blocks.right === document.getElementById( 'right' ); // true
```


## That's not very exciting

Yeah, it's not. But you can also nest blocks inside each other, specify constraints (minimum and maximum width, etc), set an initial layout (which is fluid, and will keep its proportions when the window resizes, subject to any other specified constraints), and so on.

All will be documented soon! For now, I have to get back to work.


## License

MIT


## Contact

[@rich_harris](http://twitter.com/rich_harris)
