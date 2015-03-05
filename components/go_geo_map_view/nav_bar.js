var React = require('react');

var div = React.DOM.div,
    nav = React.DOM.nav,
    button = React.DOM.button,
    span = React.DOM.span,
    a = React.DOM.a,
    i = React.DOM.i,
    img = React.DOM.img,
    form = React.DOM.form,
    label = React.DOM.label,
    input = React.DOM.input,
    ul = React.DOM.ul,
    li = React.DOM.li;

var NavBar = React.createClass({displayName: 'GoGeoMapView.NavBar',
    componentDidMount: function() {
        jQuery('#rangedate .input-daterange').datepicker({
            clearBtn: true,
            multidate: true,
            todayHighlight: true
        });
    },

    render: function() {
        return nav({className: 'animate fadeIn navbar-static-top navbar navbar-default'},
            div({className: 'container-fluid'},
                div({className: 'navbar-header'},
                    button({
                        type: 'button',
                        className: 'navbar-toggle collapsed',
                        'data-toggle': 'collapse',
                        'data-target': '#header-navbar-collapse'
                    },
                        span({className: 'sr-only'}, 'Toggle navigation'),
                        span({className: 'icon-bar'}),
                        span({className: 'icon-bar'}),
                        span({className: 'icon-bar'})
                    ),
                    a({className: 'navbar-brand', href: '#'},
                        img({alt: 'Brand', src: 'assets/img/gogeo-logo.png'})
                    )
                ),
                div({className: 'collapse navbar-collapse', id: 'header-navbar-collapse'},
                    ul({className: 'nav navbar-nav navbar-left'},
                        li(null,
                            form({className: 'form-inline', rule: 'search'},
                                div({className: 'form-group'},
                                    label({className: 'sr-only', htmlFor: 'lookingForSomething'},
                                        'Hashtag and user search'
                                    ),
                                    input({
                                        type: 'text',
                                        className: 'form-control',
                                        id: 'lookingForSomething',
                                        placeholder: 'Looking for something?'
                                    })
                                ),
                                div({className: 'form-group space-h1'},
                                    label({className: 'sr-only', htmlFor: 'lookingWhere'},
                                        'Where? Contry only'
                                    ),
                                    input({
                                        type: 'text',
                                        className: 'form-control',
                                        id: 'lookingWhere',
                                        placeholder: 'Where? Contry only.'
                                    })
                                )
                            )
                        ),
                        li({id: 'rangedate'},
                            div({className: 'input-daterange input-group', id: 'datepicker'},
                                input({
                                    type: 'text',
                                    className: 'input-sm form-control',
                                    name: 'start',
                                    placeholder: '12/05/2014'
                                }),
                                span({className: 'input-group-addon'},
                                    i({className: 'fa fa-calendar fa-2x'})
                                ),
                                input({
                                    type: 'text',
                                    className: 'input-sm form-control',
                                    name: 'end',
                                    placeholder: '02/25/2015'
                                })
                            )
                        ),
                        li(null,
                            button({className: 'btn btn-tour', type: 'button'},
                                i({className: 'fa fa-2x fa-bullhorn'}),
                                span(null, 'tour')
                            )
                        )
                    ),
                    ul({className: 'nav navbar-nav navbar-right'},
                        li({className: 'pull-right'},
                            button({
                                className: 'btn btn-warning btn-block btn-lg',
                                type: 'button',
                                'data-toggle': 'modal',
                                'data-target': '#addMoreTweets'
                            }, 'Add more milions of tweets')
                        )
                    )
                )
            )
        )
    }
});

module.exports = NavBar;
