Quick Close in Overview
-----------------------
GNOME shell extension for quickly closing apps in the overview.

[![Download from extensions.gnome.org](img/ego.svg)](https://extensions.gnome.org/extension/352/middle-click-to-close-in-overview/)

## Features

- **Middle click to close**: Just hover over the app you want to close in the overview, and middle
  click. The mouse button that will trigger closing can be adjusted in the settings.
- **`Alt+F4` in the overview**: When triggering the close action (typically `Alt+F4`), the focused
  window will be closed. This can be turned off in the settings.
- **Adjustable rearrange delay**: After closing an application, GNOME will wait a bit before
  rearranging the remaining windows. This extension allows configuring that delay.

## Building

Make sure `gettext` is installed on your system and the `gnome-extensions` executable is available
on your `PATH` (It is typically bundled with `gnome-shell`).

Afterwards, simply run `make` to build a zip suitable for submission to
[EGO](https://extensions.gnome.org/).

`make install` can also be used to install the extension for the current user.

## Packaging

```bash
# Build
make pack

# Install
make install-system PREFIX=/usr
```

For a successful build, these binaries need to be present:
- `gnome-extensions`
- `glib-compile-schemas`
- `unzip`

## Debugging

- `journalctl -f --user` is your friend.
- `make install && dbus-run-session -- gnome-shell --nested --wayland` allows for quick prototyping
  without having to log out and back in every single time when running under wayland.
- `make install`, then `Alt+F2`, `r` and `Enter` allow for quick prototyping under X11.

## Translations

If you're interested in contributing a translation, import the translation template file under
`src/po/template.pot` to your favourite po-editing software and create a `*.po` file under `src/po`.

To update all existing translations after changing the code, run `make po`. To regenerate only the
`template.pot` file, run `make pot`.
