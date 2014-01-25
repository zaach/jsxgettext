var templates = {
  "pin_verification": {
      landing: 'pin_verification',
    subject: test.gettext("Confirm email address for Persona"),
    subject2: test.gettext.call(test, "Confirm email address for Persona 2"),
    subject3: test.something.someotherthing['gettext'].call(test, "Confirm email address for Persona 3", somethingelse)
  }
};

test.something.someotherthing.random.call(test, "I shall not exist", somethingelse);