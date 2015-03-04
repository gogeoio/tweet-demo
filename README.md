# goGeo Tweets

goGeo Tweets Demo App

## Setup

Please create an environment configuration file inside the `config/` folder. There's a sample on
how to setup a configuration file in `example.environment.json`. You should create at least one
of the following options: `development.json`, `testing.json` and `production.json`. The environment
name should be used when running the application (see below).

## Running

```sh
$ npm install -g browserify grunt
$ npm install
$ NODE_ENV=<environment> grunt server
```

### Running and watching codebase

```sh
$ NODE_ENV=<environment> grunt server:watch
```

[http://demos.gogeo.io/tweets](http://demos.gogeo.io/tweets)
