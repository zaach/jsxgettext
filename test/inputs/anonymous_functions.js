(function () {})('Ignore me');

var testObj = {
    somemethod: function () {},
    gettext: function () {},
    ngettext: function () {}
};

testObj.somemethod('I shall not pass');
testObj.pgettext("I'm gonna get translated, yay!");
testObj.ngettext("I'm also gonna get translated!", "I'm the plural form!", 2);
testObj.pgettext("context1", "I am translated in context!");
testObj.pgettext("context2", "I am translated in context!");
testObj.npgettext("context3", "I am also translated in context!", "I'm the plural form!", 2);
testObj.npgettext("context4", "I am also translated in context!", "I'm the plural form!", 2);
