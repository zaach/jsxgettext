var templates = {
  "pin_verification": {
      landing: 'pin_verification',
    subject: test.gettext("Confirm email address for Persona"),
    subject2: test.gettext.call(test, "Confirm email address for Persona 2"),
    subject3: test.something.someotherthing['gettext'].call(test, "Confirm email address for Persona 3", somethingelse),
    subject4: test.ngettext("Confirm email address for Persona 4", "Confirm email address for Persona 4 plural", 4),
    subject5: test.ngettext.call(test, "Confirm email address for Persona 5", "Confirm email address for Persona 5 plural", 5),
    subject6: test.something.someotherthing['ngettext'].call(test, "Confirm email address for Persona 6", "Confirm email address for Persona 6 plural", 6, somethingelse),
    subject7: test.pgettext("context", "Confirm for person 7 context"),
    subject8: test.pgettext.call(test, "context", "Confirm for person 8 context"),
    subject9: test.something.someotherthing['pgettext'].call(test, "context", "Confirm for person 9 context", somethingelse)
  }
};

test.something.someotherthing.random.call(test, "I shall not exist", somethingelse);
