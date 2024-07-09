/**
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
**/

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import { ExtensionPreferences, gettext as _ }
    from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MiddleClickClosePreferences extends ExtensionPreferences {
    getPreferencesWidget() {
        let page = new Adw.PreferencesPage();
        let group = new Adw.PreferencesGroup();

        group.add(this.buildPreference("close-button", {
            nicks: {
                left: _("Left"),
                middle: _("Middle"),
                right: _("Right"),
                'button 4': _("Button 4"),
                'button 5': _("Button 5"),
                'button 6': _("Button 6"),
                'button 7': _("Button 7"),
                'button 8': _("Button 8"),
                'button 9': _("Button 9"),
            },
        }));

        group.add(this.buildPreference("rearrange-delay", {
            step: 50,
        }));

        group.add(this.buildPreference("keyboard-close"))

        page.add(group);
        return page;
    }

    buildPreference(key, opts) {
        opts ??= {}

        const settings = this.getSettings();
        const setting = settings.create_action(key);
        const schema = settings.settings_schema.get_key(key);

        opts.title ??= schema.get_summary() || schema.get_name();
        opts.subtitle ??= schema.get_description();

        const ty = schema.get_value_type().dup_string();
        const [range_ty, range] = schema.get_range().recursiveUnpack();

        if (range_ty == "enum") {
            opts.nicks ??= {};
            let row = new Adw.ComboRow({
                title: opts.title,
                subtitle: opts.subtitle,
                model: new Gtk.StringList({ strings: range.map(nick => opts.nicks[nick]) }),
                selected: range.indexOf(setting.state.unpack()),
            });

            row.connect('notify::selected', () => {
                setting.change_state(GLib.Variant.new_string(range[row.selected]));
            });

            return row;
        } else if (range_ty == "range") {
            opts.lower ??= range[0]
            opts.upper ??= range[1]
        }

        if (ty == "b") {
            let row = new Adw.SwitchRow({
                title: opts.title,
                subtitle: opts.subtitle,
                active: setting.state.unpack()
            });

            row.connect('notify::active', () => {
                setting.change_state(GLib.Variant.new_boolean(row.active));
            });

            return row;

        } else if (ty == "i") {
            let adjustment = new Gtk.Adjustment({
                lower: opts.lower,
                upper: opts.upper,
                step_increment: opts.step,
                value: setting.state.unpack(),
            });

            let row = new Adw.SpinRow({
                title: opts.title,
                subtitle: opts.subtitle,
                numeric: true,
                adjustment,
            });

            adjustment.connect("value-changed", adj => {
                setting.change_state(GLib.Variant.new_int32(adj.value));
            });

            return row;
        }

        // Yeah... I'm not gonna implement a full introspector here. Just add whatever is required
        // when needed.
        throw new GObject.NotImplementedError();
    }
};
