_('should be translatable');
t('should also be translatable');
gettext('should NOT be translatable since we did not define it as keyword');

n_('should be translatable - singular', 'should be translatable - plural', 2);
nt('should also be translatable - singular', 'should also be translatable - plural', 2);
ngettext('should NOT be translatable since we did not define it as keyword - singular', 'should NOT be translatable since we did not define it as keyword - plural', 2);
