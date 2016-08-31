# imaginator

Construct images on the fly via a simple URL!

<!-- VDOC.badges travis; standard; npm; coveralls -->

## Install

You'll need to install Cairo as it currently can't be installed automatically with npm... If you want pdf support, install with `--enable-pdf=yes`. Same for `--enable-svg=yes`

## Usage

<!-- VDOC.jsdoc imaginate -->

```javascript
const imaginage = require('imaginate')

const middleware = imaginate()
app.use('/images', middleware)
```

The returned middlware expects the following query string parameters to be provided with each request (preferably via [urlinate](npmjs.com/package/urlinate)) and responds with the created image.
  - **input** {*string*} - URL of original image to download a inject in a canvas context.
  - **use** {*array*} - List of context transforms to apply, in order. Each item should be an array with two items, the first being a url specifying where to get the transform from, the second being an options object specifying the options to use for that transform (see transform docs).

## Imaginator URLs

Supposing there is an imaginator running at http://imaginator.io...

```javascript
var urlinate = require('urlinate')
var url = urlinate('http://imaginator.io', {
  input: 'http://wtv.com/img.jpg',
  use: [
    [ 'http://npmjs.com/package/ctx-resize', {
      width: 900,
      height: 600
    }]
  ]
})
```

Then use the URL like any image URL:

##### HTML
```html
<img src="IMAGINATOR_URL">
```

##### CSS
```css
body {
  background: url('IMAGINATOR_URL');
}
```

##### JavaScript (browser)
```javascript
img_DOM_Node.src = 'IMAGINATOR_URL'
DOM_Node.style.background = "url('IMAGINATOR_URL')"
```

##### Node.js
```javascript
http.get('IMAGINATOR_URL', ...)
```

## npm start

Launches a production-ready http server using this middleware

### Deployment

```sh
now
```
See [nowjs.org](nowjs.org)

Also works out of the box on **Heroku**

```sh
git remote add <your_heroku_remote>
git push heroku master
```

