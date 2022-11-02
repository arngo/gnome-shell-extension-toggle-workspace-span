// reference: https://gjs.guide/extensions/development/preferences.html

'use strict';

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
}

function fillPreferencesWindow(window) {
    // Use the same GSettings schema as in `extension.js`
    const settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.toggle-workspace-span');
    
    // Create a preferences page and group
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    // Create a new preferences row
    const row = new Adw.ActionRow({ title: 'Show toggle in quick settings (disable to show on panel)' });
    group.add(row);

    const toggle = new Gtk.Switch({
        active: settings.get_boolean ('show-in-quicksettings'),
        valign: Gtk.Align.CENTER,
    });
    settings.bind(
        'show-in-quicksettings',
        toggle,
        'active',
        Gio.SettingsBindFlags.DEFAULT
    );

    // Add the switch to the row
    row.add_suffix(toggle);
    row.activatable_widget = toggle;

    // Add our page to the window
    window.add(page);
}
