(function () {})('Ignore me');

var testObj = {
    somemethod: function () {},
    gettext: function () {},
    ngettext: function () {}
};

testObj.somemethod('I shall not pass');
testObj.gettext("I'm gonna get translated, yay!");
testObj.ngettext("I'm also gonna get translated!", "I'm the plural form!", 2);
