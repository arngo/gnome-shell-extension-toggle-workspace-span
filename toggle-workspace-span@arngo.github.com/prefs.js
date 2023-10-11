// reference: https://gjs.guide/extensions/development/preferences.html

'use strict';

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MyExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const page = new Adw.PreferencesPage();
        window.add(page);
        const group = new Adw.PreferencesGroup();
        page.add(group);
        const row = new Adw.SwitchRow({
            title: 'Show toggle in quick settings',
            subtitle: 'Disable to show toggle button on panel'
        });
        group.add(row);

        window._settings = this.getSettings();
        window._settings.bind(
            'show-in-quicksettings',
            row,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

    }
}
