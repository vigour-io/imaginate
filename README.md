# imaginator

Construct images on the fly via a simple URL!

<!-- VDOC.badges travis; standard; npm; coveralls -->
<!-- DON'T EDIT THIS SECTION (including comments), INSTEAD RE-RUN `vdoc` TO UPDATE -->
[![Build Status](https://travis-ci.org/vigour-io/imaginate.svg?branch=master)](https://travis-ci.org/vigour-io/imaginate)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![npm version](https://badge.fury.io/js/imaginate.svg)](https://badge.fury.io/js/imaginate)
[![Coverage Status](https://coveralls.io/repos/github/vigour-io/imaginate/badge.svg?branch=master)](https://coveralls.io/github/vigour-io/imaginate?branch=master)

<!-- VDOC END -->

## Install

You'll need to install Cairo as it currently can't be installed automatically with npm... If you want pdf support, install with `--enable-pdf=yes`. Same for `--enable-svg=yes`

## Usage

<!-- VDOC.jsdoc imaginate -->
<!-- DON'T EDIT THIS SECTION (including comments), INSTEAD RE-RUN `vdoc` TO UPDATE -->
#### var middleware = imaginate(options)
- **options** (*object*) - Coming soon
- **returns** (*function*) middleware - Responds to requests with images created using the info provided in the query string

<!-- VDOC END -->

```javascript
const imaginage = require('imaginate')

const middleware = imaginate()
app.use('/images', middleware)
```

The returned middlware expects the following query string parameters to be provided with each request (preferably via [urlinate](npmjs.com/package/urlinate)) and responds with the created image.
  - **input** {*string*} - URL of original image to download a inject in a canvas context.
  - **use** {*array*} - List of context transforms to apply (package name or url), in order. Each item should be an array with two items, the first being a url specifying where to get the transform from, the second being an options object specifying the options to use for that transform (see transform docs).

## Transforms

Any npm package name can be provided as transform, but only those which expose a canvas middleware function will work. For the exact specifications, see the identity transform, [ctx-identity]](https://www.npmjs.com/package/ctx-identity)

Here is a list of known transforms:

- [ctx-resize](https://www.npmjs.com/package/ctx-resize)
- [ctx-blur](https://www.npmjs.com/package/ctx-blur)
- [ctx-identity](https://www.npmjs.com/package/ctx-identity)


## Whitelisting transforms

I hope that reading this gave you the chills. *Are they really allowing people to execute arbitrary code on their machines via a simple GET request?* This is where the whitelisting feature comes in.

- `GET /whitelist` responds with the whitelist as JSON
- `POST /whitelist` allows you to update the whitelist and is subject to basic authentication (username: `admin`, password: `process.env.IMAGINATOR_PASS`.

## When transforms throw

Transforms are encouraged to throw really nice errors as these are passed along as-is to the user

## Imaginator URLs

Supposing there is an imaginator running at http://imaginator.io,

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

Notice the helper function, [urlinate](https://www.npmjs.com/package/urlinate).

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

Launches a production-ready http server using this middleware.

### Required environment variables

#### Whitelist

This server also provides a `/whitelist` route which you can GET or POST json to. This whitelist is a `package.json['dependencies']`-style json object listing the allowed canvas transforms. This whitelist will be saved as a json file on S3 so that it can persist after a crash or restart. To authenticate with S3, the imaginator expects the following environment variables to be set:

- `IMAGINATOR_AWS_ACCESS_KEY_ID`
- `IMAGINATOR_AWS_SECRET_ACCESS_KEY`
- `IMAGINATOR_BUCKET`

It also expects the IAM user to be associated to a policy giving it read and write permissions on the correct bucket and expects a file called `whitelist.json` to exist within the specified bucket and to be valid JSON (should look like the `dependencies` object in a package.json file). For more, have a fun time getting lost in the (poor but plentiful) AWS documentation.

Finally, modifying the whitelist requires basic Authentication. The username is always `admin`, but the password is determined by the value of the `IMAGINATOR_PASS` environment variable.

- `IMAGINATOR_PASS`

#### Warnings and Alerts

In production (`NODE_ENV === 'production'`), this server will send all warnings and alerts to Slack as configured by:

- `IMAGINATOR_SLACK_TOKENS`
- `IMAGINATOR_SLACK_CHANNEL`

## Deployment

#### Docker

1. Build the image
```sh
docker build -t imaginator .
```
2. Launch the image
```sh
docker run --rm -ti -p 3000:3000\
  -e IMAGINATOR_PASS=$IMAGINATOR_PASS\
  -e IMAGINATOR_SLACK_CHANNEL=$IMAGINATOR_SLACK_CHANNEL\
  -e IMAGINATOR_SLACK_TOKENS=$IMAGINATOR_SLACK_TOKENS\
  -e IMAGINATOR_AWS_ACCESS_KEY_ID=$IMAGINATOR_AWS_ACCESS_KEY_ID\
  -e IMAGINATOR_AWS_SECRET_ACCESS_KEY=$IMAGINATOR_AWS_SECRET_ACCESS_KEY\
  -e IMAGINATOR_BUCKET=$IMAGINATOR_BUCKET\
  imaginator
```

#### nowjs
```sh
now\
  -e IMAGINATOR_PASS=$IMAGINATOR_PASS\
  -e IMAGINATOR_SLACK_CHANNEL=$IMAGINATOR_SLACK_CHANNEL\
  -e IMAGINATOR_SLACK_TOKENS=$IMAGINATOR_SLACK_TOKENS\
  -e IMAGINATOR_AWS_ACCESS_KEY_ID=$IMAGINATOR_AWS_ACCESS_KEY_ID\
  -e IMAGINATOR_AWS_SECRET_ACCESS_KEY=$IMAGINATOR_AWS_SECRET_ACCESS_KEY\
  -e IMAGINATOR_BUCKET=$IMAGINATOR_BUCKET
```
...then press `2` for *Dockerfile* (see [nowjs.org](nowjs.org))
