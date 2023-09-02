Quick Close in Overview
================

Gnome shell extension for closing apps in overview with a middle (or other) click.

All credit goes to Paolo Tranquilli (http://cs.unibo.it/~tranquil/en/hacking.html), I've merely
copied its code here to provide Gnome Shell 3.10+ compatibility

This extension is installable from
https://extensions.gnome.org/extension/352/middle-click-to-close-in-overview/.

Otherwise you may

* download a [zip](https://github.com/p91paul/middleclickclose/archive/master.zip) of this extension
* extract it
* run the following command
 ```
    make install
```
* reload gnome-shell (Alt-F2, r, Enter) -> on Wayland you need to log out and log in again, there is no in-place reload
* activate it through the Gnome Extensions application.

## Translations

If you're interested in contributing a translation, import the translation template file under
`src/po/template.pot` to your favourite po-editing software and create a `*.po` file under `src/po`.

To update all existing translations after changing the code, run `make po`. To regenerate only the
`template.pot` file, run `make pot`
