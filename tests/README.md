
## Join Existing tests

The following commands created tests/outputs/messages_first

    xgettext    -L Perl --output-dir=tests/outputs/ --from-code=utf-8 --output=messages_firstpass.pot tests/inputs/first.js

    xgettext    -L Perl --output-dir=tests/outputs/ --from-code=utf-8 --output=messages_new.pot tests/inputs/first.js
    xgettext -j -L Perl --output-dir=tests/outputs/ --from-code=utf-8 --output=messages_new.pot tests/inputs/second.js