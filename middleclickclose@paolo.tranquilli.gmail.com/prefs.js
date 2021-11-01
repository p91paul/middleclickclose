/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
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
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;

const Gettext = imports.gettext.domain('gnome-shell-extensions-middleclickclose');
const _ = Gettext.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const ExtensionUtils = imports.misc.extensionUtils;

let gsettings;
let settings;
function init() {
    ExtensionUtils.initTranslations();
    gsettings = ExtensionUtils.getSettings();
    settings = {
        close_button: {
            type: "e",
            label: _("Mouse button to close"),
            help: _("Which mouse button triggers closing in overview."),
            list: [
                { nick: "left", name: _("Left"), id: 0 },
                { nick: "middle", name: _("Middle"), id: 1 },
                { nick: "right", name: _("Right"), id: 2 },
                { nick: "button 4", name: _("Button 4"), id: 3 },
                { nick: "button 5", name: _("Button 5"), id: 4 },
                { nick: "button 6", name: _("Button 6"), id: 5 },
                { nick: "button 7", name: _("Button 7"), id: 6 },
                { nick: "button 8", name: _("Button 8"), id: 7 },
                { nick: "button 9", name: _("Button 9"), id: 8 }
            ],
            default: 'middle'
        },
        rearrange_delay: {
            type: "i",
            label: _("Rearrange delay"),
            help: _("How much time must pass with the pointer not moving for windows in overview to rearrange after one was closed."),
            step: 50,
            default: 750
        }
    };
}

function buildPrefsWidget() {
    let frame = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL,
                             'margin-top': 10,
                             'margin-end': 10,
                             'margin-bottom': 10,
                             'margin-start': 10});
    let vbox = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL,
                             'margin-top': 10,
                             'margin-end': 20,
                             'margin-bottom': 20,
                             'margin-start': 20});
    for (setting in settings) {
        hbox = buildHbox(settings, setting);
        vbox.append(hbox);
    }

    frame.append(vbox);

    return frame;
}


function buildHbox(settings, setting) {
    let hbox;

    if (settings[setting].type == 's')
        hbox = createStringSetting(settings, setting);
    if (settings[setting].type == "i")
        hbox = createIntSetting(settings, setting);
    if (settings[setting].type == "b")
        hbox = createBoolSetting(settings, setting);
    if (settings[setting].type == "r")
        hbox = createRangeSetting(settings, setting);
    if (settings[setting].type == "e")
        hbox = createEnumSetting(settings, setting);

    return hbox;
}

function createEnumSetting(settings, setting) {

    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,
                            'margin-top': 5,
                        		spacing: 10});

    let setting_label = new Gtk.Label({label: settings[setting].label,
                                       xalign: 0 });

    let model = new Gtk.ListStore();
    model.set_column_types([GObject.TYPE_INT, GObject.TYPE_STRING]);
    let setting_enum = new Gtk.ComboBox({model: model});
    setting_enum.get_style_context().add_class('raised');
    let renderer = new Gtk.CellRendererText();
    setting_enum.pack_start(renderer, true);
    setting_enum.add_attribute(renderer, 'text', 1);

    for (let i=0; i<settings[setting].list.length; i++) {
        let item = settings[setting].list[i];
        let iter = model.append();
        model.set(iter, [0, 1], [item.id, item.name]);
        if (item.id == gsettings.get_enum(setting.replace('_', '-'))) {
            setting_enum.set_active(item.id);
        }
    }

    setting_enum.connect('changed', function(entry) {
        let [success, iter] = setting_enum.get_active_iter();
        if (!success)
            return;

        let id = model.get_value(iter, 0)
        gsettings.set_enum(setting.replace('_', '-'), id);

    });

    if (settings[setting].help) {
        setting_label.set_tooltip_text(settings[setting].help)
        setting_enum.set_tooltip_text(settings[setting].help)
    }

    hbox.append(setting_label);
    hbox.append(setting_enum);

    return hbox;

}

function createStringSetting(settings, setting) {

    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,
                            'margin-top': 5,
                        		spacing: 10});

    let setting_label = new Gtk.Label({label: settings[setting].label,
                                       xalign: 0 });

    let setting_string = new Gtk.Entry({text: gsettings.get_string(setting.replace('_', '-'))});
    setting_string.set_width_chars(30);
    setting_string.connect('notify::text', function(entry) {
        gsettings.set_string(setting.replace('_', '-'), entry.text);
    });

    if (settings[setting].mode == "passwd") {
        setting_string.set_visibility(false);
    }

    if (settings[setting].help) {
        setting_label.set_tooltip_text(settings[setting].help)
        setting_string.set_tooltip_text(settings[setting].help)
    }

    hbox.append(setting_label);
    hbox.append(setting_string);

    return hbox;
}

function createIntSetting(settings, setting) {

    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,
                            'margin-top': 5,
                            spacing: 10});

    let setting_label = new Gtk.Label({label: settings[setting].label,
                                       xalign: 0 });

    let adjustment = new Gtk.Adjustment({ lower: settings[setting].min || 0,
                                          upper: settings[setting].max || 65535,
                                          step_increment: settings[setting].step || 1});
    let setting_int = new Gtk.SpinButton({adjustment: adjustment});
    setting_int.set_value(gsettings.get_int(setting.replace('_', '-')));
    setting_int.connect('value-changed', function(entry) {
        gsettings.set_int(setting.replace('_', '-'), entry.value);
    });

    if (settings[setting].help) {
        setting_label.set_tooltip_text(settings[setting].help)
        setting_int.set_tooltip_text(settings[setting].help)
    }

    hbox.append(setting_label);
    hbox.append(setting_int);

    return hbox;
}

function createBoolSetting(settings, setting) {

    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,
                            'margin-top': 5,
                            spacing: 10});

    let setting_label = new Gtk.Label({label: settings[setting].label,
                                       xalign: 0 });

    let setting_switch = new Gtk.Switch({active: gsettings.get_boolean(setting.replace('_', '-'))});
    setting_switch.connect('notify::active', function(button) {
        gsettings.set_boolean(setting.replace('_', '-'), button.active);
    });

    if (settings[setting].help) {
        setting_label.set_tooltip_text(settings[setting].help)
        setting_switch.set_tooltip_text(settings[setting].help)
    }

    hbox.append(setting_label);
    hbox.append(setting_switch);

    return hbox;
}

function createRangeSetting(settings, setting) {

    let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL,
                             spacing: 10 });

    let setting_label = new Gtk.Label({ label: settings[setting].label,
                                        xalign: 0 });

    let setting_range = Gtk.HScale.new_with_range(settings[setting].min,
                                                  settings[setting].max,
                                                  settings[setting].step);
    setting_range.set_value(gsettings.get_int(setting));
    setting_range.set_draw_value(false);
    setting_range.add_mark(settings[setting].default,
                           Gtk.PositionType.BOTTOM, null);
    setting_range.set_size_request(200, -1);
    setting_range.connect('value-changed', function(slider) {
        gsettings.set_int(setting, slider.get_value());
    });

    if (settings[setting].help) {
        setting_label.set_tooltip_text(settings[setting].help)
        setting_range.set_tooltip_text(settings[setting].help)
    }

    hbox.append(setting_label);
    hbox.append(setting_range);

    return hbox;
}
