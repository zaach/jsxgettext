gettext(
    "The second string is significantly longer "+
    "and we'd like to concatenate it in our source "+
    "code to avoid really wide files."
);

ngettext(
    "This is another quite long sentence "+
    "and we'd like to concatenate it in our source "+
    "code to avoid really wide files.",
    "This is the plural version of our quite long sentence "+
    "that we'd like to concatenate it in our source "+
    "code to avoid really wide files.",
    3
);

pgettext(
    "context",
    "Key can actually be "+
    "very long. Even over " +
    "multiple lines."
);
